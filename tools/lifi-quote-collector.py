#!/usr/bin/env python3
"""
LI.FI 最小报价采集脚本（只读）
==============================
目的：采集同一资产跨链的 Quote / Routes，输出标准化的成本字段 JSON。
原则：只读，绝不签名、绝不广播交易。

用法：
    python3 lifi-quote-collector.py
    python3 lifi-quote-collector.py --amount 0.1 --output quotes.json

依赖：Python 3.8+，仅标准库（urllib）。
"""

import argparse
import json
import sys
import time
import urllib.parse
import urllib.request

# LI.FI 常量
BASE_URL = "https://li.quest/v1"
USER_AGENT = "arbitrage-research/0.1 (co-learning data collector)"

# 常用代币（避免每次查地址）
TOKENS = {
    "ETH":    {"chainId": 1,     "address": "0x0000000000000000000000000000000000000000", "decimals": 18},
    "USDC":   {"chainId": 42161, "address": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", "decimals": 6},
    "USDC.e": {"chainId": 42161, "address": "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", "decimals": 6},
    "USDT":   {"chainId": 42161, "address": "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", "decimals": 6},
}

# 桥/DEX 集合（白名单，可按需调整）
TOOLS_ALLOWLIST = ["across", "stargateV2", "relaydepository", "celercircle", "1inch", "paraswap"]


def api_get(path: str, params: dict) -> dict:
    """GET LI.FI API 并返回 JSON。"""
    url = f"{BASE_URL}{path}?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def normalize_amount(amount: float, decimals: int) -> str:
    """把人类可读金额转成链上最小单位字符串。"""
    return str(int(amount * (10 ** decimals)))


def collect_quote(from_chain: int, to_chain: int,
                  from_token: str, to_token: str,
                  from_amount: str, from_address: str) -> dict:
    """采集单条最优 Quote。"""
    params = {
        "fromChain": from_chain,
        "toChain": to_chain,
        "fromToken": from_token,
        "toToken": to_token,
        "fromAmount": from_amount,
        "fromAddress": from_address,
    }
    try:
        data = api_get("/quote", params)
        estimate = data.get("estimate", {})
        action = data.get("action", {})
        fees = estimate.get("feeCosts", [])
        return {
            "ok": True,
            "ts": int(time.time()),
            "tool": data.get("tool"),
            "fromChain": from_chain,
            "toChain": to_chain,
            "fromAmount": from_amount,
            "toAmount": estimate.get("toAmount"),
            "toAmountMin": estimate.get("toAmountMin"),
            "slippage": action.get("slippage"),
            "fees": [
                {
                    "name": f.get("name"),
                    "tokenSymbol": f.get("token", {}).get("symbol"),
                    "amount": f.get("amount"),
                    "amountUSD": f.get("amountUSD"),
                    "percentage": f.get("percentage"),
                }
                for f in fees
            ],
            "raw": data,
        }
    except Exception as exc:  # noqa: BLE001
        return {"ok": False, "ts": int(time.time()), "error": str(exc)}


def collect_routes(from_chain: int, to_chain: int,
                   from_token: str, to_token: str,
                   from_amount: str, from_address: str,
                   limit: int = 5) -> dict:
    """采集多条候选 Route，用于路径对比。"""
    body = {
        "fromChainId": from_chain,
        "toChainId": to_chain,
        "fromTokenAddress": from_token,
        "toTokenAddress": to_token,
        "fromAmount": from_amount,
        "fromAddress": from_address,
    }
    url = f"{BASE_URL}/advanced/routes"
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url, data=data, method="POST",
        headers={"User-Agent": USER_AGENT, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read().decode("utf-8"))

    routes = []
    for r in result.get("routes", [])[:limit]:
        routes.append({
            "tool": r.get("steps", [{}])[0].get("tool") if r.get("steps") else None,
            "toAmount": r.get("toAmount"),
            "toAmountMin": r.get("toAmountMin"),
            "steps": len(r.get("steps", [])),
        })
    return {"ts": int(time.time()), "routes": routes}


def main() -> None:
    parser = argparse.ArgumentParser(description="LI.FI 只读报价采集")
    parser.add_argument("--amount", type=float, default=0.1, help="转账金额（人类可读，默认 0.1）")
    parser.add_argument("--from-chain", type=int, default=1, help="源链 ID，默认 1(Ethereum)")
    parser.add_argument("--to-chain", type=int, default=42161, help="目标链 ID，默认 42161(Arbitrum)")
    parser.add_argument("--from-token", default="ETH", help="源代币符号或地址")
    parser.add_argument("--to-token", default="USDC", help="目标代币符号或地址")
    parser.add_argument("--from-address", default="0x552008c0f6872d7aa9e46e4b5a8c4a8f8f8f8f8f",
                        help="模拟 fromAddress（仅用于报价，不签名）")
    parser.add_argument("--output", default="quotes.json", help="输出文件")
    args = parser.parse_args()

    # 解析代币
    def resolve_token(sym: str):
        if sym in TOKENS:
            return TOKENS[sym]
        # 假设是 0x 地址，decimals 未知则按 18
        return {"chainId": args.from_chain, "address": sym, "decimals": 18}

    from_tok = resolve_token(args.from_token)
    to_tok = resolve_token(args.to_token)
    from_amount = normalize_amount(args.amount, from_tok["decimals"])

    print(f"# 采集 {args.amount} {args.from_token} "
          f"({args.from_chain}) -> {args.to_token} ({args.to_chain})")

    # 1) 最优 Quote
    quote = collect_quote(args.from_chain, args.to_chain,
                          from_tok["address"], to_tok["address"],
                          from_amount, args.from_address)
    print(json.dumps({k: v for k, v in quote.items() if k != "raw"}, ensure_ascii=False, indent=2))

    # 2) 候选 Routes
    routes = collect_routes(args.from_chain, args.to_chain,
                            from_tok["address"], to_tok["address"],
                            from_amount, args.from_address)
    print("\n# 候选路由（路径对比）")
    for r in routes["routes"]:
        print(f"  {r['tool']:<20} toAmount={r['toAmount']}  steps={r['steps']}")

    # 3) 落盘（保留原始响应供后续分析）
    payload = {"quote": quote, "routes": routes}
    with open(args.output, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=2)
    print(f"\n# 已保存 -> {args.output}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(130)
