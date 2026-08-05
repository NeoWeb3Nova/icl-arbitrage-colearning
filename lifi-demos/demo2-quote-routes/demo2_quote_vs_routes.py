#!/usr/bin/env python3
"""
Demo 2: 报价与路由对比（Quote / Advanced Routes / 费用拆解）
=============================================================
核心价值：同一笔跨链转账，到底有多少条路可以走？每条路到账差多少？
费用（LIFI Fee / 桥费 / Gas / 滑点）分别花在哪？—— 这正是跨链套利研究的起点。

与仓库已有 tools/lifi-quote-collector.py 不同，本 demo 聚焦"对比与讲解"：
  - 同时拉取 单条最优 Quote 与 全部候选 Routes
  - 对每条路由做费用拆解（feeCosts + gasCosts）
  - 打印人类可读对比表，并可选落盘 JSON

运行（仅 Python 标准库，无需 API Key）：
    python3 demo2_quote_vs_routes.py
    python3 demo2_quote_vs_routes.py --amount 1 --save routes.json

只读、不签名、不广播任何交易。
"""

import argparse
import json
import time
import urllib.parse
import urllib.request

BASE_URL = "https://li.quest/v1"
USER_AGENT = "arbitrage-research-demo2/0.1"

# 演示用地址：仅用于报价（fromAddress 是必填项），不会发生真实交易
DEMO_ADDRESS = "0x552008c0f6872d7aa9e46e4b5a8c4a8f8f8f8f8f"

# 常用代币速查（演示用，完整列表可用 /v1/tokens 拉取）
TOKENS = {
    "ETH":  {"chainId": 1,     "address": "0x0000000000000000000000000000000000000000", "decimals": 18},
    "USDC": {"chainId": 42161, "address": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", "decimals": 6},
}


def api_get(path: str, params: dict) -> dict:
    url = f"{BASE_URL}{path}?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def api_post(path: str, body: dict) -> dict:
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_URL}{path}", data=data, method="POST",
        headers={"User-Agent": USER_AGENT, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fmt_usd(x) -> str:
    """把数字或字符串转成 USD 格式。"""
    try:
        return f"${float(x):,.4f}"
    except (TypeError, ValueError):
        return str(x)


def fee_summary(route: dict) -> str:
    """把 route 的 feeCosts + gasCosts 压成一行小结。"""
    parts = []
    for fee in route.get("estimate", {}).get("feeCosts", []):
        parts.append(f"{fee['name']}={fmt_usd(fee.get('amountUSD'))}")
    for gas in route.get("estimate", {}).get("gasCosts", []):
        parts.append(f"gas({gas['type']})={fmt_usd(gas.get('amountUSD'))}")
    return " + ".join(parts) if parts else "-"


def main() -> None:
    parser = argparse.ArgumentParser(description="LI.FI 报价与路由对比 demo")
    parser.add_argument("--amount", type=float, default=0.1, help="金额（ETH，默认 0.1）")
    parser.add_argument("--save", default="", help="可选：落盘 JSON 文件路径")
    args = parser.parse_args()

    from_tok = TOKENS["ETH"]
    to_tok = TOKENS["USDC"]
    from_amount = str(int(args.amount * 10 ** from_tok["decimals"]))

    print(f"🧪 对比任务：{args.amount} ETH (Ethereum, id=1) -> USDC (Arbitrum, id=42161)\n")

    # 1) 单条最优 Quote
    quote = api_get("/quote", {
        "fromChain": from_tok["chainId"],
        "toChain": to_tok["chainId"],
        "fromToken": from_tok["address"],
        "toToken": to_tok["address"],
        "fromAmount": from_amount,
        "fromAddress": DEMO_ADDRESS,
    })
    est = quote.get("estimate", {})
    print(f"① 最优报价（单条）:")
    print(f"   工具:     {quote.get('tool')} ({quote.get('toolDetails', {}).get('name')})")
    print(f"   预计到手: {est.get('toAmount')} USDC ≈ {fmt_usd(est.get('toAmountUSD'))}")
    print(f"   最低到手: {est.get('toAmountMin')} USDC（滑点保护线）")
    print(f"   预计耗时: {est.get('executionDuration')} 秒")
    print(f"   费用拆解: {fee_summary(quote)}")

    # 2) 全部候选 Routes
    routes = api_post("/advanced/routes", {
        "fromChainId": from_tok["chainId"],
        "toChainId": to_tok["chainId"],
        "fromTokenAddress": from_tok["address"],
        "toTokenAddress": to_tok["address"],
        "fromAmount": from_amount,
        "fromAddress": DEMO_ADDRESS,
    })["routes"]

    print(f"\n② 候选路由：共 {len(routes)} 条（按 toAmount 从高到低排序）")
    routes_sorted = sorted(routes, key=lambda r: int(r["toAmount"]), reverse=True)
    for i, r in enumerate(routes_sorted, 1):
        first_step = r.get("steps", [{}])[0] if r.get("steps") else {}
        tool = first_step.get("tool", "?")
        tool_name = first_step.get("toolDetails", {}).get("name", "")
        print(f"   #{i:<2} {tool:<18} toAmount={int(r['toAmount']):>10}  "
              f"min={int(r['toAmountMin']):>10}  steps={len(r.get('steps', []))}")

    # 3) 对比结论
    best = routes_sorted[0]
    worst = routes_sorted[-1]
    diff = (int(best["toAmount"]) - int(worst["toAmount"])) / 10 ** to_tok["decimals"]
    print(f"\n③ 对比结论：")
    print(f"   最优路由到账 {int(best['toAmount'])}，最差 {int(worst['toAmount'])}，"
          f"差距 ≈ {diff:.6f} USDC")
    print(f"   同一笔转账有 {len(routes)} 条可行路径 —— 路径差异 = 套利研究的起点。")

    if args.save:
        payload = {
            "ts": int(time.time()),
            "amount": args.amount,
            "quote": quote,
            "routes": routes,
        }
        with open(args.save, "w", encoding="utf-8") as fh:
            json.dump(payload, fh, ensure_ascii=False, indent=2)
        print(f"\n✅ 原始 JSON 已保存 -> {args.save}")


if __name__ == "__main__":
    main()
