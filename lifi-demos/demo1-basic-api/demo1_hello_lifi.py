#!/usr/bin/env python3
"""
Demo 1: LI.FI REST API 五大端点入门（Hello, LI.FI!）
=====================================================
新手第一个 demo：只用 Python 标准库，调通 LI.FI 最核心的 5 个端点，
搞清"LI.FI 到底支持哪些链、哪些币、哪些桥"。

运行（无需安装任何依赖 / 无需 API Key）：
    python3 demo1_hello_lifi.py

也可以传入参数：
    python3 demo1_hello_lifi.py --chain ethereum --top 5

只读、不签名、不广播任何交易，可放心运行。
"""

import argparse
import json
import os
import urllib.parse
import urllib.request
from collections import Counter

BASE_URL = "https://li.quest/v1"
USER_AGENT = "arbitrage-research-demo1/0.1"
HEADERS = {
    "User-Agent": USER_AGENT,
    **({"x-lifi-api-key": os.environ["LIFI_API_KEY"]} if os.getenv("LIFI_API_KEY") else {}),
}


def api_get(path: str, params: dict | None = None) -> dict:
    """GET LI.FI API 的公共端点。"""
    url = f"{BASE_URL}{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main() -> None:
    parser = argparse.ArgumentParser(description="LI.FI 五大端点入门 demo")
    parser.add_argument("--chain", default="eth",
                        help="想重点查看的链 key（默认 eth，见 /v1/chains 的 key 字段）")
    parser.add_argument("--top", type=int, default=5,
                        help="列表只显示前 N 条（默认 5）")
    args = parser.parse_args()

    # 1) 支持的链
    chains = api_get("/chains")["chains"]
    print(f"① 支持的链：共 {len(chains)} 条")
    for c in chains[:args.top]:
        print(f"   - {c['key']:<16} id={c['id']:<6} {c['name']}")

    # 2) 支持的代币（按链过滤；响应字典的键是链 ID）
    tokens_resp = api_get("/tokens", {"chains": args.chain})
    tokens = next(iter(tokens_resp["tokens"].values()), [])
    print(f"\n② 链 [{args.chain}] 上的代币：共 {len(tokens)} 个")
    for t in tokens[:args.top]:
        print(f"   - {t['symbol']:<8} {t['name'][:32]:<34} {t['address'][:14]}...")

    # 3) 支持的桥 与 4) DEX
    tools = api_get("/tools")
    bridges, exchanges = tools["bridges"], tools["exchanges"]
    print(f"\n③ 支持的桥：共 {len(bridges)} 个")
    for b in bridges[:args.top]:
        print(f"   - {b['key']:<18} {b['name']}")
    print(f"\n④ 支持的 DEX / 聚合器：共 {len(exchanges)} 个")
    for d in exchanges[:args.top]:
        print(f"   - {d['key']:<18} {d['name']}")

    # 5) 每条链支持多少种代币（快速感知 LI.FI 覆盖度）
    print("\n⑤ 代币覆盖 Top 链：")
    all_tokens = api_get("/tokens")["tokens"]
    counter = Counter(
        (chain_id, len(tok_list))
        for chain_id, tok_list in all_tokens.items()
    )
    for (chain_id, count), _ in counter.most_common(args.top):
        print(f"   - chainId={chain_id:<8} {count} 个代币")

    print("\n✅ 五大端点全部调通！下一步看 demo2 做真实报价对比。")


if __name__ == "__main__":
    main()
