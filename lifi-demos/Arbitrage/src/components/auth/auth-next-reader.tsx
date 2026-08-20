"use client";

import { useSearchParams } from "next/navigation";
import { AuthForm } from "./auth-form";

export function AuthNextReader({ mode }: { mode: "login" | "signup" }) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/watchlist";
  return <AuthForm mode={mode} next={next} />;
}
