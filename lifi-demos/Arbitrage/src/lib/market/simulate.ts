import {
  EXCHANGE_MAP,
  PAIR_MAP,
  TIME_BUCKET_MS,
  type ExchangeId,
  type PairId,
} from "./config";
import { computeCostBreakdown, classifyConfidence, type Confidence } from "./math";
import { encodeOpportunityId } from "./id";

// ---------------------------------------------------------------------------
// Deterministic pseudo-random generator. This file NEVER calls a live market
// data API: every price/liquidity value below is produced by hashing a time
// bucket + pair + exchange into a seeded generator, so the same inputs always
// reproduce the same numbers within a 30-second window. All output must be
// presented to users as simulated/demo data, never as real-time evidence.
// ---------------------------------------------------------------------------

function hashString(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededUnit(key: string): number {
  return mulberry32(hashString(key))();
}

export function currentBucket(nowMs: number = Date.now()): number {
  return Math.floor(nowMs / TIME_BUCKET_MS);
}

export interface ExchangeQuote {
  price: number;
  liquidityUsd: number;
  takerFeePct: number;
}

export function quoteForExchange(
  pairId: PairId,
  exchangeId: ExchangeId,
  bucket: number
): ExchangeQuote {
  const pair = PAIR_MAP[pairId];
  const exchange = EXCHANGE_MAP[exchangeId];

  // Persistent per-venue bias: some venues run structurally rich/cheap.
  const biasUnit = seededUnit(`bias:${pairId}:${exchangeId}`) - 0.5;
  const bias = biasUnit * 2 * (pair.biasRangePct / 100);

  // Time-varying noise, refreshed every bucket.
  const noiseUnit = seededUnit(`tick:${pairId}:${exchangeId}:${bucket}`) - 0.5;
  const noise = noiseUnit * 2 * (pair.tickVolatilityPct / 100);

  const price = pair.referencePriceUsd * (1 + bias + noise);

  const liquidityUnit = seededUnit(`depth:${pairId}:${exchangeId}:${bucket}`);
  const liquidityUsd =
    exchange.liquidityTierUsd * pair.liquidityScale * (0.7 + liquidityUnit * 0.6);

  const feeUnit = seededUnit(`fee:${pairId}:${exchangeId}:${bucket}`) - 0.5;
  const takerFeePct = Math.max(0.02, exchange.takerFeePct * (1 + feeUnit * 0.1));

  return { price, liquidityUsd, takerFeePct };
}

export interface OpportunityResult {
  id: string;
  pair: PairId;
  pairDisplay: string;
  buyExchange: ExchangeId;
  buyExchangeName: string;
  sellExchange: ExchangeId;
  sellExchangeName: string;
  buyPriceUsd: number;
  sellPriceUsd: number;
  grossSpreadPct: number;
  netOutcomeUsd: number;
  netOutcomePct: number;
  confidence: Confidence;
  totalCostsUsd: number;
  liquidityUtilizationPct: number;
  actionSummary: string;
  bucket: number;
  generatedAt: string;
}

export function computeOpportunity(
  pairId: PairId,
  buyExchangeId: ExchangeId,
  sellExchangeId: ExchangeId,
  capitalUsd: number,
  bucket: number = currentBucket()
): OpportunityResult {
  const pair = PAIR_MAP[pairId];
  const buyExchange = EXCHANGE_MAP[buyExchangeId];
  const sellExchange = EXCHANGE_MAP[sellExchangeId];

  const buy = quoteForExchange(pairId, buyExchangeId, bucket);
  const sell = quoteForExchange(pairId, sellExchangeId, bucket);

  const breakdown = computeCostBreakdown({
    capitalUsd,
    buyPriceUsd: buy.price,
    sellPriceUsd: sell.price,
    buyTakerFeePct: buy.takerFeePct,
    sellTakerFeePct: sell.takerFeePct,
    withdrawalFeeBaseUnits: pair.withdrawalFeeBase,
    liquidityFloorUsd: Math.min(buy.liquidityUsd, sell.liquidityUsd),
  });

  const confidence = classifyConfidence(breakdown);

  return {
    id: encodeOpportunityId({ pair: pairId, buyExchange: buyExchangeId, sellExchange: sellExchangeId }),
    pair: pairId,
    pairDisplay: pair.display,
    buyExchange: buyExchangeId,
    buyExchangeName: buyExchange.name,
    sellExchange: sellExchangeId,
    sellExchangeName: sellExchange.name,
    buyPriceUsd: buy.price,
    sellPriceUsd: sell.price,
    grossSpreadPct: breakdown.grossSpreadPct,
    netOutcomeUsd: breakdown.netOutcomeUsd,
    netOutcomePct: breakdown.netOutcomePct,
    confidence,
    totalCostsUsd: breakdown.totalCostsUsd,
    liquidityUtilizationPct: breakdown.liquidityUtilizationPct,
    actionSummary: `Buy on ${buyExchange.name}, transfer, sell on ${sellExchange.name}`,
    bucket,
    generatedAt: new Date(bucket * TIME_BUCKET_MS).toISOString(),
  };
}

export interface RankOpportunitiesInput {
  pairs: PairId[];
  exchanges: ExchangeId[];
  capitalUsd: number;
  minSpreadPct: number;
  maxResults: number;
}

export function rankOpportunities(input: RankOpportunitiesInput): {
  opportunities: OpportunityResult[];
  scannedCount: number;
  bucket: number;
} {
  const bucket = currentBucket();
  const results: OpportunityResult[] = [];
  let scannedCount = 0;

  for (const pairId of input.pairs) {
    for (const buyExchangeId of input.exchanges) {
      for (const sellExchangeId of input.exchanges) {
        if (buyExchangeId === sellExchangeId) continue;
        scannedCount++;
        const opportunity = computeOpportunity(
          pairId,
          buyExchangeId,
          sellExchangeId,
          input.capitalUsd,
          bucket
        );
        if (opportunity.grossSpreadPct >= input.minSpreadPct) {
          results.push(opportunity);
        }
      }
    }
  }

  results.sort((a, b) => b.netOutcomeUsd - a.netOutcomeUsd);

  return {
    opportunities: results.slice(0, input.maxResults),
    scannedCount,
    bucket,
  };
}

export interface SpreadHistoryPoint {
  bucket: number;
  atIso: string;
  grossSpreadPct: number;
}

export function spreadHistory(
  pairId: PairId,
  buyExchangeId: ExchangeId,
  sellExchangeId: ExchangeId,
  points: number,
  endBucket: number = currentBucket()
): SpreadHistoryPoint[] {
  const out: SpreadHistoryPoint[] = [];
  for (let i = points - 1; i >= 0; i--) {
    const bucket = endBucket - i;
    const buy = quoteForExchange(pairId, buyExchangeId, bucket);
    const sell = quoteForExchange(pairId, sellExchangeId, bucket);
    const grossSpreadPct = ((sell.price - buy.price) / buy.price) * 100;
    out.push({ bucket, atIso: new Date(bucket * TIME_BUCKET_MS).toISOString(), grossSpreadPct });
  }
  return out;
}
