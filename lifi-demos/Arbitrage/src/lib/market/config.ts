// Simulated market reference data.
//
// IMPORTANT: every number in this module seeds a deterministic simulator
// (see `simulate.ts`), not a live feed. The app must always label results
// derived from this data as simulated/demo data.

export type ExchangeId =
  | "binance"
  | "coinbase"
  | "kraken"
  | "bybit"
  | "okx"
  | "kucoin";

export interface ExchangeConfig {
  id: ExchangeId;
  name: string;
  takerFeePct: number; // typical taker fee, percent
  liquidityTierUsd: number; // baseline order-book depth near touch price, USD
}

export const EXCHANGES: ExchangeConfig[] = [
  { id: "binance", name: "Binance", takerFeePct: 0.1, liquidityTierUsd: 4_200_000 },
  { id: "coinbase", name: "Coinbase", takerFeePct: 0.25, liquidityTierUsd: 3_100_000 },
  { id: "kraken", name: "Kraken", takerFeePct: 0.16, liquidityTierUsd: 1_650_000 },
  { id: "bybit", name: "Bybit", takerFeePct: 0.1, liquidityTierUsd: 1_450_000 },
  { id: "okx", name: "OKX", takerFeePct: 0.1, liquidityTierUsd: 2_050_000 },
  { id: "kucoin", name: "KuCoin", takerFeePct: 0.1, liquidityTierUsd: 520_000 },
];

export const EXCHANGE_MAP: Record<ExchangeId, ExchangeConfig> = Object.fromEntries(
  EXCHANGES.map((e) => [e.id, e])
) as Record<ExchangeId, ExchangeConfig>;

export type PairId =
  | "BTC-USDT"
  | "ETH-USDT"
  | "SOL-USDT"
  | "XRP-USDT"
  | "ADA-USDT"
  | "DOGE-USDT"
  | "LTC-USDT"
  | "AVAX-USDT";

export interface PairConfig {
  id: PairId;
  base: string;
  quote: string;
  display: string;
  referencePriceUsd: number;
  tickVolatilityPct: number; // per 30s-bucket noise, percent
  biasRangePct: number; // persistent cross-exchange dislocation range, percent
  liquidityScale: number; // relative depth multiplier vs an exchange's tier
  withdrawalFeeBase: number; // assumed network withdrawal fee, in base asset units
}

export const PAIRS: PairConfig[] = [
  {
    id: "BTC-USDT",
    base: "BTC",
    quote: "USDT",
    display: "BTC/USDT",
    referencePriceUsd: 64_000,
    tickVolatilityPct: 0.1,
    biasRangePct: 0.3,
    liquidityScale: 1,
    withdrawalFeeBase: 0.0002,
  },
  {
    id: "ETH-USDT",
    base: "ETH",
    quote: "USDT",
    display: "ETH/USDT",
    referencePriceUsd: 3_400,
    tickVolatilityPct: 0.12,
    biasRangePct: 0.32,
    liquidityScale: 0.85,
    withdrawalFeeBase: 0.0025,
  },
  {
    id: "SOL-USDT",
    base: "SOL",
    quote: "USDT",
    display: "SOL/USDT",
    referencePriceUsd: 145,
    tickVolatilityPct: 0.18,
    biasRangePct: 0.45,
    liquidityScale: 0.4,
    withdrawalFeeBase: 0.01,
  },
  {
    id: "XRP-USDT",
    base: "XRP",
    quote: "USDT",
    display: "XRP/USDT",
    referencePriceUsd: 0.62,
    tickVolatilityPct: 0.22,
    biasRangePct: 0.5,
    liquidityScale: 0.35,
    withdrawalFeeBase: 0.2,
  },
  {
    id: "ADA-USDT",
    base: "ADA",
    quote: "USDT",
    display: "ADA/USDT",
    referencePriceUsd: 0.45,
    tickVolatilityPct: 0.22,
    biasRangePct: 0.5,
    liquidityScale: 0.25,
    withdrawalFeeBase: 0.6,
  },
  {
    id: "DOGE-USDT",
    base: "DOGE",
    quote: "USDT",
    display: "DOGE/USDT",
    referencePriceUsd: 0.14,
    tickVolatilityPct: 0.28,
    biasRangePct: 0.55,
    liquidityScale: 0.3,
    withdrawalFeeBase: 6,
  },
  {
    id: "LTC-USDT",
    base: "LTC",
    quote: "USDT",
    display: "LTC/USDT",
    referencePriceUsd: 78,
    tickVolatilityPct: 0.16,
    biasRangePct: 0.4,
    liquidityScale: 0.45,
    withdrawalFeeBase: 0.001,
  },
  {
    id: "AVAX-USDT",
    base: "AVAX",
    quote: "USDT",
    display: "AVAX/USDT",
    referencePriceUsd: 28,
    tickVolatilityPct: 0.2,
    biasRangePct: 0.48,
    liquidityScale: 0.35,
    withdrawalFeeBase: 0.01,
  },
];

export const PAIR_MAP: Record<PairId, PairConfig> = Object.fromEntries(
  PAIRS.map((p) => [p.id, p])
) as Record<PairId, PairConfig>;

export const EXCHANGE_IDS = EXCHANGES.map((e) => e.id) as ExchangeId[];
export const PAIR_IDS = PAIRS.map((p) => p.id) as PairId[];

export const TIME_BUCKET_MS = 30_000;

export const DEFAULT_CAPITAL_USD = 5_000;
export const DEFAULT_MIN_SPREAD_PCT = 0.15;
export const MAX_CAPITAL_USD = 5_000_000;
export const MIN_CAPITAL_USD = 50;
export const MAX_RESULTS = 24;
