"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScanForm, type ScanFormValue, type ScanFormErrors } from "./scan-form";
import { OpportunityCard } from "./opportunity-card";
import { SimulatedDataBadge } from "@/components/ui/badges";
import { scanRequestSchema } from "@/lib/market/schema";
import type { OpportunityResult } from "@/lib/market/simulate";
import {
  DEFAULT_CAPITAL_USD,
  DEFAULT_MIN_SPREAD_PCT,
} from "@/lib/market/config";

const DEFAULT_PAIRS = ["BTC-USDT", "ETH-USDT", "SOL-USDT"];
const DEFAULT_EXCHANGES = ["binance", "coinbase", "kraken", "bybit"];

type Status = "idle" | "loading" | "success" | "error";

interface ScanResponse {
  simulated: boolean;
  generatedAt: string;
  scannedCount: number;
  opportunities: OpportunityResult[];
}

function parseListParam(raw: string | null, fallback: string[]): string[] {
  if (!raw) return fallback;
  const list = raw.split(",").filter(Boolean);
  return list.length ? list : fallback;
}

export function ScanWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [value, setValue] = useState<ScanFormValue>(() => ({
    pairs: parseListParam(searchParams.get("pairs"), DEFAULT_PAIRS),
    exchanges: parseListParam(searchParams.get("exchanges"), DEFAULT_EXCHANGES),
    capitalUsd: searchParams.get("capital") ?? String(DEFAULT_CAPITAL_USD),
    minSpreadPct: searchParams.get("minSpread") ?? String(DEFAULT_MIN_SPREAD_PCT),
  }));
  const [errors, setErrors] = useState<ScanFormErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [lastCapital, setLastCapital] = useState<number>(DEFAULT_CAPITAL_USD);

  const runScan = useCallback(
    async (formValue: ScanFormValue, updateUrl: boolean) => {
      const candidate = {
        pairs: formValue.pairs,
        exchanges: formValue.exchanges,
        capitalUsd: Number(formValue.capitalUsd),
        minSpreadPct: Number(formValue.minSpreadPct),
      };

      const parsed = scanRequestSchema.safeParse(candidate);
      if (!parsed.success) {
        const flat = parsed.error.flatten().fieldErrors;
        setErrors({
          pairs: flat.pairs?.[0],
          exchanges: flat.exchanges?.[0],
          capitalUsd: flat.capitalUsd?.[0],
          minSpreadPct: flat.minSpreadPct?.[0],
        });
        setStatus("error");
        setErrorMessage(null);
        return;
      }

      setErrors({});
      setStatus("loading");
      setErrorMessage(null);

      if (updateUrl) {
        const params = new URLSearchParams({
          pairs: parsed.data.pairs.join(","),
          exchanges: parsed.data.exchanges.join(","),
          capital: String(parsed.data.capitalUsd),
          minSpread: String(parsed.data.minSpreadPct),
        });
        router.replace(`/scan?${params.toString()}`, { scroll: false });
      }

      try {
        const res = await fetch("/api/opportunities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          if (res.status === 422 && body?.fieldErrors) {
            setErrors({
              pairs: body.fieldErrors.pairs?.[0],
              exchanges: body.fieldErrors.exchanges?.[0],
              capitalUsd: body.fieldErrors.capitalUsd?.[0],
              minSpreadPct: body.fieldErrors.minSpreadPct?.[0],
            });
            setStatus("error");
            return;
          }
          setStatus("error");
          setErrorMessage(body?.error ?? "The scan failed. Try again in a moment.");
          return;
        }

        const data: ScanResponse = await res.json();
        setResult(data);
        setLastCapital(parsed.data.capitalUsd);
        setStatus("success");
      } catch {
        setStatus("error");
        setErrorMessage("Could not reach the scan service. Check your connection and try again.");
      }
    },
    [router]
  );

  // Auto-run once on load if the URL already carries a scan (return path / shared link).
  useEffect(() => {
    if (!searchParams.get("pairs")) return;
    void (async () => {
      await runScan(value, false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-tight sm:text-3xl">Scan for opportunities</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Choose the markets and venues you care about and your trade size. We rank every venue pair by
          estimated net outcome after fees, withdrawal cost, and slippage — not just raw spread.
        </p>
      </div>

      <ScanForm value={value} errors={errors} pending={status === "loading"} onChange={setValue} onSubmit={() => runScan(value, true)} />

      <section aria-live="polite" className="min-h-[8rem]">
        {status === "idle" && (
          <div className="border border-dashed border-border p-8 text-center text-sm text-muted">
            Set your filters above and run a scan to see ranked opportunities.
          </div>
        )}

        {status === "loading" && (
          <ul className="flex flex-col gap-3" aria-label="Loading opportunities">
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-28 animate-pulse border border-border bg-surface" />
            ))}
          </ul>
        )}

        {status === "error" && errorMessage && (
          <div className="border border-negative/50 bg-negative/10 p-6 text-sm text-negative">
            <p className="font-semibold">{errorMessage}</p>
            <button
              onClick={() => runScan(value, true)}
              className="mt-3 border border-negative px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-negative hover:bg-negative hover:text-background"
            >
              Retry scan
            </button>
          </div>
        )}

        {status === "error" && !errorMessage && (
          <div className="border border-warning/50 bg-warning/10 p-6 text-sm text-warning">
            Fix the highlighted fields above, then scan again.
          </div>
        )}

        {status === "success" && result && result.opportunities.length === 0 && (
          <div className="border border-dashed border-border p-8 text-center text-sm text-muted">
            <p className="font-semibold text-foreground">No opportunities meet your filters right now.</p>
            <p className="mt-2">
              Try lowering the minimum spread, adding more venues, or widening your market selection.
            </p>
          </div>
        )}

        {status === "success" && result && result.opportunities.length > 0 && (
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-wide text-muted">
                {result.opportunities.length} ranked result{result.opportunities.length === 1 ? "" : "s"} ·
                {" "}
                {result.scannedCount} venue pairs scanned
              </p>
              <SimulatedDataBadge />
            </div>
            <ul className="flex flex-col gap-3">
              {result.opportunities.map((opportunity, i) => (
                <OpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  rank={i + 1}
                  capitalUsd={lastCapital}
                />
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
