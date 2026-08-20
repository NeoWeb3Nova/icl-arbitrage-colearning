import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isBackendConfigured = Boolean(supabaseUrl && supabaseKey);

/**
 * Server Component / Route Handler client bound to the request's auth
 * cookies. Returns null when the host has not injected backend
 * configuration yet.
 */
export async function getSupabaseServerClient() {
  if (!supabaseUrl || !supabaseKey) return null;
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component that cannot set cookies; the
          // middleware refresh path covers session persistence in that case.
        }
      },
    },
  });
}
