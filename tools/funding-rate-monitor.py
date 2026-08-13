#!/usr/bin/env python3
"""Compare current perpetual funding rates for 10 major assets across four venues."""

import argparse
import json
import os
import time
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path

import ccxt

ASSETS = ("BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "LINK", "SUI")
VENUES = {
    "Binance": ("binanceusdm", "USDT"),
    "Bybit": ("bybit", "USDT"),
    "OKX": ("okx", "USDT"),
    "Hyperliquid": ("hyperliquid", "USDC"),
}


def iso_time(milliseconds=None):
    if milliseconds is None:
        return datetime.now(timezone.utc).isoformat()
    return datetime.fromtimestamp(milliseconds / 1000, timezone.utc).isoformat()


def interval_hours(venue, rate, binance_intervals):
    interval = rate.get("interval")
    if interval and interval.endswith("h"):
        return Decimal(interval[:-1])
    info = rate.get("info") or {}
    if info.get("fundingIntervalHour"):
        return Decimal(info["fundingIntervalHour"])
    if info.get("nextFundingTime") and info.get("fundingTime"):
        return Decimal(int(info["nextFundingTime"]) - int(info["fundingTime"])) / Decimal(3_600_000)
    if info.get("fundingTime") and info.get("prevFundingTime"):
        return Decimal(int(info["fundingTime"]) - int(info["prevFundingTime"])) / Decimal(3_600_000)
    if venue == "Binance":
        return Decimal(binance_intervals.get(info.get("symbol"), 8))
    if venue == "Hyperliquid":
        return Decimal(1)
    raise ValueError("funding interval missing")


def fetch_venue(venue, exchange_id, settle, attempts=3):
    proxy = os.getenv("HTTPS_PROXY") or os.getenv("https_proxy")
    config = {"enableRateLimit": True, "timeout": 30_000}
    if venue == "Bybit":
        config["options"] = {"defaultType": "swap"}
    if proxy:
        config["httpsProxy"] = proxy
    exchange = getattr(ccxt, exchange_id)(config)
    symbols = [f"{asset}/{settle}:{settle}" for asset in ASSETS]
    try:
        symbol_errors = {}
        try:
            rates = retry_network(lambda: exchange.fetch_funding_rates(symbols), attempts)
        except ccxt.BadSymbol:
            rates = {}
            for symbol in symbols:
                try:
                    rates[symbol] = retry_network(lambda symbol=symbol: exchange.fetch_funding_rate(symbol), attempts)
                except Exception as exc:
                    symbol_errors[symbol] = exc

        binance_intervals = {}
        if venue == "Binance":
            try:
                rows = retry_network(exchange.fapiPublicGetFundingInfo, attempts)
                binance_intervals = {row["symbol"]: row["fundingIntervalHours"] for row in rows}
            except (ccxt.NetworkError, ccxt.RequestTimeout):
                pass

        results = []
        for asset, symbol in zip(ASSETS, symbols):
            try:
                if symbol in symbol_errors:
                    raise symbol_errors[symbol]
                rate = rates[symbol]
                raw_rate = Decimal(str(rate["fundingRate"]))
                hours = interval_hours(venue, rate, binance_intervals)
                if hours <= 0:
                    raise ValueError(f"invalid interval: {hours}")
                results.append({
                    "asset": asset,
                    "venue": venue,
                    "symbol": symbol,
                    "raw_rate": str(raw_rate),
                    "interval_hours": str(hours),
                    "hourly_rate": str(raw_rate / hours),
                    "funding_time": iso_time(rate.get("fundingTimestamp")),
                    "collected_at": iso_time(),
                    "status": "ok",
                    "raw": rate.get("info"),
                })
            except Exception as exc:
                results.append(error_row(asset, venue, symbol, exc))
        return results
    except Exception as exc:
        return [error_row(asset, venue, symbol, exc) for asset, symbol in zip(ASSETS, symbols)]
    finally:
        exchange.close()


def retry_network(call, attempts):
    for attempt in range(attempts):
        try:
            return call()
        except (ccxt.NetworkError, ccxt.RequestTimeout):
            if attempt == attempts - 1:
                raise
            time.sleep(attempt + 1)


def error_row(asset, venue, symbol, exc):
    return {
        "asset": asset,
        "venue": venue,
        "symbol": symbol,
        "collected_at": iso_time(),
        "status": "error",
        "error": f"{type(exc).__name__}: {exc}",
    }


def rank_asset(rows):
    successful = [row for row in rows if row["status"] == "ok"]
    successful.sort(key=lambda row: Decimal(row["hourly_rate"]), reverse=True)
    if len(successful) < 2:
        return successful, []
    highest = Decimal(successful[0]["hourly_rate"])
    return successful, [row["venue"] for row in successful if Decimal(row["hourly_rate"]) == highest]


def rank_all(results):
    rankings, winners = {}, {}
    for asset in ASSETS:
        rankings[asset], winners[asset] = rank_asset([row for row in results if row["asset"] == asset])
    return rankings, winners


def ranking_marker(ranked):
    return "🏆" if len(ranked) == len(VENUES) else f"⚠ 部分排名 {len(ranked)}/{len(VENUES)}"


def self_test():
    rows = [
        {"asset": "BTC", "venue": "A", "status": "ok", "hourly_rate": "0.00001"},
        {"asset": "BTC", "venue": "B", "status": "ok", "hourly_rate": "-0.00001"},
        {"asset": "BTC", "venue": "C", "status": "ok", "hourly_rate": "0.00001"},
        {"asset": "BTC", "venue": "D", "status": "error"},
    ]
    ranked, winners = rank_asset(rows)
    assert [row["venue"] for row in ranked] == ["A", "C", "B"]
    assert winners == ["A", "C"]
    assert rank_asset([rows[0], rows[3]])[1] == []
    assert ranking_marker(ranked) == "⚠ 部分排名 3/4"
    assert ranking_marker(ranked + [{"venue": "D"}]) == "🏆"
    assert interval_hours("Binance", {"info": {"symbol": "BTCUSDT"}}, {}) == 8
    assert interval_hours(
        "OKX",
        {"info": {"prevFundingTime": "0", "fundingTime": "28800000", "nextFundingTime": "57600000"}},
        {},
    ) == 8
    print("self-test: PASS")


def print_report(results, rankings, winners):
    print(f"\n10 大主流币永续资金费率｜{iso_time()}\n")
    print("按每小时标准化费率排名；正数表示空头收取，负数表示多头收取。\n")

    ordered_assets = sorted(
        ASSETS,
        key=lambda asset: Decimal(rankings[asset][0]["hourly_rate"]) if rankings[asset] else Decimal("-Infinity"),
        reverse=True,
    )
    for index, asset in enumerate(ordered_assets, 1):
        ranked = rankings[asset]
        if not ranked or not winners[asset]:
            print(f"{index:>2}. {asset:<5} 数据不足")
            continue
        top = ranked[0]
        hourly = Decimal(top["hourly_rate"])
        cashflow = hourly * Decimal(10_000)
        direction = "空头收" if hourly >= 0 else "多头收"
        venue_rates = "  ".join(f"{row['venue']} {Decimal(row['hourly_rate']):.6%}" for row in ranked)
        print(f"{index:>2}. {asset:<5} {ranking_marker(ranked)} {','.join(winners[asset])} {hourly:.6%}/h｜$10k {direction} ${abs(cashflow):.3f}/h")
        print(f"    {venue_rates}")

    failures = [row for row in results if row["status"] == "error"]
    if failures:
        print(f"\n⚠ {len(failures)} 个市场获取失败：")
        for row in failures:
            print(f"- {row['asset']} {row['venue']}: {row['error']}")

    print("\n边界：仅为公开报价的理论资金费，不含手续费、滑点、价差、保证金与清算风险；不是可执行套利结论。")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--jsonl", type=Path, help="append full evidence as one JSON line")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return

    results = []
    for venue, (exchange_id, settle) in VENUES.items():
        results.extend(fetch_venue(venue, exchange_id, settle))
    rankings, winners = rank_all(results)
    print_report(results, rankings, winners)

    if args.jsonl:
        args.jsonl.parent.mkdir(parents=True, exist_ok=True)
        record = {
            "collected_at": iso_time(),
            "assets": list(ASSETS),
            "coverage": {asset: len(rankings[asset]) for asset in ASSETS},
            "winners": winners,
            "results": results,
        }
        with args.jsonl.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record, ensure_ascii=False, separators=(",", ":")) + "\n")


if __name__ == "__main__":
    main()
