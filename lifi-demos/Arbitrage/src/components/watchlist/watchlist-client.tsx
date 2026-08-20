"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PAIR_MAP, EXCHANGE_MAP, type ExchangeId, type PairId } from "@/lib/market/config";
import { encodeOpportunityId } from "@/lib/market/id";
import { formatUsd, formatPct } from "@/lib/format";
import { StatusBadge } from "@/components/ui/badges";
import type { WatchlistItem, WatchlistStatus } from "@/lib/watchlist/types";

type LoadState = "loading" | "success" | "error";

export function WatchlistClient() {
  const [state, setState] = useState<LoadState>("loading");
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setState("error");
      setErrorMessage("Accounts are not configured for this deployment yet.");
      return;
    }
    setState("loading");
    const { data, error } = await supabase
      .from("watchlist_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setState("error");
      setErrorMessage(error.message);
      return;
    }
    setItems((data ?? []) as WatchlistItem[]);
    setState("success");
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  async function updateStatus(id: string, status: WatchlistStatus) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));
    const { error } = await supabase.from("watchlist_items").update({ status }).eq("id", id);
    if (error) {
      setErrorMessage(error.message);
    }
  }

  async function remove(id: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const previous = items;
    setItems((prev) => prev.filter((it) => it.id !== id));
    const { error } = await supabase.from("watchlist_items").delete().eq("id", id);
    if (error) {
      setItems(previous);
      setErrorMessage(error.message);
    }
  }

  if (state === "loading") {
    return (
      <ul className="flex flex-col gap-3" aria-label="Loading watchlist">
        {[0, 1, 2].map((i) => (
          <li key={i} className="h-24 animate-pulse border border-border bg-surface" />
        ))}
      </ul>
    );
  }

  if (state === "error") {
    return (
      <div className="border border-negative/50 bg-negative/10 p-6 text-sm text-negative">
        <p className="font-semibold">{errorMessage ?? "Could not load your watchlist."}</p>
        <button
          onClick={load}
          className="mt-3 border border-negative px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-negative hover:bg-negative hover:text-background"
        >
          Retry
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-border p-8 text-center text-sm text-muted">
        <p className="font-semibold text-foreground">You haven&apos;t saved any opportunities yet.</p>
        <p className="mt-2">Run a scan and save opportunities worth watching — they&apos;ll show up here.</p>
        <Link
          href="/scan"
          className="mt-4 inline-block bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wide text-background hover:bg-accent-strong"
        >
          Go to scan
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <WatchlistRow key={item.id} item={item} onStatusChange={updateStatus} onRemove={remove} />
      ))}
    </ul>
  );
}

function WatchlistRow({
  item,
  onStatusChange,
  onRemove,
}: {
  item: WatchlistItem;
  onStatusChange: (id: string, status: WatchlistStatus) => void;
  onRemove: (id: string) => void;
}) {
  const [recheck, setRecheck] = useState<
    | { state: "idle" }
    | { state: "loading" }
    | { state: "error"; message: string }
    | { state: "done"; netOutcomeUsd: number; grossSpreadPct: number }
  >({ state: "idle" });

  const pair = PAIR_MAP[item.pair as PairId];
  const buyExchange = EXCHANGE_MAP[item.buy_exchange as ExchangeId];
  const sellExchange = EXCHANGE_MAP[item.sell_exchange as ExchangeId];

  async function handleRecheck() {
    if (!pair || !buyExchange || !sellExchange) {
      setRecheck({ state: "error", message: "This saved venue pair is no longer supported." });
      return;
    }
    setRecheck({ state: "loading" });
    try {
      const id = encodeOpportunityId({
        pair: item.pair as PairId,
        buyExchange: item.buy_exchange as ExchangeId,
        sellExchange: item.sell_exchange as ExchangeId,
      });
      const res = await fetch(`/api/opportunities/${id}?capital=${Math.round(item.capital_usd)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setRecheck({ state: "error", message: body?.error ?? "Could not recheck this opportunity." });
        return;
      }
      const data = await res.json();
      setRecheck({
        state: "done",
        netOutcomeUsd: data.opportunity.netOutcomeUsd,
        grossSpreadPct: data.opportunity.grossSpreadPct,
      });
    } catch {
      setRecheck({ state: "error", message: "Could not reach the scan service." });
    }
  }

  return (
    <li className="border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold uppercase tracking-wide">
              {pair?.display ?? item.pair}
            </span>
            <StatusBadge status={item.status} />
          </div>
          <p className="mt-1 text-sm text-muted">
            Buy <span className="font-semibold text-foreground">{buyExchange?.name ?? item.buy_exchange}</span>
            {" → "}
            Sell <span className="font-semibold text-foreground">{sellExchange?.name ?? item.sell_exchange}</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            Saved {new Date(item.created_at).toLocaleString()} on {formatUsd(item.capital_usd)} capital
          </p>
        </div>

        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-muted">Saved spread / net</p>
          <p className="text-sm font-bold text-cyan">{formatPct(item.spread_pct)}</p>
          <p className={`text-sm font-bold ${item.net_outcome_usd > 0 ? "text-positive" : "text-negative"}`}>
            {formatUsd(item.net_outcome_usd)}
          </p>
        </div>
      </div>

      {recheck.state === "done" && (
        <div className="mt-3 border border-border p-3 text-xs">
          <p className="font-semibold uppercase tracking-wide text-muted">Current simulated conditions</p>
          <p className="mt-1">
            Spread now {formatPct(recheck.grossSpreadPct)} · Net now{" "}
            <span className={recheck.netOutcomeUsd > 0 ? "text-positive" : "text-negative"}>
              {formatUsd(recheck.netOutcomeUsd)}
            </span>
          </p>
        </div>
      )}
      {recheck.state === "error" && (
        <p role="alert" className="mt-3 text-xs text-negative">
          {recheck.message}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <button
          onClick={handleRecheck}
          disabled={recheck.state === "loading"}
          className="border border-border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide hover:border-cyan hover:text-cyan disabled:cursor-wait disabled:opacity-60"
        >
          {recheck.state === "loading" ? "Rechecking…" : "Recheck now"}
        </button>

        <select
          value={item.status}
          onChange={(e) => onStatusChange(item.id, e.target.value as WatchlistStatus)}
          className="border border-border bg-background px-2 py-1.5 text-xs uppercase tracking-wide"
          aria-label="Update status"
        >
          <option value="watching">Watching</option>
          <option value="investigated">Investigated</option>
          <option value="dismissed">Dismissed</option>
        </select>

        {pair && buyExchange && sellExchange && (
          <Link
            href={`/opportunity/${encodeOpportunityId({
              pair: item.pair as PairId,
              buyExchange: item.buy_exchange as ExchangeId,
              sellExchange: item.sell_exchange as ExchangeId,
            })}?capital=${Math.round(item.capital_usd)}`}
            className="border border-accent px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent hover:bg-accent hover:text-background"
          >
            Investigate
          </Link>
        )}

        <button
          onClick={() => onRemove(item.id)}
          className="ml-auto border border-border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted hover:border-negative hover:text-negative"
        >
          Remove
        </button>
      </div>
    </li>
  );
}
