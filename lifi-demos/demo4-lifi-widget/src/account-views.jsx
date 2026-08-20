import { useCallback, useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "./supabase.js";
import { useAuthUser } from "./use-auth-user.js";

export function AuthView({ mode, onDone }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (!supabaseConfigured) return <section className="account-view"><p className="account-warning">Supabase 未配置。请设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。</p></section>;

  async function submit(event) {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) { setError("请输入有效邮箱，密码至少 6 位。"); return; }
    setPending(true); setError("");
    const result = mode === "login" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password });
    setPending(false);
    if (result.error) { setError(result.error.message); return; }
    onDone();
  }

  return <section className="account-view"><div className="account-heading"><p className="section-kicker">SUPABASE AUTH</p><h2>{mode === "login" ? "Sign in" : "Create account"}</h2><p>登录后可以保存 Scan 结果并在 Watchlist 中复核。</p></div><form className="account-form" onSubmit={submit}><label>Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className="account-error" role="alert">{error}</p>}<button className="scan-submit" disabled={pending}>{pending ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button></form></section>;
}

export function SaveButton({ opportunity, capitalUsd, onAuthRequired }) {
  const user = useAuthUser();
  const [state, setState] = useState("idle");
  async function save() {
    if (!user) { onAuthRequired(); return; }
    setState("saving");
    const { error } = await supabase.from("watchlist_items").insert({ user_id: user.id, pair: opportunity.pair, buy_exchange: opportunity.buy, sell_exchange: opportunity.sell, capital_usd: capitalUsd, spread_pct: opportunity.grossSpreadPct, net_outcome_usd: opportunity.netOutcomeUsd, status: "watching" }).select("id").single();
    setState(error ? "error" : "saved");
  }
  if (!supabaseConfigured) return <span className="account-disabled">Save unavailable</span>;
  if (user === undefined) return <span className="account-disabled">Checking account…</span>;
  if (state === "saved") return <span className="account-saved">Saved</span>;
  return <button type="button" className="scan-save" disabled={state === "saving"} onClick={save}>{state === "saving" ? "Saving…" : state === "error" ? "Retry save" : user ? "Save to watchlist" : "Sign in to save"}</button>;
}

export function WatchlistView({ onScan }) {
  const user = useAuthUser();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!supabase || !user) return;
    setStatus("loading");
    const result = await supabase.from("watchlist_items").select("*").order("created_at", { ascending: false });
    if (result.error) { setError(result.error.message); setStatus("error"); return; }
    setItems(result.data || []); setStatus("ready");
  }, [user]);
  useEffect(() => { void load(); }, [load]);
  if (!supabaseConfigured) return <section className="account-view"><p className="account-warning">Supabase 未配置，Watchlist 暂不可用。</p></section>;
  if (user === undefined || status === "loading") return <section className="account-view"><div className="scan-empty">Loading watchlist…</div></section>;
  if (!user) return <section className="account-view"><div className="scan-empty">Sign in to view your watchlist.</div></section>;
  if (status === "error") return <section className="account-view"><p className="account-error">{error}</p><button className="scan-submit" onClick={load}>Retry</button></section>;
  return <section className="account-view"><div className="account-heading"><p className="section-kicker">SAVED OPPORTUNITIES</p><h2>Your watchlist</h2><p>保存时的模拟结果与当前状态。</p></div>{items.length === 0 ? <div className="scan-empty">You haven&apos;t saved any opportunities yet.<button className="scan-submit" onClick={onScan}>Go to scan</button></div> : <ul className="watchlist-list">{items.map((item) => <li className="watchlist-item" key={item.id}><div><strong>{item.pair}</strong><p>{item.buy_exchange} → {item.sell_exchange}</p><small>{new Date(item.created_at).toLocaleString()} · ${Number(item.capital_usd).toFixed(2)} capital</small></div><div className="watchlist-right"><strong className="scan-spread">+{Number(item.spread_pct).toFixed(2)}%</strong><strong className={Number(item.net_outcome_usd) > 0 ? "positive" : "negative"}>${Number(item.net_outcome_usd).toFixed(2)}</strong><select value={item.status} onChange={async (event) => { const statusValue = event.target.value; setItems((current) => current.map((row) => row.id === item.id ? { ...row, status: statusValue } : row)); await supabase.from("watchlist_items").update({ status: statusValue }).eq("id", item.id); }}><option value="watching">Watching</option><option value="investigated">Investigated</option><option value="dismissed">Dismissed</option></select><button onClick={async () => { await supabase.from("watchlist_items").delete().eq("id", item.id); setItems((current) => current.filter((row) => row.id !== item.id)); }}>Remove</button></div></li>)}</ul>}</section>;
}
