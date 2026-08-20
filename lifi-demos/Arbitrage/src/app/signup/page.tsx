import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthNextReader } from "@/components/auth/auth-next-reader";

export const metadata: Metadata = {
  title: "Create account — Arbitrage//Scan",
};

export default function SignupPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-tight">Create account</h1>
        <p className="mt-2 text-sm text-muted">
          Create an account to save opportunities and revisit them later. No payment required.
        </p>
      </div>
      <Suspense fallback={<div className="h-72 animate-pulse border border-border bg-surface" />}>
        <AuthNextReader mode="signup" />
      </Suspense>
    </div>
  );
}
