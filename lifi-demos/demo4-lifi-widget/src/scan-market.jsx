import { useMemo, useState } from "react";
import { rankScan, SCAN_EXCHANGES, SCAN_PAIRS } from "./scan-simulator.js";
import { SaveButton } from "./account-views.jsx";

const DEFAULT_PAIRS = SCAN_PAIRS.slice(0, 3).map((pair) => pair.id);
const DEFAULT_EXCHANGES = SCAN_EXCHANGES.slice(0, 4).map((exchange) => exchange.id);

function formatUsd(value) {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

function formatPct(value) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function ToggleGroup({ label, items, selected, onToggle, displayKey = "display" }) {
  return (
    <fieldset className="scan-fieldset">
      <legend>{label}</legend>
      <div className="scan-toggle-group" role="group" aria-label={label}>
        {items.map((item) => {
          const active = selected.includes(item.id);
          return (
            <button key={item.id} type="button" aria-pressed={active} className={active ? "is-active" : ""} onClick={() => onToggle(item.id)}>
              {item[displayKey] || item.name}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function ScanResult({ opportunity, rank, capitalUsd, onInvestigate, onAuthRequired }) {
  const positive = opportunity.netOutcomeUsd > 0;
  return (
    <li className="scan-result-card">
      <div className="scan-result-main">
        <div className="scan-rank">{rank}</div>
        <div>
          <div className="scan-result-title"><strong>{opportunity.pair}</strong><span className={`scan-confidence confidence-${opportunity.confidence}`}>{opportunity.confidence} confidence</span></div>
          <p>{opportunity.buy} → {opportunity.sell}</p>
          <small>{opportunity.action}</small>
        </div>
        <div className="scan-result-numbers"><strong className="scan-spread">{formatPct(opportunity.grossSpreadPct)}</strong><strong className={positive ? "positive" : "negative"}>{formatUsd(opportunity.netOutcomeUsd)} net</strong></div>
      </div>
      <div className="scan-result-footer"><span>Capital {formatUsd(capitalUsd)} · costs {formatUsd(opportunity.totalCostsUsd)}</span><div className="scan-result-actions"><SaveButton opportunity={opportunity} capitalUsd={capitalUsd} onAuthRequired={onAuthRequired} /><button type="button" onClick={onInvestigate}>Investigate →</button></div></div>
    </li>
  );
}

export function ScanView({ onInvestigate, onAuthRequired }) {
  const [pairs, setPairs] = useState(DEFAULT_PAIRS);
  const [exchanges, setExchanges] = useState(DEFAULT_EXCHANGES);
  const [capitalUsd, setCapitalUsd] = useState("5000");
  const [minSpreadPct, setMinSpreadPct] = useState("0.15");
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);

  const toggle = (setter) => (id) => setter((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const canScan = useMemo(() => pairs.length > 0 && exchanges.length > 1 && Number(capitalUsd) >= 50 && Number(capitalUsd) <= 5_000_000 && Number(minSpreadPct) >= 0, [pairs, exchanges, capitalUsd, minSpreadPct]);

  function submit(event) {
    event.preventDefault();
    if (!canScan) { setStatus("error"); return; }
    setStatus("loading");
    window.setTimeout(() => {
      setResult(rankScan({ pairs, exchanges, capitalUsd: Number(capitalUsd), minSpreadPct: Number(minSpreadPct) }));
      setStatus("success");
    }, 120);
  }

  return (
    <section className="scan-view" aria-label="套利机会扫描">
      <div className="scan-heading">
        <div><p className="section-kicker">OPPORTUNITY DISCOVERY FOR TRADERS</p><h2>Stop tab-switching between exchanges.</h2><p>选择市场、交易所和实际投入金额，按扣除手续费、提现成本和滑点后的净结果排序。</p></div>
        <span className="simulated-badge"><span className="live-dot" />Simulated data</span>
      </div>
      <form className="scan-form" onSubmit={submit}>
        <ToggleGroup label="1. Markets to scan" items={SCAN_PAIRS} selected={pairs} onToggle={toggle(setPairs)} />
        <ToggleGroup label="2. Venues to compare" items={SCAN_EXCHANGES} selected={exchanges} onToggle={toggle(setExchanges)} displayKey="name" />
        <div className="scan-input-grid"><label>3. Trade size (USD)<input type="number" min="50" max="5000000" step="100" value={capitalUsd} onChange={(event) => setCapitalUsd(event.target.value)} /></label><label>Minimum gross spread (%)<input type="number" min="0" max="10" step="0.05" value={minSpreadPct} onChange={(event) => setMinSpreadPct(event.target.value)} /></label></div>
        <button className="scan-submit" type="submit" disabled={status === "loading"}>{status === "loading" ? "Scanning…" : "Scan for opportunities"}</button>
        {status === "error" && <p className="scan-error" role="alert">至少选择一个市场、两个交易所，并输入有效资金与价差。</p>}
      </form>
      <section className="scan-results" aria-live="polite">
        {status === "idle" && <div className="scan-empty">Set your filters above and run a scan to see ranked opportunities.</div>}
        {status === "success" && result && <><div className="scan-results-meta"><span>{result.opportunities.length} ranked results · {result.scannedCount} venue pairs scanned</span><span>Deterministic simulator · {new Date(result.generatedAt).toLocaleTimeString("zh-CN")}</span></div>{result.opportunities.length ? <ol>{result.opportunities.map((opportunity, index) => <ScanResult key={opportunity.id} opportunity={opportunity} rank={index + 1} capitalUsd={Number(capitalUsd)} onInvestigate={onInvestigate} onAuthRequired={onAuthRequired} />)}</ol> : <div className="scan-empty">No opportunities meet your filters right now.</div>}</>}
      </section>
    </section>
  );
}
