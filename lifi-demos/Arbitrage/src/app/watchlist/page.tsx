import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseServerClient, isBackendConfigured } from "@/lib/supabase/server";
import { WatchlistClient } from "@/components/watchlist/watchlist-client";

export const metadata: Metadata = {
  title: "Watchlist — Arbitrage//Scan",
};

export default async function WatchlistPage() {
  if (!isBackendConfigured) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
        <div className="border border-warning/50 bg-warning/10 p-6 text-sm text-warning">
          <p className="font-semibold">Accounts aren&apos;t configured for this deployment yet.</p>
          <p className="mt-2">
            Saving opportunities requires sign-in, which isn&apos;t available on this deployment right now.
            You can still run scans from the Scan page.
          </p>
        </div>
      </div>
    );
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!user) {
    redirect("/login?next=/watchlist");
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight sm:text-3xl">Your watchlist</h1>
          <p className="mt-2 text-sm text-muted">
            Opportunities you saved, with the values captured at save time. Recheck any of them against
            fresh simulated conditions.
          </p>
        </div>
        <Link
          href="/scan"
          className="border border-border px-4 py-2 text-xs font-bold uppercase tracking-wide hover:border-accent hover:text-accent"
        >
          + New scan
        </Link>
      </div>

      <div className="mt-6">
        <WatchlistClient />
      </div>
    </div>
  );
}
