import type { ExchangeId, PairId } from "./config";

export interface OpportunityKey {
  pair: PairId;
  buyExchange: ExchangeId;
  sellExchange: ExchangeId;
}

const SEPARATOR = "~";

// Isomorphic base64url helpers: identifiers only ever contain plain ASCII
// (pair/exchange ids), so a simple btoa/atob path is safe in the browser,
// with a Buffer fallback for the Node.js route handler runtime.
function toBase64(raw: string): string {
  if (typeof btoa === "function") return btoa(raw);
  return Buffer.from(raw, "utf-8").toString("base64");
}

function fromBase64(encoded: string): string {
  if (typeof atob === "function") return atob(encoded);
  return Buffer.from(encoded, "base64").toString("utf-8");
}

export function encodeOpportunityId(key: OpportunityKey): string {
  const raw = [key.pair, key.buyExchange, key.sellExchange].join(SEPARATOR);
  return toBase64(raw)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeOpportunityId(id: string): OpportunityKey | null {
  try {
    const normalized = id.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const raw = fromBase64(padded);
    const [pair, buyExchange, sellExchange] = raw.split(SEPARATOR);
    if (!pair || !buyExchange || !sellExchange) return null;
    return {
      pair: pair as PairId,
      buyExchange: buyExchange as ExchangeId,
      sellExchange: sellExchange as ExchangeId,
    };
  } catch {
    return null;
  }
}
