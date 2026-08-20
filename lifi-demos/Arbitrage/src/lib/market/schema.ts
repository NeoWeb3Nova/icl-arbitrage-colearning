import { z } from "zod";
import {
  EXCHANGE_IDS,
  PAIR_IDS,
  MAX_CAPITAL_USD,
  MIN_CAPITAL_USD,
} from "./config";

export const scanRequestSchema = z.object({
  pairs: z
    .array(z.enum(PAIR_IDS as [string, ...string[]]))
    .min(1, "Select at least one market to scan.")
    .max(PAIR_IDS.length),
  exchanges: z
    .array(z.enum(EXCHANGE_IDS as [string, ...string[]]))
    .min(2, "Select at least two venues so a spread can be compared."),
  capitalUsd: z
    .number({ error: "Enter a trade size in USD." })
    .min(MIN_CAPITAL_USD, `Minimum trade size is $${MIN_CAPITAL_USD}.`)
    .max(MAX_CAPITAL_USD, `Maximum trade size is $${MAX_CAPITAL_USD.toLocaleString()}.`),
  minSpreadPct: z
    .number()
    .min(0, "Minimum spread cannot be negative.")
    .max(10, "Minimum spread must be 10% or less."),
});

export type ScanRequest = z.infer<typeof scanRequestSchema>;
