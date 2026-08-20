"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient, isBackendConfigured } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";

const NAV_LINKS = [
  { href: "/scan", label: "Scan" },
  { href: "/watchlist", label: "Watchlist" },
];

export function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = useAuthUser();
  const email = user === undefined ? undefined : user?.email ?? null;

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground"
          onClick={() => setMenuOpen(false)}
        >
          <span className="inline-block h-2.5 w-2.5 bg-accent" aria-hidden />
          ARBITRAGE<span className="text-accent">{"//"}</span>SCAN
        </Link>

        <nav className="hidden items-center gap-1 sm:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname?.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm font-semibold uppercase tracking-wide transition-colors ${
                  active ? "text-accent" : "text-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          {!isBackendConfigured ? (
            <span className="text-xs uppercase tracking-wide text-muted">Accounts unavailable</span>
          ) : email === undefined ? (
            <span className="h-8 w-20 animate-pulse bg-surface" aria-hidden />
          ) : email ? (
            <>
              <span className="max-w-[10rem] truncate text-xs text-muted" title={email}>
                {email}
              </span>
              <button
                onClick={handleSignOut}
                className="border border-border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-foreground hover:border-accent hover:text-accent"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="border border-accent px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent hover:bg-accent hover:text-background"
            >
              Sign in
            </Link>
          )}
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center border border-border text-foreground sm:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label="Toggle menu"
        >
          <span className="sr-only">Menu</span>
          <div className="flex flex-col gap-1">
            <span className="h-px w-4 bg-foreground" />
            <span className="h-px w-4 bg-foreground" />
            <span className="h-px w-4 bg-foreground" />
          </div>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-background sm:hidden">
          <nav className="flex flex-col px-4 py-2" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="border-b border-border py-3 text-sm font-semibold uppercase tracking-wide text-foreground"
              >
                {link.label}
              </Link>
            ))}
            {!isBackendConfigured ? (
              <span className="py-3 text-xs uppercase tracking-wide text-muted">
                Accounts unavailable
              </span>
            ) : email ? (
              <button
                onClick={handleSignOut}
                className="py-3 text-left text-sm font-semibold uppercase tracking-wide text-foreground"
              >
                Sign out ({email})
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="py-3 text-sm font-semibold uppercase tracking-wide text-accent"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
