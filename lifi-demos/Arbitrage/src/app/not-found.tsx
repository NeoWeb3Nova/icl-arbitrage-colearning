import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">404</p>
      <h1 className="text-2xl font-bold uppercase tracking-tight">This page or link doesn&apos;t exist</h1>
      <p className="text-sm text-muted">
        The opportunity link may be malformed or the venues involved are no longer part of this
        workspace. Start a fresh scan instead.
      </p>
      <Link
        href="/scan"
        className="mt-2 bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wide text-background hover:bg-accent-strong"
      >
        Go to scan
      </Link>
    </div>
  );
}
