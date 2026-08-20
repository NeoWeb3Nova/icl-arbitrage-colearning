"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient, isBackendConfigured } from "@/lib/supabase/client";

type Status = "idle" | "submitting" | "error";

export function AuthForm({ mode, next }: { mode: "login" | "signup"; next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{ email?: string; password?: string }>({});

  if (!isBackendConfigured) {
    return (
      <div className="border border-warning/50 bg-warning/10 p-6 text-sm text-warning">
        Accounts aren&apos;t configured for this deployment yet, so saving and sign-in are unavailable. You
        can still run scans without an account.
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: { email?: string; password?: string } = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Enter a valid email address.";
    if (password.length < 6) errors.password = "Password must be at least 6 characters.";
    setFieldError(errors);
    if (Object.keys(errors).length > 0) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setStatus("submitting");
    setError(null);

    const { error: authError } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (authError) {
      setStatus("error");
      setError(authError.message);
      return;
    }

    router.push(next || "/watchlist");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border bg-surface p-6" noValidate>
      <div>
        <label htmlFor="email" className="text-xs font-bold uppercase tracking-wide text-muted">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(fieldError.email)}
          className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
        {fieldError.email && (
          <p role="alert" className="mt-1 text-xs text-negative">
            {fieldError.email}
          </p>
        )}
      </div>

      <div className="mt-4">
        <label htmlFor="password" className="text-xs font-bold uppercase tracking-wide text-muted">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={Boolean(fieldError.password)}
          className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
        {fieldError.password && (
          <p role="alert" className="mt-1 text-xs text-negative">
            {fieldError.password}
          </p>
        )}
      </div>

      {status === "error" && error && (
        <p role="alert" className="mt-4 text-xs text-negative">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-6 w-full bg-accent px-4 py-3 text-sm font-bold uppercase tracking-wide text-background hover:bg-accent-strong disabled:cursor-wait disabled:opacity-70"
      >
        {status === "submitting" ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
      </button>

      <p className="mt-4 text-center text-xs text-muted">
        {mode === "login" ? (
          <>
            Need an account?{" "}
            <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-accent hover:underline">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-accent hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
