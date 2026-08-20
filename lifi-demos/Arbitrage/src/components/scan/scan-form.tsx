"use client";

import { PAIRS, EXCHANGES, MIN_CAPITAL_USD, MAX_CAPITAL_USD } from "@/lib/market/config";

export interface ScanFormValue {
  pairs: string[];
  exchanges: string[];
  capitalUsd: string;
  minSpreadPct: string;
}

export interface ScanFormErrors {
  pairs?: string;
  exchanges?: string;
  capitalUsd?: string;
  minSpreadPct?: string;
}

export function ScanForm({
  value,
  errors,
  pending,
  onChange,
  onSubmit,
}: {
  value: ScanFormValue;
  errors: ScanFormErrors;
  pending: boolean;
  onChange: (next: ScanFormValue) => void;
  onSubmit: () => void;
}) {
  function toggle(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="border border-border bg-surface p-4 sm:p-6"
      noValidate
    >
      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-wide text-muted">
          1. Markets to scan
        </legend>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Markets">
          {PAIRS.map((pair) => {
            const active = value.pairs.includes(pair.id);
            return (
              <button
                key={pair.id}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ ...value, pairs: toggle(value.pairs, pair.id) })}
                className={`border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                  active
                    ? "border-accent bg-accent text-background"
                    : "border-border text-muted hover:border-foreground hover:text-foreground"
                }`}
              >
                {pair.display}
              </button>
            );
          })}
        </div>
        {errors.pairs && (
          <p role="alert" className="mt-2 text-xs text-negative">
            {errors.pairs}
          </p>
        )}
      </fieldset>

      <fieldset className="mt-6">
        <legend className="text-xs font-bold uppercase tracking-wide text-muted">
          2. Venues to compare
        </legend>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Venues">
          {EXCHANGES.map((exchange) => {
            const active = value.exchanges.includes(exchange.id);
            return (
              <button
                key={exchange.id}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ ...value, exchanges: toggle(value.exchanges, exchange.id) })}
                className={`border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                  active
                    ? "border-cyan bg-cyan text-background"
                    : "border-border text-muted hover:border-foreground hover:text-foreground"
                }`}
              >
                {exchange.name}
              </button>
            );
          })}
        </div>
        {errors.exchanges && (
          <p role="alert" className="mt-2 text-xs text-negative">
            {errors.exchanges}
          </p>
        )}
      </fieldset>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="capitalUsd" className="text-xs font-bold uppercase tracking-wide text-muted">
            3. Trade size (USD)
          </label>
          <input
            id="capitalUsd"
            name="capitalUsd"
            type="number"
            inputMode="decimal"
            min={MIN_CAPITAL_USD}
            max={MAX_CAPITAL_USD}
            step="100"
            value={value.capitalUsd}
            onChange={(e) => onChange({ ...value, capitalUsd: e.target.value })}
            aria-invalid={Boolean(errors.capitalUsd)}
            className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
          />
          {errors.capitalUsd && (
            <p role="alert" className="mt-1 text-xs text-negative">
              {errors.capitalUsd}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="minSpreadPct" className="text-xs font-bold uppercase tracking-wide text-muted">
            Minimum gross spread (%)
          </label>
          <input
            id="minSpreadPct"
            name="minSpreadPct"
            type="number"
            inputMode="decimal"
            min={0}
            max={10}
            step="0.05"
            value={value.minSpreadPct}
            onChange={(e) => onChange({ ...value, minSpreadPct: e.target.value })}
            aria-invalid={Boolean(errors.minSpreadPct)}
            className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
          />
          {errors.minSpreadPct && (
            <p role="alert" className="mt-1 text-xs text-negative">
              {errors.minSpreadPct}
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full bg-accent px-4 py-3 text-sm font-bold uppercase tracking-wide text-background hover:bg-accent-strong disabled:cursor-wait disabled:opacity-70 sm:w-auto"
      >
        {pending ? "Scanning…" : "Scan for opportunities"}
      </button>
    </form>
  );
}
