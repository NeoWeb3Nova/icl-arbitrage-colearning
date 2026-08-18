import { LiFiWidgetLight } from "@lifi/widget-light";
import { useEthereumIframeHandler } from "@lifi/widget-light/ethereum";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode, useCallback, useMemo, useState } from "react";
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

const monitoringCategories = [
  { id: "scanners", label: "机会扫描器", note: "发现候选机会，再交给诊断终端核验" },
  { id: "funding", label: "资金费率与基差", note: "适合永续合约、期现与跨交易所观察" },
  { id: "routes", label: "跨链路由与聚合器", note: "对比路径、费用、耗时与到手金额" },
  { id: "onchain", label: "DEX、MEV 与市场数据", note: "拆解链上路径、流动性与市场结构" },
  { id: "automation", label: "自动化与执行研究", note: "执行层参考，不代表本站自动交易" },
  { id: "learning", label: "学习与研究资源", note: "建立套利判断所需的基础知识" },
];

const monitoringPlatforms = [
  { category: "scanners", name: "P2P.Army", description: "综合 CEX、DEX/CEX、Funding、Spot/Futures 与三角套利扫描，强调净利润、深度和历史 Spread。", url: "https://p2p.army/en", features: ["净利润", "Order Book", "多类套利"] },
  { category: "scanners", name: "ArbitrageScanner", description: "覆盖 CEX↔DEX、DEX↔DEX 与跨链机会，提供多链扫描和过滤器。", url: "https://arbitragescanner.io/ar/about-dex-scanner", features: ["500+ DEX", "90+ 链", "机会过滤"] },
  { category: "scanners", name: "Yieldo", description: "免费实时扫描器，侧重交易所价差、净利润视角和提现路由状态。", url: "https://yieldo.me/arbitrage", features: ["免费", "净利润", "提现状态"] },
  { category: "scanners", name: "VoltArb", description: "净利润导向的扫描器，结合真实费用、滑点、提现后利润和 Funding 组合。", url: "https://voltarb.com", features: ["费用后利润", "滑点", "Funding"] },
  { category: "scanners", name: "SpreadScan", description: "覆盖 CEX-CEX、P2P 与三角套利，关注费用和提现状态。", url: "https://spreadscan.com", features: ["CEX-CEX", "P2P", "三角套利"] },
  { category: "scanners", name: "Arbitron", description: "信号与回测导向，适合观察历史周期利润估算和机会置信度。", url: "https://arbitron.app", features: ["回测", "历史周期", "置信度"] },
  { category: "funding", name: "Loris Tools", handle: "@LorisTools", description: "专门做加密货币永续合约资金费率套利扫描器，实时数据覆盖广、可灵活筛选。", url: "https://loris.tools", features: ["实时数据", "灵活筛选", "资金费率套利"] },
  { category: "funding", name: "CoinGlass", handle: "@coinglass_com", description: "常用的资金费率与市场数据工具，中文友好，基础功能免费。", url: "https://coinglass.com/zh/FundingRate", features: ["中文界面", "基础免费", "资金费率"] },
  { category: "funding", name: "Sharpe", description: "无需注册，支持 33 家交易所、年化 APR 归一化、币种×交易所热力图和单币跨所对比。", url: "https://sharpe.ai/funding-rates", features: ["无需注册", "33 家交易所", "APR 归一化"] },
  { category: "funding", name: "PerpFinder", handle: "@PerpFinderCom", description: "实时监控套利价差与热力图，同时显示持仓量。", url: "https://perpfinder.com/tools/funding-rates", features: ["实时监控", "套利价差", "持仓量"] },
  { category: "funding", name: "CoinBeacon", description: "简洁排行榜（最高/最低费率），归一化到 8 小时，支持警报。", url: "https://coinbeacon.io/funding-rates", features: ["最高/最低费率", "8 小时归一化", "警报"] },
  { category: "funding", name: "Velo Data", description: "机构级市场数据看板，适合观察跨交易所基差、隐含波动率与资金费率异动。", url: "https://velodata.app", features: ["基差", "隐含波动率", "资金费率"] },
  { category: "routes", name: "LI.FI", description: "跨链路由聚合器；Route Estimate 可用于对比到手金额、费用、Gas 与执行时长。", url: "https://li.fi", features: ["Route", "费用拆解", "执行时长"] },
  { category: "routes", name: "LlamaSwap", description: "Aggregator of Aggregators，同时询价多个聚合器并比较更优执行结果。", url: "https://swap.defillama.com", features: ["聚合器的聚合器", "路线对比", "到手金额"] },
  { category: "routes", name: "Jumper", description: "由 LI.FI 驱动的跨链 DEX/Bridge 聚合体验，适合观察桥和 DEX 路线。", url: "https://jumper.exchange", features: ["跨链", "Bridge", "DEX"] },
  { category: "routes", name: "Rango", description: "跨生态 DEX/Bridge Aggregator，适合研究多链覆盖和折叠式 Route Detail。", url: "https://rango.exchange", features: ["80+ 链", "Route Detail", "跨生态"] },
  { category: "routes", name: "Bungee / Socket", description: "跨链路由与 Simulated Quotes，适合对比耗时、费用和路线，不把报价包装成确定收益。", url: "https://www.bungee.exchange", features: ["Simulated Quotes", "Gas Refuel", "路由对比"] },
  { category: "onchain", name: "EigenPhi", description: "MEV 与 DEX 套利路径分析，适合拆解交易路径、机器人和历史利润。", url: "https://eigenphi.io", features: ["MEV", "交易路径", "Bot 分析"] },
  { category: "onchain", name: "DeFiLlama", description: "链上 DeFi 数据与 Meta-DEX 聚合入口，可辅助观察 DEX、收益和协议流动性。", url: "https://defillama.com", features: ["DEX 聚合", "协议数据", "流动性"] },
  { category: "onchain", name: "Odos", description: "多路径拆单聚合器，适合研究复杂路径和滑点优化。", url: "https://www.odos.xyz", features: ["Smart Order", "多路径", "滑点优化"] },
  { category: "onchain", name: "1inch", description: "经典 DEX 聚合器，适合与其他路由的报价、拆单和流动性进行比较。", url: "https://1inch.io", features: ["DEX 聚合", "拆单", "流动性"] },
  { category: "onchain", name: "CoinMarketCap API", description: "市场情报与行情数据入口，可用于错价发现和外部市场数据对照。", url: "https://coinmarketcap.com/api/", features: ["行情 API", "市场数据", "错价发现"] },
  { category: "automation", name: "Cryptohopper", description: "资金预部署在多个交易所，通过同时操作不同账户做 Exchange Arbitrage，不依赖跨所转账。", url: "https://support.cryptohopper.com/en/articles/9144206-how-does-arbitrage-work", features: ["预部署资金", "CEX 套利", "自动化"] },
  { category: "automation", name: "Hummingbot Academy", description: "开源交易机器人与 Academy 资源，覆盖做市、CEX/DEX 套利和网格机器人。", url: "https://hummingbot.org/academy/", features: ["开源", "机器人", "CEX/DEX"] },
  { category: "learning", name: "Flashbots", description: "MEV、Searcher、私有交易流和原子化套利的基础研究资源。", url: "https://docs.flashbots.net", features: ["MEV", "Searcher", "私有交易流"] },
  { category: "learning", name: "RareSkills DeFi Book", description: "深入理解 AMM、Uniswap 数学、闪电贷和套利机制。", url: "https://www.rareskills.io", features: ["AMM 数学", "闪电贷", "DeFi"] },
  { category: "learning", name: "Paradigm Research", description: "流动性机制、AMM 经济学、无常损失与套利博弈的研究文章。", url: "https://www.paradigm.xyz/writing", features: ["研究", "AMM 经济学", "流动性"] },
  { category: "learning", name: "P2P.Army 三角套利", description: "专门的三角套利 Scanner 页面，集中展示 Order Book、Maker/Taker、Route、Exchange 与 Profit。", url: "https://p2p.army/en/cc/triangle_arbitrage", features: ["三角套利", "Order Book", "Profit"] },
  { category: "learning", name: "P2P.Army DEX/CEX FAQ", description: "关于交易规模、流动性与 DEX/CEX 套利限制的 FAQ，适合作为容量分析入口。", url: "https://p2p.army/en/info/faq-dex", features: ["容量", "流动性", "FAQ"] },
  { category: "learning", name: "LI.FI Route Schemas", description: "Route、feeCosts、gasCosts、toAmountMin 等字段的官方数据结构参考。", url: "https://docs.li.fi/agents/reference/schemas", features: ["官方文档", "feeCosts", "toAmountMin"] },
  { category: "learning", name: "LI.FI Request Routes", description: "advanced/routes 与 CHEAPEST、FASTEST、Bridge/Exchange 过滤参数的官方文档。", url: "https://docs.li.fi/sdk/request-routes", features: ["advanced/routes", "CHEAPEST", "FASTEST"] },
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

const quoteAddress = "0x552008c0f6872d7aa9e46e4b5a8c4a8f8f8f8f8f";
const nativeToken = "0x0000000000000000000000000000000000000000";
const usdcToken = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const initialEthWei = "10000000000000000";

function formatUnits(value, decimals, precision = 6) {
  const digits = String(value).padStart(decimals + 1, "0");
  const whole = digits.slice(0, -decimals) || "0";
  const fraction = digits.slice(-decimals).slice(0, precision).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

function formatRoi(initial, output) {
  const delta = BigInt(output) - BigInt(initial);
  const sign = delta < 0n ? "-" : "+";
  const scaled = (delta < 0n ? -delta : delta) * 100000n / BigInt(initial);
  return `${sign}${scaled / 1000n}.${String(scaled % 1000n).padStart(3, "0")}%`;
}

async function requestQuote(fromToken, toToken, fromAmount) {
  const params = new URLSearchParams({
    fromChain: "42161",
    toChain: "42161",
    fromToken,
    toToken,
    fromAmount,
    fromAddress: quoteAddress,
    toAddress: quoteAddress,
    slippage: "0.005",
  });
  const response = await fetch(`/api/lifi/quote?${params}`);
  if (!response.ok) throw new Error(`Quote 请求失败（HTTP ${response.status}）`);
  return response.json();
}

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

function LiveQuotePanel() {
  const [state, setState] = useState({ status: "idle", data: null, error: "" });
  const refresh = useCallback(async () => {
    setState({ status: "loading", data: null, error: "" });
    try {
      const first = await requestQuote(nativeToken, usdcToken, initialEthWei);
      const theoretical = await requestQuote(usdcToken, nativeToken, first.estimate.toAmount);
      const conservative = await requestQuote(usdcToken, nativeToken, first.estimate.toAmountMin);
      const durations = [first, theoretical, conservative].map((quote) => Number(quote.estimate?.executionDuration || 0));
      setState({
        status: "ready",
        error: "",
        data: {
          first: formatUnits(first.estimate.toAmount, 6),
          firstMin: formatUnits(first.estimate.toAmountMin, 6),
          theoretical: formatUnits(theoretical.estimate.toAmount, 18, 9),
          conservative: formatUnits(conservative.estimate.toAmount, 18, 9),
          theoreticalRoi: formatRoi(initialEthWei, theoretical.estimate.toAmount),
          conservativeRoi: formatRoi(initialEthWei, conservative.estimate.toAmount),
          duration: `${Math.max(...durations)}s`,
          updatedAt: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        },
      });
    } catch (error) {
      setState({ status: "error", data: null, error: error instanceof Error ? error.message : "Quote 请求失败" });
    }
  }, []);

  return (
    <section className="live-quote-panel" aria-label="实时只读报价">
      <div className="live-quote-heading">
        <div><p className="section-kicker">LIVE QUOTE · READ-ONLY</p><h3>刷新当前往返诊断</h3><p>连续请求第一腿、理论第二腿和保守第二腿，不签名、不广播。</p></div>
        <button type="button" className="refresh-button" onClick={refresh} disabled={state.status === "loading"}>{state.status === "loading" ? "请求中…" : "刷新 Quote"}</button>
      </div>
      {state.status === "idle" && <p className="live-quote-empty">尚未请求实时数据。点击刷新后，结果会覆盖本页静态案例指标。</p>}
      {state.status === "error" && <p className="live-quote-error" role="alert">{state.error}。静态案例仍保留，未将失败请求当作机会。</p>}
      {state.data && <div className="live-quote-grid"><div><span>第一腿</span><strong>{state.data.first} USDC</strong><small>最低 {state.data.firstMin}</small></div><div><span>理论 ROI</span><strong className="negative">{state.data.theoreticalRoi}</strong><small>返回 {state.data.theoretical} ETH</small></div><div><span>保守 ROI</span><strong className="negative">{state.data.conservativeRoi}</strong><small>返回 {state.data.conservative} ETH</small></div><div><span>报价时间</span><strong>{state.data.updatedAt}</strong><small>Route {state.data.duration}</small></div></div>}
    </section>
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

      <LiveQuotePanel />

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
      <div className="resource-summary" aria-label="资源集合统计"><strong>{monitoringPlatforms.length}</strong><span>个已整理资源</span><span>·</span><span>6 类研究用途</span><span>·</span><span>全部为外部链接</span></div>
      <div className="resource-sections">
        {monitoringCategories.map((category) => {
          const resources = monitoringPlatforms.filter((platform) => platform.category === category.id);
          return (
            <section className="resource-section" key={category.id} aria-labelledby={`resource-${category.id}`}>
              <div className="resource-section-heading"><div><p className="section-kicker">{category.id.toUpperCase()}</p><h3 id={`resource-${category.id}`}>{category.label}</h3><p>{category.note}</p></div><span>{resources.length} 个</span></div>
              <div className="platform-grid">
                {resources.map((platform) => (
                  <article className="platform-card" key={platform.name}>
                    <div className="platform-card-top">
                      <div className="platform-logo-wrap"><img src={`https://www.google.com/s2/favicons?domain=${new URL(platform.url).hostname}&sz=128`} alt={`${platform.name} logo`} className="platform-logo" /></div>
                      <div><h4>{platform.name}</h4>{platform.handle && <p className="platform-handle">{platform.handle}</p>}</div>
                    </div>
                    <p className="platform-description">{platform.description}</p>
                    <ul className="platform-features" aria-label={`${platform.name} 主要信息`}>{platform.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
                    <a className="platform-link" href={platform.url} target="_blank" rel="noreferrer">打开资源 <span aria-hidden="true">↗</span></a>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <p className="monitoring-note">分类是研究用途，不代表本站背书或实时可用性保证。外部报价、费率、流动性、费用和服务状态需回到原站独立核对；任何屏幕价差都必须经过本站诊断终端验证。</p>
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