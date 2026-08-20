import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { decodeOpportunityId } from "@/lib/market/id";
import {
  PAIR_MAP,
  EXCHANGE_MAP,
  DEFAULT_CAPITAL_USD,
  MIN_CAPITAL_USD,
  MAX_CAPITAL_USD,
} from "@/lib/market/config";
import { computeOpportunity, quoteForExchange, spreadHistory, currentBucket } from "@/lib/market/simulate";
import { OpportunityDetail } from "@/components/opportunity/opportunity-detail";

export const metadata: Metadata = {
  title: "Opportunity detail — Arbitrage//Scan",
};

export default async function OpportunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ capital?: string }>;
}) {
  const { id } = await params;
  const { capital } = await searchParams;

  const key = decodeOpportunityId(id);
  if (
    !key ||
    !PAIR_MAP[key.pair] ||
    !EXCHANGE_MAP[key.buyExchange] ||
    !EXCHANGE_MAP[key.sellExchange] ||
    key.buyExchange === key.sellExchange
  ) {
    notFound();
  }

  const capitalParam = Number(capital);
  const capitalUsd =
    Number.isFinite(capitalParam) && capitalParam > 0
      ? Math.min(Math.max(capitalParam, MIN_CAPITAL_USD), MAX_CAPITAL_USD)
      : DEFAULT_CAPITAL_USD;

  const bucket = currentBucket();
  const opportunity = computeOpportunity(key.pair, key.buyExchange, key.sellExchange, capitalUsd, bucket);
  const buyQuote = quoteForExchange(key.pair, key.buyExchange, bucket);
  const sellQuote = quoteForExchange(key.pair, key.sellExchange, bucket);
  const pair = PAIR_MAP[key.pair];
  const history = spreadHistory(key.pair, key.buyExchange, key.sellExchange, 12, bucket);

  return (
    <OpportunityDetail
      id={id}
      initialCapitalUsd={capitalUsd}
      opportunity={opportunity}
      buyQuote={{ exchange: key.buyExchange, ...buyQuote }}
      sellQuote={{ exchange: key.sellExchange, ...sellQuote }}
      withdrawalFeeBaseUnits={pair.withdrawalFeeBase}
      baseAsset={pair.base}
      history={history}
    />
  );
}
