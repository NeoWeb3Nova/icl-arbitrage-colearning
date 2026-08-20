"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient, isBackendConfigured } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";

type SaveState = "idle" | "saving" | "saved" | "error";

export interface SaveButtonProps {
  pair: string;
  buyExchange: string;
  sellExchange: string;
  capitalUsd: number;
  spreadPct: number;
  netOutcomeUsd: number;
  className?: string;
}

export function SaveButton({
  pair,
  buyExchange,
  sellExchange,
  capitalUsd,
  spreadPct,
  netOutcomeUsd,
  className = "",
}: SaveButtonProps) {
  const user = useAuthUser();
  const pathname = usePathname();
  const [state, setState] = useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isBackendConfigured) {
    return (
      <span
        className={`inline-block border border-border px-3 py-1.5 text-xs uppercase tracking-wide text-muted ${className}`}
        title="Accounts are not configured for this deployment yet."
      >
        Save unavailable
      </span>
    );
  }

  if (user === undefined) {
    return (
      <span className={`inline-block h-8 w-24 animate-pulse bg-surface ${className}`} aria-hidden />
    );
  }

  if (user === null) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname ?? "/scan")}`}
        className={`inline-block border border-border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-foreground hover:border-accent hover:text-accent ${className}`}
      >
        Sign in to save
      </Link>
    );
  }

  async function handleSave() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user) return;
    setState("saving");
    setErrorMessage(null);
    const { error } = await supabase.from("watchlist_items").insert({
      user_id: user.id,
      pair,
      buy_exchange: buyExchange,
      sell_exchange: sellExchange,
      capital_usd: capitalUsd,
      spread_pct: spreadPct,
      net_outcome_usd: netOutcomeUsd,
      status: "watching",
    });
    if (error) {
      setState("error");
      setErrorMessage(error.message);
      return;
    }
    setState("saved");
  }

  if (state === "saved") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 border border-positive/50 bg-positive/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-positive ${className}`}
      >
        Saved to watchlist
      </span>
    );
  }

  return (
    <div className={className}>
      <button
        onClick={handleSave}
        disabled={state === "saving"}
        className="inline-block border border-accent px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent hover:bg-accent hover:text-background disabled:cursor-wait disabled:opacity-60"
      >
        {state === "saving" ? "Saving…" : "Save to watchlist"}
      </button>
      {state === "error" && (
        <p role="alert" className="mt-1 text-xs text-negative">
          {errorMessage ?? "Could not save this opportunity. Try again."}
        </p>
      )}
    </div>
  );
}
