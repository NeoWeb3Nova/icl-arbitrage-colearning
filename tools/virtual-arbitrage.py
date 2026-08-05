#!/usr/bin/env python3
"""只读虚拟跨链套利：ETH -> USDC -> ETH。

只请求 LI.FI 报价，不签名、不广播交易。

用法：
    python3 tools/virtual-arbitrage.py
    python3 tools/virtual-arbitrage.py --amount 0.1 --save outputs/virtual-arbitrage.json
    python3 tools/virtual-arbitrage.py --self-test
"""

import argparse
import json
import os
from pathlib import Path
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from decimal import Decimal, InvalidOperation

BASE_URL = "https://li.quest/v1"
DEMO_ADDRESS = "0x552008c0f6872d7aa9e46e4b5a8c4a8f8f8f8f8f"
TOKENS = {
    "ETH": {
        "chainId": 1,
        "address": "0x0000000000000000000000000000000000000000",
        "decimals": 18,
    },
    "USDC": {
        "chainId": 42161,
        "address": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        "decimals": 6,
    },
}


def headers() -> dict:
    result = {"User-Agent": "arbitrage-research-virtual/0.1"}
    if os.getenv("LIFI_API_KEY"):
        result["x-lifi-api-key"] = os.environ["LIFI_API_KEY"]
    return result


def api_get(path: str, params: dict) -> dict:
    url = f"{BASE_URL}{path}?" + urllib.parse.urlencode(params)
    request = urllib.request.Request(url, headers=headers())
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"LI.FI HTTP {exc.code}: {detail[:500]}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"LI.FI network error: {exc.reason}") from exc


def to_units(value: str, decimals: int) -> int:
    """Convert a human amount to integer base units without float rounding."""
    amount = Decimal(value)
    if amount <= 0:
        raise ValueError("amount must be greater than zero")
    scaled = amount * (Decimal(10) ** decimals)
    if scaled != scaled.to_integral_value():
        raise ValueError(f"amount has more than {decimals} decimal places")
    return int(scaled)


def from_units(value: str, decimals: int) -> Decimal:
    return Decimal(value) / (Decimal(10) ** decimals)


def quote_leg(from_symbol: str, to_symbol: str, amount: str) -> dict:
    source = TOKENS[from_symbol]
    target = TOKENS[to_symbol]
    return api_get("/quote", {
        "fromChain": source["chainId"],
        "toChain": target["chainId"],
        "fromToken": source["address"],
        "toToken": target["address"],
        "fromAmount": amount,
        "fromAddress": DEMO_ADDRESS,
    })


def amount(quote: dict, field: str) -> int:
    value = quote.get("estimate", {}).get(field)
    if value is None:
        raise RuntimeError(f"quote missing estimate.{field}")
    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise RuntimeError(f"invalid estimate.{field}: {value!r}") from exc


def fee_rows(quote: dict) -> list[dict]:
    estimate = quote.get("estimate", {})
    rows = []
    for key in ("feeCosts", "gasCosts"):
        for item in estimate.get(key, []) or []:
            rows.append({
                "category": key,
                "name": item.get("name") or item.get("type"),
                "token": item.get("token", {}).get("symbol"),
                "amount": item.get("amount"),
                "amountUSD": item.get("amountUSD"),
                "included": item.get("included"),
                "percentage": item.get("percentage"),
            })
    return rows


def leg_summary(label: str, from_symbol: str, to_symbol: str, quote: dict, input_amount: int) -> dict:
    target_decimals = TOKENS[to_symbol]["decimals"]
    estimate = quote.get("estimate", {})
    return {
        "label": label,
        "from": from_symbol,
        "to": to_symbol,
        "tool": quote.get("tool"),
        "toolName": quote.get("toolDetails", {}).get("name"),
        "fromAmount": str(input_amount),
        "toAmount": str(amount(quote, "toAmount")),
        "toAmountMin": str(amount(quote, "toAmountMin")),
        "toAmountHuman": str(from_units(str(amount(quote, "toAmount")), target_decimals)),
        "toAmountMinHuman": str(from_units(str(amount(quote, "toAmountMin")), target_decimals)),
        "toAmountUSD": estimate.get("toAmountUSD"),
        "executionDuration": estimate.get("executionDuration"),
        "fees": fee_rows(quote),
        "raw": quote,
    }


def calculate(initial_eth: int, leg1: dict, leg2_theoretical: dict, leg2_conservative: dict) -> dict:
    theoretical_return = int(leg2_theoretical["toAmount"])
    conservative_return = int(leg2_conservative["toAmountMin"])
    return {
        "initialETHWei": str(initial_eth),
        "theoreticalReturnETHWei": str(theoretical_return),
        "conservativeReturnETHWei": str(conservative_return),
        "theoreticalNetETHWei": str(theoretical_return - initial_eth),
        "conservativeNetETHWei": str(conservative_return - initial_eth),
        "theoreticalReturnETH": str(from_units(str(theoretical_return), 18)),
        "conservativeReturnETH": str(from_units(str(conservative_return), 18)),
        "theoreticalNetETH": str(from_units(str(theoretical_return - initial_eth), 18)),
        "conservativeNetETH": str(from_units(str(conservative_return - initial_eth), 18)),
        "theoreticalProfitable": theoretical_return > initial_eth,
        "conservativeProfitable": conservative_return > initial_eth,
        "method": "toAmountMin is used for the conservative result; included fees are not subtracted twice",
        "leg1ConservativeUSDC": leg1["toAmountMin"],
    }


