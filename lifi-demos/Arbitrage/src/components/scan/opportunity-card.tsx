import Link from "next/link";
import type { OpportunityResult } from "@/lib/market/simulate";
import { formatUsd, formatPct } from "@/lib/format";
import { ConfidenceBadge } from "@/components/ui/badges";
import { SaveButton } from "@/components/watchlist/save-button";

export function OpportunityCard({
  opportunity,
  rank,
  capitalUsd,
}: {
  opportunity: OpportunityResult;
  rank: number;
  capitalUsd: number;
}) {
  const positive = opportunity.netOutcomeUsd > 0;

  return (
    <li className="border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-border text-xs font-bold text-muted">
            {rank}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold uppercase tracking-wide">
                {opportunity.pairDisplay}
              </span>
              <ConfidenceBadge confidence={opportunity.confidence} />
            </div>
            <p className="mt-1 text-sm text-muted">
              Buy{" "}
              <span className="font-semibold text-foreground">{opportunity.buyExchangeName}</span>
              {" → "}
              Sell{" "}
              <span className="font-semibold text-foreground">{opportunity.sellExchangeName}</span>
            </p>
            <p className="mt-2 text-xs text-muted">{opportunity.actionSummary}</p>
          </div>
        </div>

        <div className="flex shrink-0 gap-6 sm:flex-col sm:items-end sm:gap-1 sm:text-right">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted">Gross spread</p>
            <p className="text-xl font-bold text-cyan">{formatPct(opportunity.grossSpreadPct)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted">Est. net outcome</p>
            <p className={`text-xl font-bold ${positive ? "text-positive" : "text-negative"}`}>
              {formatUsd(opportunity.netOutcomeUsd)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <p className="text-xs text-muted">
          On {formatUsd(capitalUsd)} capital · costs {formatUsd(opportunity.totalCostsUsd)}
        </p>
        <div className="flex items-center gap-2">
          <SaveButton
            pair={opportunity.pair}
            buyExchange={opportunity.buyExchange}
            sellExchange={opportunity.sellExchange}
            capitalUsd={capitalUsd}
            spreadPct={opportunity.grossSpreadPct}
            netOutcomeUsd={opportunity.netOutcomeUsd}
          />
          <Link
            href={`/opportunity/${opportunity.id}?capital=${Math.round(capitalUsd)}`}
            className="inline-block bg-accent px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-background hover:bg-accent-strong"
          >
            Investigate →
          </Link>
        </div>
      </div>
    </li>
  );
}
