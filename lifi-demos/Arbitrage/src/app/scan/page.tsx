import { Suspense } from "react";
import type { Metadata } from "next";
import { ScanWorkspace } from "@/components/scan/scan-workspace";

export const metadata: Metadata = {
  title: "Scan for opportunities — Arbitrage//Scan",
};

export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
          <div className="h-64 animate-pulse border border-border bg-surface" />
        </div>
      }
    >
      <ScanWorkspace />
    </Suspense>
  );
}
