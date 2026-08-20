import { useCallback, useEffect, useMemo, useState } from "react";

const FALLBACK_CHAINS = [
  { binanceChainId: "1", name: "Ethereum", shortName: "ETH" },
  { binanceChainId: "56", name: "BNB Smart Chain", shortName: "BSC" },
  { binanceChainId: "42161", name: "Arbitrum One", shortName: "ARB" },
  { binanceChainId: "8453", name: "Base", shortName: "BASE" },
  { binanceChainId: "CT_501", name: "Solana", shortName: "SOL" },
];

const TIMEFRAMES = [
  { id: "1", label: "1 分钟" },
  { id: "2", label: "5 分钟" },
  { id: "3", label: "1 小时" },
  { id: "4", label: "4 小时" },
  { id: "5", label: "24 小时" },
];

const CANDLE_BARS = [
  { id: "15m", label: "15m" },
  { id: "1h", label: "1h" },
  { id: "4h", label: "4h" },
  { id: "1d", label: "1d" },
];

function formatUsd(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  const abs = Math.abs(number);
  const sign = number < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(2)}K`;
  if (abs >= 1) return `${sign}$${abs.toFixed(2)}`;
  return `${sign}$${abs.toPrecision(4)}`;
}

function formatChange(value) {
  if (value == null || value === "") return { text: "—", tone: "" };
  const number = Number(value);
  if (!Number.isFinite(number)) return { text: String(value), tone: "" };
  const sign = number > 0 ? "+" : "";
  return {
    text: `${sign}${number.toFixed(2)}%`,
    tone: number > 0 ? "positive" : number < 0 ? "negative" : "",
  };
}

function shortAddress(address) {
  if (!address) return "";
  return address.length <= 12 ? address : `${address.slice(0, 6)}…${address.slice(-4)}`;
}

async function marketGet(route, params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "") continue;
    search.set(key, value);
  }
  const suffix = search.toString() ? `?${search}` : "";
  const response = await fetch(`/api/binance/${route}${suffix}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || payload.error || `行情请求失败（HTTP ${response.status}）`);
  }
  if (payload.code && payload.code !== 0) {
    throw new Error(payload.msg || `Market API 业务错误 ${payload.code}`);
  }
  return payload;
}

