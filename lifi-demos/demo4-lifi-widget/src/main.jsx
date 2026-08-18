import { LiFiWidgetLight } from "@lifi/widget-light";
import { useEthereumIframeHandler } from "@lifi/widget-light/ethereum";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient, http } from "viem";
import { arbitrum, base, mainnet, optimism, polygon } from "viem/chains";
import { createConfig, useConnect, useConnection, useDisconnect, WagmiProvider } from "wagmi";
import { injected } from "wagmi/connectors";
import { ETH_USDC_ETH_WORKFLOW as workflow } from "./workflows/eth-usdc-eth.js";
import "./styles.css";

const widgetConfig = {
  integrator: "arbitrage-research",
  variant: "compact",
  appearance: "light",
  fromChain: 1,
  toChain: 42161,
  fromToken: "0x0000000000000000000000000000000000000000",
  toToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  routePriority: "RECOMMENDED",
  slippage: 0.005,
  buildUrl: true,
  languages: { default: "zh", allow: ["zh", "en"] },
  chains: { allow: [1, 10, 137, 8453, 42161] },
  theme: { container: { border: "1px solid #dfe3f0", borderRadius: "16px" } },
  sdkConfig: {
    apiUrl: `${window.location.origin}/api/lifi`,
    routeOptions: { maxPriceImpact: 0.1, allowSwitchChain: true },
  },
};

const wagmiConfig = createConfig({
  chains: [mainnet, arbitrum, base, optimism, polygon],
  connectors: [injected()],
  client: ({ chain }) => createClient({ chain, transport: http() }),
  multiInjectedProviderDiscovery: true,
  ssr: false,
});

const queryClient = new QueryClient();

const monitoringPlatforms = [
  { name: "Loris Tools", handle: "@LorisTools", description: "专门做加密货币永续合约资金费率套利扫描器，实时数据覆盖广、可灵活筛选。", url: "https://loris.tools", image: "https://www.google.com/s2/favicons?domain=loris.tools&sz=128", features: ["实时数据", "灵活筛选", "资金费率套利"] },
  { name: "CoinGlass", handle: "@coinglass_com", description: "比较常用，中文友好，基础功能免费。", url: "https://coinglass.com/zh/FundingRate", image: "https://www.google.com/s2/favicons?domain=coinglass.com&sz=128", features: ["中文界面", "基础免费", "资金费率"] },
  { name: "Sharpe", description: "无需注册，支持 33 家交易所、年化 APR 归一化、币种×交易所热力图和单币跨所对比。", url: "https://sharpe.ai/funding-rates", image: "https://www.google.com/s2/favicons?domain=sharpe.ai&sz=128", features: ["无需注册", "33 家交易所", "APR 归一化"] },
  { name: "PerpFinder", handle: "@PerpFinderCom", description: "实时监控套利价差与热力图，同时显示持仓量。", url: "https://perpfinder.com/tools/funding-rates", image: "https://www.google.com/s2/favicons?domain=perpfinder.com&sz=128", features: ["实时监控", "套利价差", "持仓量"] },
  { name: "CoinBeacon", description: "简洁排行榜（最高/最低费率），归一化到 8 小时，支持警报。", url: "https://coinbeacon.io/funding-rates", image: "https://www.google.com/s2/favicons?domain=coinbeacon.io&sz=128", features: ["最高/最低费率", "8 小时归一化", "警报"] },
];

const diagnosisSnapshot = {
  route: "Arbitrum ETH → USDC → ETH",
  capital: "0.01 ETH",
  capitalUsd: "$19.04",
  theoreticalReturn: "0.009964721 ETH",
  theoreticalRoi: "-0.353%",
  conservativeReturn: "0.009865324 ETH",
  conservativeRoi: "-1.347%",
  quoteAge: "未记录",
  duration: "0s（快照）",
  evidence: "/evidence/20260818-lifi-paper-trade.json",
};

function shortAddress(address) {
  return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";
}

