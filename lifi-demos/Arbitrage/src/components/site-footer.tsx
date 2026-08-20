export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>ARBITRAGE//SCAN — opportunity discovery workspace.</p>
        <p className="uppercase tracking-wide">
          All prices, spreads, and liquidity are simulated demo data, not live market feeds.
        </p>
      </div>
    </footer>
  );
}
