"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { OpportunityResult, SpreadHistoryPoint } from "@/lib/market/simulate";
import { computeCostBreakdown, classifyConfidence } from "@/lib/market/math";
import { MIN_CAPITAL_USD, MAX_CAPITAL_USD, type ExchangeId } from "@/lib/market/config";
import { formatUsd, formatPct } from "@/lib/format";
import { SimulatedDataBadge, ConfidenceBadge } from "@/components/ui/badges";
import { SaveButton } from "@/components/watchlist/save-button";

interface Quote {
  exchange: ExchangeId;
  price: number;
  liquidityUsd: number;
  takerFeePct: number;
}

export function OpportunityDetail({
  id,
  initialCapitalUsd,
  opportunity,
  buyQuote,
  sellQuote,
  withdrawalFeeBaseUnits,
  baseAsset,
  history,
}: {
  id: string;
  initialCapitalUsd: number;
  opportunity: OpportunityResult;
  buyQuote: Quote;
  sellQuote: Quote;
  withdrawalFeeBaseUnits: number;
  baseAsset: string;
  history: SpreadHistoryPoint[];
}) {
  const [capitalInput, setCapitalInput] = useState(String(Math.round(initialCapitalUsd)));
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [live, setLive] = useState({ opportunity, buyQuote, sellQuote, history });

  const capitalUsd = useMemo(() => {
    const n = Number(capitalInput);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.min(Math.max(n, MIN_CAPITAL_USD), MAX_CAPITAL_USD);
  }, [capitalInput]);

  const breakdown = useMemo(() => {
    if (capitalUsd <= 0) return null;
    return computeCostBreakdown({
      capitalUsd,
      buyPriceUsd: live.buyQuote.price,
      sellPriceUsd: live.sellQuote.price,
      buyTakerFeePct: live.buyQuote.takerFeePct,
      sellTakerFeePct: live.sellQuote.takerFeePct,
      withdrawalFeeBaseUnits,
      liquidityFloorUsd: Math.min(live.buyQuote.liquidityUsd, live.sellQuote.liquidityUsd),
    });
  }, [capitalUsd, live.buyQuote, live.sellQuote, withdrawalFeeBaseUnits]);

  const confidence = breakdown ? classifyConfidence(breakdown) : "low";
  const positive = (breakdown?.netOutcomeUsd ?? 0) > 0;

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const res = await fetch(`/api/opportunities/${id}?capital=${Math.round(capitalUsd || initialCapitalUsd)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setRefreshError(body?.error ?? "Could not refresh this opportunity.");
        return;
      }
      const data = await res.json();
      setLive({
        opportunity: data.opportunity,
        buyQuote: data.quotes.buy,
        sellQuote: data.quotes.sell,
        history: data.history,
      });
    } catch {
      setRefreshError("Could not reach the scan service. Try again.");
    } finally {
      setRefreshing(false);
    }
  }

  const maxHistory = Math.max(0.01, ...live.history.map((h) => Math.abs(h.grossSpreadPct)));

  const nextActions = buildNextActions({
    positive,
    confidence,
    buyName: opportunity.buyExchangeName,
    sellName: opportunity.sellExchangeName,
    baseAsset,
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <div>
        <Link href="/scan" className="text-xs font-semibold uppercase tracking-wide text-muted hover:text-foreground">
          ← Back to scan
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold uppercase tracking-tight">{live.opportunity.pairDisplay}</h1>
            <ConfidenceBadge confidence={confidence} />
          </div>
          <p className="mt-1 text-sm text-muted">
            Buy <span className="font-semibold text-foreground">{live.opportunity.buyExchangeName}</span>
            {" → "}
            Sell <span className="font-semibold text-foreground">{live.opportunity.sellExchangeName}</span>
          </p>
        </div>
        <SimulatedDataBadge />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="border border-border bg-surface p-5">
          <p className="text-[11px] uppercase tracking-wide text-muted">Gross spread</p>
          <p className="mt-1 text-3xl font-bold text-cyan">{formatPct(live.opportunity.grossSpreadPct)}</p>
        </div>
        <div className="border border-border bg-surface p-5">
          <p className="text-[11px] uppercase tracking-wide text-muted">Estimated net outcome</p>
          <p className={`mt-1 text-3xl font-bold ${positive ? "text-positive" : "text-negative"}`}>
            {breakdown ? formatUsd(breakdown.netOutcomeUsd) : "—"}
          </p>
          {breakdown && (
            <p className="mt-1 text-xs text-muted">{formatPct(breakdown.netOutcomePct)} of capital</p>
          )}
        </div>
      </div>

      <div className="border border-border bg-surface p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <label htmlFor="capital" className="text-xs font-bold uppercase tracking-wide text-muted">
              Trade size (USD)
            </label>
            <input
              id="capital"
              type="number"
              min={MIN_CAPITAL_USD}
              max={MAX_CAPITAL_USD}
              step={100}
              value={capitalInput}
              onChange={(e) => setCapitalInput(e.target.value)}
              className="mt-2 w-40 border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
            {capitalUsd <= 0 && (
              <p role="alert" className="mt-1 text-xs text-negative">
                Enter a trade size greater than 0 to see updated numbers.
              </p>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="border border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-foreground hover:border-cyan hover:text-cyan disabled:cursor-wait disabled:opacity-60"
          >
            {refreshing ? "Refreshing…" : "Refresh simulation"}
          </button>
        </div>
        {refreshError && (
          <p role="alert" className="mt-2 text-xs text-negative">
            {refreshError}
          </p>
        )}
        <p className="mt-2 text-xs text-muted">
          Editing trade size recomputes instantly from the current simulated quote. Refresh pulls a new
          simulated tick.
        </p>
      </div>

      {breakdown && (
        <div className="border border-border bg-surface p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Cost breakdown</p>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <Row label={`Buy price (${live.opportunity.buyExchangeName})`} value={formatUsd(live.buyQuote.price)} />
            <Row label={`Sell price (${live.opportunity.sellExchangeName})`} value={formatUsd(live.sellQuote.price)} />
            <Row label="Buy taker fee" value={formatUsd(breakdown.buyFeeUsd)} muted />
            <Row label="Sell taker fee" value={formatUsd(breakdown.sellFeeUsd)} muted />
            <Row
              label={`Withdrawal fee (${withdrawalFeeBaseUnits} ${baseAsset})`}
              value={formatUsd(breakdown.withdrawalFeeUsd)}
              muted
            />
            <Row label="Estimated slippage" value={formatUsd(breakdown.slippageUsd)} muted />
            <Row label="Total costs" value={formatUsd(breakdown.totalCostsUsd)} />
            <Row label="Gross proceeds" value={formatUsd(breakdown.proceedsUsd)} />
          </dl>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <LiquidityBar
          label={`${live.opportunity.buyExchangeName} depth`}
          liquidityUsd={live.buyQuote.liquidityUsd}
          capitalUsd={capitalUsd}
        />
        <LiquidityBar
          label={`${live.opportunity.sellExchangeName} depth`}
          liquidityUsd={live.sellQuote.liquidityUsd}
          capitalUsd={capitalUsd}
        />
      </div>

      <div className="border border-border bg-surface p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Spread history (last 6 min, simulated)</p>
        <div className="mt-4 flex h-24 items-end gap-1">
          {live.history.map((point) => {
            const heightPct = Math.max(4, (Math.abs(point.grossSpreadPct) / maxHistory) * 100);
            return (
              <div
                key={point.bucket}
                className={`flex-1 ${point.grossSpreadPct >= 0 ? "bg-cyan" : "bg-negative"}`}
                style={{ height: `${heightPct}%` }}
                title={`${new Date(point.atIso).toLocaleTimeString()} — ${formatPct(point.grossSpreadPct)}`}
              />
            );
          })}
        </div>
      </div>

      <div className="border border-border bg-surface p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Suggested next steps</p>
        <ol className="mt-3 flex flex-col gap-2 text-sm">
          {nextActions.map((action, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border border-border text-[10px] font-bold text-muted">
                {i + 1}
              </span>
              <span>{action}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
        <SaveButton
          pair={live.opportunity.pair}
          buyExchange={live.opportunity.buyExchange}
          sellExchange={live.opportunity.sellExchange}
          capitalUsd={capitalUsd || initialCapitalUsd}
          spreadPct={live.opportunity.grossSpreadPct}
          netOutcomeUsd={breakdown?.netOutcomeUsd ?? live.opportunity.netOutcomeUsd}
        />
        <Link
          href="/watchlist"
          className="text-xs font-semibold uppercase tracking-wide text-muted hover:text-foreground"
        >
          View watchlist →
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1.5">
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className={`font-semibold ${muted ? "text-muted" : "text-foreground"}`}>{value}</dd>
    </div>
  );
}

function LiquidityBar({
  label,
  liquidityUsd,
  capitalUsd,
}: {
  label: string;
  liquidityUsd: number;
  capitalUsd: number;
}) {
  const utilizationPct = liquidityUsd > 0 ? Math.min(100, (capitalUsd / liquidityUsd) * 100) : 100;
  return (
    <div className="border border-border bg-surface p-4">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold uppercase tracking-wide text-muted">{label}</span>
        <span className="text-muted">~{formatUsd(liquidityUsd)} near touch</span>
      </div>
      <div className="mt-2 h-2 w-full bg-border">
        <div
          className={`h-2 ${utilizationPct > 20 ? "bg-warning" : "bg-cyan"}`}
          style={{ width: `${utilizationPct}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-muted">{utilizationPct.toFixed(1)}% of modeled depth used</p>
    </div>
  );
}

function buildNextActions({
  positive,
  confidence,
  buyName,
  sellName,
  baseAsset,
}: {
  positive: boolean;
  confidence: string;
  buyName: string;
  sellName: string;
  baseAsset: string;
}): string[] {
  if (!positive) {
    return [
      `Estimated costs currently exceed the spread — this is not profitable at this trade size.`,
      `Try a smaller trade size or wait for a wider spread before investigating further.`,
      `Save it anyway to track when conditions improve.`,
    ];
  }

  const actions = [
    `Confirm you hold verified accounts and available balance on both ${buyName} and ${sellName}.`,
    `Move funds to ${buyName} if needed, then buy ${baseAsset} at the venue's current quote.`,
    `Transfer ${baseAsset} to ${sellName}, accounting for confirmation/withdrawal time risk.`,
    `Sell on ${sellName} once received, then compare actual proceeds against this estimate.`,
  ];

  if (confidence === "low") {
    actions.splice(1, 0, `Confidence is low for this size — consider a smaller trade to reduce slippage risk.`);
  }

  return actions;
}
