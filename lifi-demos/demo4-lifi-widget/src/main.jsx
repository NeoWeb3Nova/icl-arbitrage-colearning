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
  const [view, setView] = useState("experiment");
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
        {view === "experiment" && (
          <span className="read-only-badge">只读实验 · 不自动交易</span>
        )}
      </header>

      <nav className="view-nav" aria-label="网站主要区域">
        <button type="button" className={view === "experiment" ? "is-active" : ""} aria-current={view === "experiment" ? "page" : undefined} onClick={() => setView("experiment")}>实验工作流</button>
        <button type="button" className={view === "tools" ? "is-active" : ""} aria-current={view === "tools" ? "page" : undefined} onClick={() => setView("tools")}>LI.FI 工具</button>
        <button type="button" className={view === "monitoring" ? "is-active" : ""} aria-current={view === "monitoring" ? "page" : undefined} onClick={() => setView("monitoring")}>套利监控平台</button>
      </nav>

      {view === "experiment" ? (
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