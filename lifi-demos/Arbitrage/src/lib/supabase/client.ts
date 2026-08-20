"use client";

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isBackendConfigured = Boolean(supabaseUrl && supabaseKey);

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Returns a browser Supabase client, or null when the host has not yet
 * injected backend configuration. Callers must handle the null case with an
 * honest "backend not configured" state rather than a silent local fallback.
 */
export function getSupabaseBrowserClient() {
  if (!supabaseUrl || !supabaseKey) return null;
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseKey);
  }
  return browserClient;
}
