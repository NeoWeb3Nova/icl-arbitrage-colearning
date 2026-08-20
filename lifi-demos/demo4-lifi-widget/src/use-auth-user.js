import { useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "./supabase.js";

export function useAuthUser() {
  const [user, setUser] = useState(() => supabaseConfigured ? undefined : null);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setUser(data.user ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return user;
}
