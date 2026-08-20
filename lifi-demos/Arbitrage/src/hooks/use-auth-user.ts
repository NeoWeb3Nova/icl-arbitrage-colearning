"use client";

import { useEffect, useState } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, isBackendConfigured } from "@/lib/supabase/client";

export interface AuthUser {
  id: string;
  email: string;
}

/**
 * Returns `undefined` while the session is loading, `null` when signed out
 * (or when the backend is not configured), and the user otherwise.
 */
export function useAuthUser(): AuthUser | null | undefined {
  const [user, setUser] = useState<AuthUser | null | undefined>(() =>
    isBackendConfigured ? undefined : null
  );

  useEffect(() => {
    if (!isBackendConfigured) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let active = true;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      setUser(data.user ? { id: data.user.id, email: data.user.email ?? "" } : null);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email ?? "" } : null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return user;
}
