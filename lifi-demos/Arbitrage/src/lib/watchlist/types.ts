export type WatchlistStatus = "watching" | "investigated" | "dismissed";

export interface WatchlistItem {
  id: string;
  user_id: string;
  pair: string;
  buy_exchange: string;
  sell_exchange: string;
  capital_usd: number;
  spread_pct: number;
  net_outcome_usd: number;
  status: WatchlistStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewWatchlistItem {
  pair: string;
  buy_exchange: string;
  sell_exchange: string;
  capital_usd: number;
  spread_pct: number;
  net_outcome_usd: number;
}
