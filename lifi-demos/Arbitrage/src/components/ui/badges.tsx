import type { Confidence } from "@/lib/market/math";
import type { WatchlistStatus } from "@/lib/watchlist/types";

export function SimulatedDataBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border border-warning/50 bg-warning/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-warning ${className}`}
    >
      <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-warning" aria-hidden />
      Simulated data
    </span>
  );
}

const CONFIDENCE_STYLES: Record<Confidence, string> = {
  high: "border-positive/50 bg-positive/10 text-positive",
  medium: "border-cyan/50 bg-cyan/10 text-cyan",
  low: "border-negative/50 bg-negative/10 text-negative",
};

const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return (
    <span
      className={`inline-block border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${CONFIDENCE_STYLES[confidence]}`}
    >
      {CONFIDENCE_LABEL[confidence]}
    </span>
  );
}

const STATUS_STYLES: Record<WatchlistStatus, string> = {
  watching: "border-cyan/50 bg-cyan/10 text-cyan",
  investigated: "border-positive/50 bg-positive/10 text-positive",
  dismissed: "border-muted/50 bg-muted/10 text-muted",
};

export function StatusBadge({ status }: { status: WatchlistStatus }) {
  return (
    <span
      className={`inline-block border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