function Sparkline({ candles }) {
  const closes = (candles || []).map((row) => Number(row[3])).filter(Number.isFinite);
  if (closes.length < 2) return <p className="binance-empty">K 线不足，暂不画图。</p>;

  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || 1;
  const width = 560;
  const height = 140;
  const points = closes.map((close, index) => {
    const x = (index / (closes.length - 1)) * width;
    const y = height - ((close - min) / span) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(" ");
  const rising = closes[closes.length - 1] >= closes[0];

  return (
    <svg className="binance-sparkline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="收盘价走势">
      <polyline fill="none" stroke={rising ? "#12b76a" : "#f04438"} strokeWidth="2.5" points={points} />
    </svg>
  );
}

function TokenRow({ token, selected, onSelect }) {
  const change = formatChange(token.change);
  return (
    <tr className={selected ? "is-selected" : ""} onClick={() => onSelect(token)}>
      <td>
        <div className="binance-token-cell">
          {token.tokenLogoUrl ? <img src={token.tokenLogoUrl} alt="" width="20" height="20" /> : <span className="binance-token-fallback">{(token.tokenSymbol || "?").slice(0, 2)}</span>}
          <div>
            <strong>{token.tokenSymbol || "—"}</strong>
            <small>{shortAddress(token.tokenContractAddress)}</small>
          </div>
        </div>
      </td>
      <td>{formatUsd(token.price)}</td>
      <td className={change.tone}>{change.text}</td>
      <td>{formatUsd(token.volume)}</td>
      <td>{formatUsd(token.marketCap)}</td>
      <td>{formatUsd(token.liquidity)}</td>
    </tr>
  );
}

export function BinanceMarketView() {
  const [chainId, setChainId] = useState("1");
  const [timeframe, setTimeframe] = useState("3");
  const [bar, setBar] = useState("1h");
  const [search, setSearch] = useState("");
  const [chains, setChains] = useState(FALLBACK_CHAINS);
  const [tokens, setTokens] = useState([]);
  const [selected, setSelected] = useState(null);
  const [candles, setCandles] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  const load = useCallback(async (nextSearch = search) => {
    setStatus("loading");
    setError("");
    try {
      const keyword = nextSearch.trim();
      const payload = keyword.length >= 2
        ? await marketGet("search", { chains: chainId, search: keyword })
        : await marketGet("hot-tokens", { binanceChainId: chainId, rankBy: "4", rankingTimeFrame: timeframe, size: "20" });
      const items = Array.isArray(payload.data) ? payload.data : payload.data?.items || [];
      setTokens(items);
      setSelected((current) => {
        if (!items.length) return null;
        const still = current && items.find((item) => item.tokenContractAddress === current.tokenContractAddress);
        return still || items[0];
      });
      setUpdatedAt(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setStatus("ready");
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "行情请求失败");
    }
  }, [chainId, search, timeframe]);

  useEffect(() => {
    marketGet("chains")
      .then((payload) => {
        const items = Array.isArray(payload.data) ? payload.data : [];
        if (items.length) setChains(items);
      })
      .catch(() => {
        setChains(FALLBACK_CHAINS);
      });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { load(); }, search.trim() ? 400 : 0);
    return () => clearTimeout(timer);
  }, [chainId, timeframe, search, load]);

  useEffect(() => {
    if (!selected?.tokenContractAddress) {
      setCandles([]);
      return undefined;
    }
    let cancelled = false;
    marketGet("candles", {
      binanceChainId: selected.binanceChainId || chainId,
      tokenContractAddress: selected.tokenContractAddress,
      bar,
      limit: "48",
    })
      .then((payload) => {
        if (!cancelled) setCandles(Array.isArray(payload.data) ? payload.data : []);
      })
      .catch(() => {
        if (!cancelled) setCandles([]);
      });
    return () => { cancelled = true; };
  }, [selected, bar, chainId]);

  const change = formatChange(selected?.change);
  const lastCandle = candles.length ? candles[candles.length - 1] : null;
  const chainLabel = useMemo(
    () => chains.find((chain) => chain.binanceChainId === chainId)?.name || chainId,
    [chains, chainId],
  );

  return (
    <section className="binance-view" aria-label="Binance Web3 行情">
      <div className="monitoring-heading">
        <div>
          <p className="section-kicker">BINANCE WEB3 MARKET API · READ-ONLY</p>
          <h2>Binance 链上行情</h2>
          <p>热门代币、搜索和 K 线来自 Binance Web3 Market API。这是屏幕行情，不是可执行套利，也没有真实交易。</p>
        </div>
        <span className="read-only-badge">只读行情 · 签名请求走服务端</span>
      </div>

      <div className="binance-toolbar">
        <label>
          <span>链</span>
          <select value={chainId} onChange={(event) => setChainId(event.target.value)}>
            {chains.map((chain) => (
              <option key={chain.binanceChainId} value={chain.binanceChainId}>
                {chain.shortName || chain.name} · {chain.binanceChainId}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>热门窗口</span>
          <select value={timeframe} onChange={(event) => setTimeframe(event.target.value)}>
            {TIMEFRAMES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label className="binance-search">
          <span>搜索</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="符号或合约地址，至少 2 个字符"
            autoComplete="off"
          />
        </label>
        <button type="button" className="refresh-button" onClick={() => load()} disabled={status === "loading"}>
          {status === "loading" ? "请求中…" : "刷新行情"}
        </button>
      </div>

      {error && <p className="live-quote-error" role="alert">{error}</p>}
      {status === "ready" && !tokens.length && !error && <p className="live-quote-empty">当前链没有返回代币。换一条链，或改搜索词。</p>}

      <div className="binance-layout">
        <section className="diagnosis-panel" aria-labelledby="binance-list-title">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">{search.trim().length >= 2 ? "TOKEN SEARCH" : "HOT TOKENS"}</p>
              <h3 id="binance-list-title">{search.trim().length >= 2 ? "搜索结果" : `${chainLabel} 热门代币`}</h3>
            </div>
            <span className="table-note">{updatedAt ? `更新 ${updatedAt}` : "Quote ≠ Fill"}</span>
          </div>
          <div className="opportunity-table-wrap">
            <table className="opportunity-table binance-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Price</th>
                  <th>Change</th>
                  <th>Volume</th>
                  <th>Mkt cap</th>
                  <th>Liquidity</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token) => (
                  <TokenRow
                    key={`${token.binanceChainId}-${token.tokenContractAddress}`}
                    token={token}
                    selected={selected?.tokenContractAddress === token.tokenContractAddress}
                    onSelect={setSelected}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="diagnosis-panel binance-detail" aria-label="代币详情">
          {selected ? (
            <>
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">TOKEN DETAIL</p>
                  <h3>{selected.tokenSymbol || "未命名代币"}</h3>
                  <p>{selected.tokenName || shortAddress(selected.tokenContractAddress)}</p>
                </div>
                <span className={`change-chip ${change.tone}`}>{change.text}</span>
              </div>
              <div className="binance-metrics">
                <div><span>价格</span><strong>{formatUsd(selected.price)}</strong></div>
                <div><span>成交额</span><strong>{formatUsd(selected.volume)}</strong></div>
                <div><span>市值</span><strong>{formatUsd(selected.marketCap)}</strong></div>
                <div><span>流动性</span><strong>{formatUsd(selected.liquidity)}</strong></div>
              </div>
              <div className="binance-bar-row">
                <span>K 线周期</span>
                <div>
                  {CANDLE_BARS.map((item) => (
                    <button key={item.id} type="button" className={bar === item.id ? "is-active" : ""} onClick={() => setBar(item.id)}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <Sparkline candles={candles} />
              <p className="binance-candle-note">
                {lastCandle
                  ? `最近一根：O ${formatUsd(lastCandle[0])}  H ${formatUsd(lastCandle[1])}  L ${formatUsd(lastCandle[2])}  C ${formatUsd(lastCandle[3])}`
                  : "K 线尚未返回。"}
              </p>
              <p className="evidence-row">
                <span>合约 {shortAddress(selected.tokenContractAddress)}</span>
                <span>持有人 {selected.holders || "—"}</span>
              </p>
            </>
          ) : (
            <p className="live-quote-empty">选择左侧代币后，这里显示价格和 K 线。</p>
          )}
        </aside>
      </div>

      <p className="diagnosis-footnote">
        数据来源：Binance Web3 Market API（`/api/v1/dex/market/*`）。请求由本站服务端用 `X-OC-APIKEY`、`X-OC-TIMESTAMP`、`X-OC-SIGN` 签名，密钥不进浏览器。屏幕价差、热门排名和 K 线都不是成交保证，更不能当成净收益。
      </p>
    </section>
  );
}