function DetailList({ title, values }) {
  if (!values || (Array.isArray(values) && values.length === 0)) return null;
  const entries = Array.isArray(values) ? values.map((value, index) => [index, value]) : Object.entries(values);
  return (
    <div className="detail-group">
      <h4>{title}</h4>
      <dl>
        {entries.map(([key, value]) => (
          <div className="detail-row" key={key}>
            <dt>{typeof key === "number" ? "" : key}</dt>
            <dd>{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Inspector({ node }) {
  return (
    <aside className="inspector" aria-label="当前工作流节点详情">
      <div className="sr-only" aria-live="polite">已选择：{node.title}</div>
      <div className="inspector-heading">
        <div>
          <p className="section-kicker">NODE INSPECTOR</p>
          <h2>{node.title}</h2>
        </div>
        <span className={`status status-${node.status}`}>{node.status}</span>
      </div>
      <p className="inspector-why">{node.why}</p>
      <DetailList title="前置条件" values={node.prerequisites} />
      <DetailList title="输入" values={node.inputs} />
      <DetailList title="输出" values={node.outputs} />
      <DetailList title="证据" values={node.evidence} />
      <DetailList title="失败条件" values={node.failureConditions} />
      <div className="next-step">
        <strong>下一步</strong>
        <span>{node.next ? workflow.nodes.find((item) => item.id === node.next)?.title : "实验结束"}</span>
      </div>
    </aside>
  );
}

function WorkflowCanvas({ selectedId, onSelect }) {
  return (
    <div className="workflow-canvas" aria-label="套利实验工作流">
      <div className="workflow-rail">
        {workflow.nodes.map((node, index) => (
          <div className="workflow-slot" key={node.id}>
            <button
              type="button"
              className={`workflow-node ${selectedId === node.id ? "is-selected" : ""}`}
              aria-pressed={selectedId === node.id}
              onClick={() => onSelect(node.id)}
            >
              <span className="node-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="node-copy">
                <strong>{node.title}</strong>
                <small>{node.kind} · {node.status}</small>
              </span>
              <span className={`node-dot dot-${node.status}`} aria-hidden="true" />
            </button>
            {index < workflow.nodes.length - 1 && <span className="workflow-connector" aria-hidden="true" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function DiagnosisView() {
  const funnel = [
    ["报价快照", "1", "已记录"],
    ["理论往返", "1", diagnosisSnapshot.theoreticalRoi],
    ["保守往返", "1", diagnosisSnapshot.conservativeRoi],
    ["可执行机会", "0", "未通过"],
  ];
  const legs = [
    { label: "LEG 1", title: "ETH → USDC", input: "0.01 ETH", output: "19.014502 USDC", minimum: "18.919429 USDC", cost: "$0.0777" },
    { label: "LEG 2 · CONSERVATIVE", title: "USDC → ETH", input: "18.919429 USDC", output: "0.009865324 ETH", minimum: "0.009865324 ETH", cost: "$0.0702" },
  ];

  return (
    <section className="diagnosis-view" aria-label="跨链套利诊断终端">
      <div className="diagnosis-hero">
        <div>
          <p className="section-kicker">CROSS-CHAIN OPPORTUNITY & EXECUTION RESEARCH</p>
          <h2>套利诊断终端</h2>
          <p>发现价差，拆解成本，验证这笔套利是否真的存在。</p>
        </div>
        <div className="snapshot-badge"><span className="live-dot" />只读案例快照</div>
      </div>

      <div className="diagnosis-summary">
        <div>
          <p className="section-kicker">CURRENT CASE</p>
          <h3>{diagnosisSnapshot.route}</h3>
          <p>Paper Trading · Arbitrum One · 无签名、无广播</p>
        </div>
        <div className="verdict verdict-rejected"><span>✕</span><strong>NOT EXECUTION ROBUST</strong><small>保守结果为负，不执行</small></div>
      </div>

      <div className="metric-grid" aria-label="套利诊断核心指标">
        <div className="metric-card"><span>投入资本</span><strong>{diagnosisSnapshot.capital}</strong><small>{diagnosisSnapshot.capitalUsd}</small></div>
        <div className="metric-card"><span>理论 ROI</span><strong className="negative">{diagnosisSnapshot.theoreticalRoi}</strong><small>Return {diagnosisSnapshot.theoreticalReturn}</small></div>
        <div className="metric-card"><span>保守 ROI</span><strong className="negative">{diagnosisSnapshot.conservativeRoi}</strong><small>toAmountMin 路径</small></div>
        <div className="metric-card"><span>Quote Age</span><strong>{diagnosisSnapshot.quoteAge}</strong><small>证据未记录新鲜度</small></div>
        <div className="metric-card"><span>Route Duration</span><strong>{diagnosisSnapshot.duration}</strong><small>provider snapshot</small></div>
      </div>

      <div className="diagnosis-columns">
        <section className="diagnosis-panel" aria-labelledby="opportunity-title">
          <div className="panel-heading"><div><p className="section-kicker">OPPORTUNITIES</p><h3 id="opportunity-title">机会表</h3></div><span className="table-note">Quote ≠ Fill</span></div>
          <div className="opportunity-table-wrap">
            <table className="opportunity-table">
              <thead><tr><th>Route</th><th>Capital</th><th>Expected</th><th>Worst-case</th><th>Status</th></tr></thead>
              <tbody><tr><td>{diagnosisSnapshot.route}</td><td>{diagnosisSnapshot.capital}</td><td className="negative">{diagnosisSnapshot.theoreticalRoi}</td><td className="negative">{diagnosisSnapshot.conservativeRoi}</td><td><span className="table-status">REJECTED</span></td></tr></tbody>
            </table>
          </div>
          <div className="evidence-row"><span>证据：{diagnosisSnapshot.evidence}</span><span>状态：无真实交易</span></div>
        </section>

        <section className="diagnosis-panel" aria-labelledby="funnel-title">
          <div className="panel-heading"><div><p className="section-kicker">DIAGNOSIS FUNNEL</p><h3 id="funnel-title">机会死在哪一步</h3></div></div>
          <div className="funnel-list">{funnel.map(([label, count, note], index) => <div className="funnel-row" key={label}><span className="funnel-index">0{index + 1}</span><strong>{label}</strong><b>{count}</b><small>{note}</small></div>)}</div>
        </section>
      </div>

      <div className="diagnosis-columns">
        <section className="diagnosis-panel" aria-labelledby="reasons-title">
          <div className="panel-heading"><div><p className="section-kicker">REJECTION REASONS</p><h3 id="reasons-title">为什么没有套利</h3></div></div>
          <ul className="reason-list"><li><span className="reason-icon">01</span><div><strong>理论往返已经为负</strong><small>最终返回 0.009964721 ETH，低于起始 0.01 ETH。</small></div></li><li><span className="reason-icon">02</span><div><strong>滑点保护后进一步恶化</strong><small>使用第一腿 toAmountMin 重报价，保守 ROI 降至 {diagnosisSnapshot.conservativeRoi}。</small></div></li><li><span className="reason-icon">03</span><div><strong>时效性证据不足</strong><small>当前快照没有 Quote Age 与机会持续时间，不能宣称可执行。</small></div></li></ul>
        </section>

        <section className="diagnosis-panel" aria-labelledby="route-detail-title">
          <div className="panel-heading"><div><p className="section-kicker">ROUTE DETAIL</p><h3 id="route-detail-title">两腿成本与连续性</h3></div></div>
          <div className="leg-list">{legs.map((leg) => <div className="leg-card" key={leg.label}><div className="leg-heading"><span>{leg.label}</span><strong>{leg.title}</strong></div><dl><div><dt>Input</dt><dd>{leg.input}</dd></div><div><dt>toAmount</dt><dd>{leg.output}</dd></div><div><dt>toAmountMin</dt><dd>{leg.minimum}</dd></div><div><dt>费用 + Gas</dt><dd>{leg.cost}</dd></div></dl></div>)}</div>
        </section>
      </div>

      <p className="diagnosis-footnote">本页只展示已归档的报价模拟。后续接入实时扫描前，仍需补齐 Quote Age、executionDuration、历史 persistence 与 capacity curve。</p>
    </section>
  );
}

function ExperimentView() {
  const [selectedId, setSelectedId] = useState(workflow.nodes[0].id);
  const selectedNode = workflow.nodes.find((node) => node.id === selectedId) ?? workflow.nodes[0];

  return (
    <>
      <section className="result-banner" aria-label="实验结论">
        <div>
          <p className="section-kicker">PAPER TRADING · READ-ONLY</p>
          <h2>保守往返结果为负</h2>
          <p>理论结果与保守结果均未覆盖起始资产，结论：明确否定信号，不执行。</p>
        </div>
        <strong>无真实交易</strong>
      </section>
      <section className="experiment-layout" aria-label="套利实验工作流与节点详情">
        <div className="workflow-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">WORKFLOW</p>
              <h2>{workflow.title}</h2>
            </div>
            <span className="chain-chip">{workflow.chain}</span>
          </div>
          <p className="panel-description">按顺序查看每一步的目标、输入、输出、证据和失败条件。</p>
          <WorkflowCanvas selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <Inspector node={selectedNode} />
      </section>
    </>
  );
}

function ToolsView({ chain, isConnected, address, connect, disconnect, isPending }) {
  const ethereumHandler = useEthereumIframeHandler();
  const handlers = useMemo(() => [ethereumHandler], [ethereumHandler]);

  return (
    <section className="tools-view" aria-label="LI.FI 工具">
      <div className="tools-heading">
        <div>
          <p className="section-kicker">TOOLBOX</p>
          <h2>LI.FI 实时换币与跨链</h2>
          <p>工具负责获取路径和执行交易；它本身不是套利判断引擎。</p>
        </div>
        <button
          className="wallet-button"
          type="button"
          onClick={() => isConnected ? disconnect({}) : connect({ connector: injected() })}
          disabled={isPending}
        >
          {isPending ? "连接中…" : isConnected ? `${shortAddress(address)} · 断开` : "连接钱包"}
        </button>
      </div>
      <div className="notice" role="note">
        <strong>执行边界</strong>
        <span>报价会过期；请核对链、资产、最低到账、Gas 与路径。本站不托管密钥，也不会自动签名。</span>
        {chain && <span className="network">当前钱包：{chain.name}</span>}
      </div>
      <LiFiWidgetLight config={widgetConfig} handlers={handlers} autoResize className="widget" title="LI.FI 换币与跨链 Widget" />
    </section>
  );
}

function MonitoringPlatformsView() {
  return (
    <section className="monitoring-view" aria-label="套利监控平台集合">
      <div className="monitoring-heading">
        <div>
          <p className="section-kicker">FUNDING RATE MONITORS</p>
          <h2>套利监控平台集合</h2>
          <p>用这些工具发现永续合约资金费率机会；屏幕价差不等于可执行净收益。</p>
        </div>
        <span className="read-only-badge">外部工具 · 只读</span>
      </div>
      <div className="platform-grid">
        {monitoringPlatforms.map((platform) => (
          <article className="platform-card" key={platform.name}>
            <div className="platform-card-top">
              <div className="platform-logo-wrap">
                <img src={platform.image} alt={`${platform.name} logo`} className="platform-logo" />
              </div>
              <div>
                <h3>{platform.name}</h3>
                {platform.handle && <p className="platform-handle">{platform.handle}</p>}
              </div>
            </div>
            <p className="platform-description">{platform.description}</p>
            <ul className="platform-features" aria-label={`${platform.name} 主要信息`}>
              {platform.features.map((feature) => <li key={feature}>{feature}</li>)}
            </ul>
            <a className="platform-link" href={platform.url} target="_blank" rel="noreferrer">
              打开平台 <span aria-hidden="true">↗</span>
            </a>
          </article>
        ))}
      </div>
      <p className="monitoring-note">提示：费率、APR、持仓量和警报均以各平台实时页面为准，执行前仍需独立核对流动性、手续费、滑点、延迟和单腿成交风险。</p>
    </section>
  );
}

function App() {
  const [view, setView] = useState("diagnosis");
  const { address, chain, isConnected } = useConnection();
  const { mutate: connect, isPending } = useConnect();
  const { mutate: disconnect } = useDisconnect();

  return (
    <main>
      <header className="site-header">
        <div>
          <p className="eyebrow">ARBITRAGE CO-LEARNING LAB</p>
          <h1>从价差观察，到可验证结论。</h1>
          <p className="subtitle">用工作流拆开每一次套利实验：背景、报价、成本、风险与否定条件。</p>
        </div>
        {(view === "diagnosis" || view === "experiment") && (
          <span className="read-only-badge">只读研究 · 不自动交易</span>
        )}
      </header>

      <nav className="view-nav" aria-label="网站主要区域">
        <button type="button" className={view === "diagnosis" ? "is-active" : ""} aria-current={view === "diagnosis" ? "page" : undefined} onClick={() => setView("diagnosis")}>诊断终端</button>
        <button type="button" className={view === "experiment" ? "is-active" : ""} aria-current={view === "experiment" ? "page" : undefined} onClick={() => setView("experiment")}>实验工作流</button>
        <button type="button" className={view === "tools" ? "is-active" : ""} aria-current={view === "tools" ? "page" : undefined} onClick={() => setView("tools")}>LI.FI 工具</button>
        <button type="button" className={view === "monitoring" ? "is-active" : ""} aria-current={view === "monitoring" ? "page" : undefined} onClick={() => setView("monitoring")}>套利监控平台</button>
      </nav>

      {view === "diagnosis" ? (
        <DiagnosisView />
      ) : view === "experiment" ? (
        <ExperimentView />
      ) : view === "tools" ? (
        <ToolsView chain={chain} isConnected={isConnected} address={address} connect={connect} disconnect={disconnect} isPending={isPending} />
      ) : <MonitoringPlatformsView />}
    </main>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <App />
      </WagmiProvider>
    </QueryClientProvider>
  </StrictMode>,
);