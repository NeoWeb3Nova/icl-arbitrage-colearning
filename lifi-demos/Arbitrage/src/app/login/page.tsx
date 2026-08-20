import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthNextReader } from "@/components/auth/auth-next-reader";

export const metadata: Metadata = {
  title: "Sign in — Arbitrage//Scan",
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted">Sign in to save opportunities and revisit your watchlist.</p>
      </div>
      <Suspense fallback={<div className="h-72 animate-pulse border border-border bg-surface" />}>
        <AuthNextReader mode="login" />
      </Suspense>
    </div>
  );
}
