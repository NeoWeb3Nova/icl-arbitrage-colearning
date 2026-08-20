import Link from "next/link";
import { rankOpportunities } from "@/lib/market/simulate";
import { DEFAULT_CAPITAL_USD, DEFAULT_MIN_SPREAD_PCT } from "@/lib/market/config";
import { formatPct, formatUsd } from "@/lib/format";
import { SimulatedDataBadge, ConfidenceBadge } from "@/components/ui/badges";

export default function Home() {
  const preview = rankOpportunities({
    pairs: ["BTC-USDT", "ETH-USDT", "SOL-USDT"],
    exchanges: ["binance", "coinbase", "kraken", "bybit"],
    capitalUsd: DEFAULT_CAPITAL_USD,
    minSpreadPct: DEFAULT_MIN_SPREAD_PCT,
    maxResults: 3,
  });

  return (
    <div className="flex flex-col">
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
              Opportunity discovery for traders
            </p>
            <h1 className="mt-4 text-3xl font-bold uppercase leading-tight tracking-tight sm:text-5xl">
              Stop tab-switching between exchanges.
              <br />
              <span className="text-accent">See the arbitrage, ranked.</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Pick your markets and venues, set a trade size, and get a ranked list of arbitrage
              opportunities with spread, fees, slippage, and estimated net outcome already worked out —
              so you can decide what&apos;s worth investigating in seconds, not spreadsheets.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/scan"
                className="bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wide text-background hover:bg-accent-strong"
              >
                Start scanning
              </Link>
              <Link
                href="/watchlist"
                className="border border-border px-6 py-3 text-sm font-bold uppercase tracking-wide text-foreground hover:border-foreground"
              >
                My watchlist
              </Link>
            </div>
          </div>

          <div className="border border-border bg-surface p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Live scan preview</p>
              <SimulatedDataBadge />
            </div>
            <ul className="flex flex-col gap-2">
              {preview.opportunities.map((opportunity, i) => (
                <li key={opportunity.id} className="border border-border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide">
                        #{i + 1} {opportunity.pairDisplay}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {opportunity.buyExchangeName} → {opportunity.sellExchangeName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-cyan">{formatPct(opportunity.grossSpreadPct)}</p>
                      <p
                        className={`text-xs font-semibold ${
                          opportunity.netOutcomeUsd > 0 ? "text-positive" : "text-negative"
                        }`}
                      >
                        {formatUsd(opportunity.netOutcomeUsd)} net
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <ConfidenceBadge confidence={opportunity.confidence} />
                  </div>
                </li>
              ))}
              {preview.opportunities.length === 0 && (
                <li className="border border-dashed border-border p-4 text-center text-xs text-muted">
                  No default-filter opportunities right now — run your own scan with different filters.
                </li>
              )}
            </ul>
            <Link
              href="/scan"
              className="mt-4 block w-full border border-accent px-4 py-2 text-center text-xs font-bold uppercase tracking-wide text-accent hover:bg-accent hover:text-background"
            >
              Run your own scan →
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted">How it works</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Set your market context",
              body: "Choose which coin pairs and exchange venues matter to you, plus the trade size you'd actually deploy.",
            },
            {
              step: "02",
              title: "Get a ranked result",
              body: "Every venue pair is scored on spread, taker fees, withdrawal cost, and slippage — ranked by estimated net outcome, not raw spread.",
            },
            {
              step: "03",
              title: "Save and revisit",
              body: "Sign in to save opportunities worth watching. Come back anytime to recheck them against fresh simulated conditions.",
            },
          ].map((item) => (
            <div key={item.step} className="border border-border bg-surface p-5">
              <p className="text-2xl font-bold text-accent">{item.step}</p>
              <h3 className="mt-3 text-sm font-bold uppercase tracking-wide">{item.title}</h3>
              <p className="mt-2 text-sm text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-10 text-xs text-muted sm:px-6">
          <p>
            This workspace runs on a deterministic simulator seeded from reference prices, typical venue
            fees, and modeled liquidity depth — it is demo/seed data for evaluating the workflow, not a
            live market feed. Every price, spread, and outcome on this site is labeled simulated.
          </p>
        </div>
      </section>
    </div>
  );
}
