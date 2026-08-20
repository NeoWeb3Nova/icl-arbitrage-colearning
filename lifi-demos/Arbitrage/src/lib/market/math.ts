// Pure arbitrage math shared between the server (initial computation) and the
// client (instant recompute when a trader edits the capital amount). No
// randomness lives here; the simulator supplies prices/fees/liquidity.

export interface CostInputs {
  capitalUsd: number;
  buyPriceUsd: number;
  sellPriceUsd: number;
  buyTakerFeePct: number;
  sellTakerFeePct: number;
  withdrawalFeeBaseUnits: number;
  liquidityFloorUsd: number;
}

export interface CostBreakdown {
  unitsBought: number;
  grossSpreadPct: number;
  buyFeeUsd: number;
  sellFeeUsd: number;
  withdrawalFeeUsd: number;
  slippagePct: number;
  slippageUsd: number;
  totalCostsUsd: number;
  proceedsUsd: number;
  netOutcomeUsd: number;
  netOutcomePct: number;
  liquidityUtilizationPct: number;
}

const SLIPPAGE_FREE_UTILIZATION = 0.02; // first 2% of depth trades near touch price
const SLIPPAGE_FACTOR = 0.6; // extra cost multiplier beyond the free band

export function computeCostBreakdown(input: CostInputs): CostBreakdown {
  const {
    capitalUsd,
    buyPriceUsd,
    sellPriceUsd,
    buyTakerFeePct,
    sellTakerFeePct,
    withdrawalFeeBaseUnits,
    liquidityFloorUsd,
  } = input;

  const unitsBought = capitalUsd / buyPriceUsd;
  const grossSpreadPct = ((sellPriceUsd - buyPriceUsd) / buyPriceUsd) * 100;

  const buyFeeUsd = capitalUsd * (buyTakerFeePct / 100);
  const grossProceedsUsd = unitsBought * sellPriceUsd;
  const sellFeeUsd = grossProceedsUsd * (sellTakerFeePct / 100);
  const withdrawalFeeUsd = withdrawalFeeBaseUnits * buyPriceUsd;

  const liquidityUtilizationPct =
    liquidityFloorUsd > 0 ? (capitalUsd / liquidityFloorUsd) * 100 : 100;
  const utilizationFraction = liquidityUtilizationPct / 100;
  const slippageFraction =
    utilizationFraction > SLIPPAGE_FREE_UTILIZATION
      ? (utilizationFraction - SLIPPAGE_FREE_UTILIZATION) * SLIPPAGE_FACTOR
      : 0;
  const slippagePct = slippageFraction * 100;
  const slippageUsd = capitalUsd * slippageFraction;

  const totalCostsUsd = buyFeeUsd + sellFeeUsd + withdrawalFeeUsd + slippageUsd;
  const proceedsUsd = grossProceedsUsd;
  const netOutcomeUsd = proceedsUsd - capitalUsd - buyFeeUsd - sellFeeUsd - withdrawalFeeUsd - slippageUsd;
  const netOutcomePct = capitalUsd > 0 ? (netOutcomeUsd / capitalUsd) * 100 : 0;

  return {
    unitsBought,
    grossSpreadPct,
    buyFeeUsd,
    sellFeeUsd,
    withdrawalFeeUsd,
    slippagePct,
    slippageUsd,
    totalCostsUsd,
    proceedsUsd,
    netOutcomeUsd,
    netOutcomePct,
    liquidityUtilizationPct,
  };
}

export type Confidence = "high" | "medium" | "low";

export function classifyConfidence(breakdown: CostBreakdown): Confidence {
  if (breakdown.netOutcomeUsd <= 0) return "low";
  if (breakdown.liquidityUtilizationPct < 5 && breakdown.netOutcomePct > 0.15) {
    return "high";
  }
  if (breakdown.liquidityUtilizationPct < 20 && breakdown.netOutcomePct > 0.03) {
    return "medium";
  }
  return "low";
}