def print_report(result: dict) -> None:
    leg1 = result["leg1"]
    leg2 = result["leg2Theoretical"]
    leg2c = result["leg2Conservative"]
    calc = result["calculation"]
    print("只读虚拟套利：Ethereum ETH -> Arbitrum USDC -> Ethereum ETH")
    print("状态：报价模拟；未签名、未广播、未成交\n")
    print("① 买入腿：ETH -> USDC")
    print(f"   路由：{leg1['tool']} ({leg1['toolName']})")
    print(f"   输入：{from_units(leg1['fromAmount'], 18)} ETH")
    print(f"   理论到账：{leg1['toAmountHuman']} USDC")
    print(f"   保守到账：{leg1['toAmountMinHuman']} USDC")
    print(f"   费用项：{len(leg1['fees'])} 条")
    print("\n② 卖出腿：USDC -> ETH")
    print(f"   理论输入：{from_units(leg2['fromAmount'], 6)} USDC")
    print(f"   理论到账：{leg2['toAmountHuman']} ETH")
    print(f"   保守路径输入：{from_units(leg2c['fromAmount'], 6)} USDC")
    print(f"   保守到账：{leg2c['toAmountMinHuman']} ETH")
    print(f"   费用项：理论 {len(leg2['fees'])} 条；保守 {len(leg2c['fees'])} 条")
    print("\n③ 净收益（统一用 ETH 结算）")
    print(f"   理论返回：{calc['theoreticalReturnETH']} ETH")
    print(f"   理论净收益：{calc['theoreticalNetETH']} ETH")
    print(f"   保守返回：{calc['conservativeReturnETH']} ETH")
    print(f"   保守净收益：{calc['conservativeNetETH']} ETH")
    print(f"   理论判断：{'正收益' if calc['theoreticalProfitable'] else '无正收益'}")
    print(f"   保守判断：{'正收益' if calc['conservativeProfitable'] else '无正收益'}")
    print("\n④ 严格性检查")
    print(f"   两腿资产连续：{'通过' if leg2['fromAmount'] == leg1['toAmount'] else '失败'}")
    print(f"   保守腿资产连续：{'通过' if leg2c['fromAmount'] == leg1['toAmountMin'] else '失败'}")
    print("   费用处理：已保留两腿 feeCosts/gasCosts；不对已包含费用重复扣除")


def self_test() -> None:
    assert to_units("0.1", 18) == 100000000000000000
    assert to_units("187.050032", 6) == 187050032
    assert from_units("187050032", 6) == Decimal("187.050032")
    assert calculate(
        100,
        {"toAmountMin": "90"},
        {"toAmount": "110"},
        {"toAmountMin": "95"},
    )["conservativeNetETHWei"] == "-5"
    try:
        to_units("0.0000001", 6)
    except ValueError:
        pass
    else:
        raise AssertionError("precision validation failed")
    print("self-test: ok")


def main() -> None:
    parser = argparse.ArgumentParser(description="LI.FI 两腿虚拟套利报价")
    parser.add_argument("--amount", default="0.1", help="初始 ETH 数量，默认 0.1")
    parser.add_argument("--save", default="", help="保存完整 JSON（含两腿原始响应）")
    parser.add_argument("--self-test", action="store_true", help="运行本地自检，不请求网络")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return

    initial_eth = to_units(args.amount, 18)
    print("正在请求第一腿报价（ETH -> USDC）...")
    quote1 = quote_leg("ETH", "USDC", str(initial_eth))
    leg1 = leg_summary("leg1", "ETH", "USDC", quote1, initial_eth)

    print("正在请求理论第二腿报价（使用第一腿 toAmount）...")
    quote2 = quote_leg("USDC", "ETH", leg1["toAmount"])
    leg2 = leg_summary("leg2-theoretical", "USDC", "ETH", quote2, int(leg1["toAmount"]))

    print("正在请求保守第二腿报价（使用第一腿 toAmountMin）...")
    quote2c = quote_leg("USDC", "ETH", leg1["toAmountMin"])
    leg2c = leg_summary("leg2-conservative", "USDC", "ETH", quote2c, int(leg1["toAmountMin"]))

    result = {
        "ts": int(time.time()),
        "readOnly": True,
        "strategy": "ETH -> USDC -> ETH",
        "initialAmount": args.amount,
        "leg1": leg1,
        "leg2Theoretical": leg2,
        "leg2Conservative": leg2c,
        "calculation": calculate(initial_eth, leg1, leg2, leg2c),
    }
    print_report(result)
    if args.save:
        output_path = Path(args.save)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with output_path.open("w", encoding="utf-8") as output:
            json.dump(result, output, ensure_ascii=False, indent=2)
        print(f"\n完整证据已保存：{output_path}")


if __name__ == "__main__":
    try:
        main()
    except (InvalidOperation, ValueError, RuntimeError, KeyError) as exc:
        print(f"错误：{exc}", file=sys.stderr)
        sys.exit(1)
    except KeyboardInterrupt:
        sys.exit(130)
