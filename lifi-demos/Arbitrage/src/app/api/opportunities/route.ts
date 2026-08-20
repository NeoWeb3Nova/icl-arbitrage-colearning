import { NextResponse } from "next/server";
import { scanRequestSchema } from "@/lib/market/schema";
import { rankOpportunities } from "@/lib/market/simulate";
import { MAX_RESULTS } from "@/lib/market/config";
import type { ExchangeId, PairId } from "@/lib/market/config";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const parsed = scanRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Fix the highlighted fields and scan again.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 }
    );
  }

  const { pairs, exchanges, capitalUsd, minSpreadPct } = parsed.data;

  const { opportunities, scannedCount, bucket } = rankOpportunities({
    pairs: pairs as PairId[],
    exchanges: exchanges as ExchangeId[],
    capitalUsd,
    minSpreadPct,
    maxResults: MAX_RESULTS,
  });

  return NextResponse.json({
    simulated: true,
    generatedAt: new Date().toISOString(),
    bucket,
    scannedCount,
    opportunities,
  });
}
