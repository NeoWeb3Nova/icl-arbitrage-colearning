import { NextResponse } from "next/server";
import { decodeOpportunityId } from "@/lib/market/id";
import { PAIR_MAP, EXCHANGE_MAP, DEFAULT_CAPITAL_USD, MIN_CAPITAL_USD, MAX_CAPITAL_USD } from "@/lib/market/config";
import { computeOpportunity, quoteForExchange, spreadHistory, currentBucket } from "@/lib/market/simulate";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const key = decodeOpportunityId(id);

  if (!key || !PAIR_MAP[key.pair] || !EXCHANGE_MAP[key.buyExchange] || !EXCHANGE_MAP[key.sellExchange]) {
    return NextResponse.json(
      { error: "This opportunity link is invalid or has expired." },
      { status: 404 }
    );
  }

  if (key.buyExchange === key.sellExchange) {
    return NextResponse.json(
      { error: "A buy and sell venue must be different." },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const capitalParam = Number(searchParams.get("capital"));
  const capitalUsd =
    Number.isFinite(capitalParam) && capitalParam > 0
      ? Math.min(Math.max(capitalParam, MIN_CAPITAL_USD), MAX_CAPITAL_USD)
      : DEFAULT_CAPITAL_USD;

  const bucket = currentBucket();
  const opportunity = computeOpportunity(
    key.pair,
    key.buyExchange,
    key.sellExchange,
    capitalUsd,
    bucket
  );

  const buyQuote = quoteForExchange(key.pair, key.buyExchange, bucket);
  const sellQuote = quoteForExchange(key.pair, key.sellExchange, bucket);
  const pair = PAIR_MAP[key.pair];

  const history = spreadHistory(key.pair, key.buyExchange, key.sellExchange, 12, bucket);

  return NextResponse.json({
    simulated: true,
    generatedAt: new Date().toISOString(),
    capitalUsd,
    opportunity,
    quotes: {
      buy: { exchange: key.buyExchange, ...buyQuote },
      sell: { exchange: key.sellExchange, ...sellQuote },
    },
    withdrawalFeeBaseUnits: pair.withdrawalFeeBase,
    baseAsset: pair.base,
    history,
  });
}
