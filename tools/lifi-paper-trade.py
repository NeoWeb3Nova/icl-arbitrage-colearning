#!/usr/bin/env python3
"""Two-leg LI.FI quote-only Paper Trading case.

No wallet, signing, approval, or transaction broadcast is performed.
"""

import argparse
import json
import os
import time
import urllib.parse
import urllib.request
from decimal import Decimal
from pathlib import Path

BASE_URL = "https://li.quest/v1/quote"
QUOTE_ADDRESS = "0x552008c0f6872d7aa9e46e4b5a8c4a8f8f8f8f8f"
ETH = "0x0000000000000000000000000000000000000000"
USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
HEADERS = {
    "User-Agent": "arbitrage-research/0.1 (paper trading; quote-only)",
    **({"x-lifi-api-key": os.environ["LIFI_API_KEY"]}
       if os.getenv("LIFI_API_KEY") else {}),
}


def quote(from_token: str, to_token: str, amount: str) -> dict:
    params = {
        "fromChain": 42161,
        "toChain": 42161,
        "fromToken": from_token,
        "toToken": to_token,
        "fromAmount": amount,
        "fromAddress": QUOTE_ADDRESS,
        "slippage": "0.005",
    }
    url = BASE_URL + "?" + urllib.parse.urlencode(params)
    request = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def compact(data: dict) -> dict:
    estimate = data.get("estimate", {})
    return {
        "tool": data.get("tool"),
        "fromAmount": data.get("action", {}).get("fromAmount"),
        "toAmount": estimate.get("toAmount"),
        "toAmountMin": estimate.get("toAmountMin"),
        "executionDuration": estimate.get("executionDuration"),
        "feeCosts": estimate.get("feeCosts", []),
        "gasCosts": estimate.get("gasCosts", []),
        "priceImpact": estimate.get("priceImpact"),
        "raw": data,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="LI.FI 双腿只读 Paper Trading")
    parser.add_argument("--eth", default="0.01", help="模拟起始 ETH，默认 0.01")
    parser.add_argument("--output", default="outputs/20260818-lifi-paper-trade.json")
    args = parser.parse_args()

    initial = int(Decimal(args.eth) * Decimal(10**18))
    leg1 = quote(ETH, USDC, str(initial))
    leg1_estimate = leg1["estimate"]
    theoretical_usdc = leg1_estimate["toAmount"]
    conservative_usdc = leg1_estimate["toAmountMin"]

    leg2_theoretical = quote(USDC, ETH, theoretical_usdc)
    leg2_conservative = quote(USDC, ETH, conservative_usdc)

    result = {
        "case": {
            "type": "Paper Trading / quote simulation",
            "status": "read-only; no signing; no broadcast",
            "timestamp": int(time.time()),
            "chain": "Arbitrum One (42161)",
            "path": "ETH -> USDC -> ETH",
            "quoteAddress": QUOTE_ADDRESS,
            "initialEthWei": str(initial),
        },
        "leg1": compact(leg1),
        "leg2Theoretical": compact(leg2_theoretical),
        "leg2Conservative": compact(leg2_conservative),
        "continuity": {
            "theoreticalLeg2InputEqualsLeg1Output": (
                leg2_theoretical["action"]["fromAmount"] == theoretical_usdc
            ),
            "conservativeLeg2InputEqualsLeg1MinOutput": (
                leg2_conservative["action"]["fromAmount"] == conservative_usdc
            ),
        },
        "arithmetic": {
            "theoreticalReturnWei": leg2_theoretical["estimate"]["toAmount"],
            "conservativeReturnWei": leg2_conservative["estimate"]["toAmountMin"],
            "theoreticalDeltaWei": str(
                int(leg2_theoretical["estimate"]["toAmount"]) - initial
            ),
            "conservativeDeltaWei": str(
                int(leg2_conservative["estimate"]["toAmountMin"]) - initial
            ),
        },
    }
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    assert result["continuity"]["theoreticalLeg2InputEqualsLeg1Output"]
    assert result["continuity"]["conservativeLeg2InputEqualsLeg1MinOutput"]
    print(json.dumps({
        "output": str(output),
        "initialEth": args.eth,
        "leg1Usdc": theoretical_usdc,
        "theoreticalReturnWei": result["arithmetic"]["theoreticalReturnWei"],
        "conservativeReturnWei": result["arithmetic"]["conservativeReturnWei"],
        "theoreticalDeltaWei": result["arithmetic"]["theoreticalDeltaWei"],
        "conservativeDeltaWei": result["arithmetic"]["conservativeDeltaWei"],
        "continuity": result["continuity"],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
