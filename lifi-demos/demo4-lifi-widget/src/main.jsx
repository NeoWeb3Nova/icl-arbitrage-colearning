import { LiFiWidgetLight } from "@lifi/widget-light";
import { useEthereumIframeHandler } from "@lifi/widget-light/ethereum";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { createClient, http } from "viem";
import { arbitrum, base, mainnet, optimism, polygon } from "viem/chains";
import { createConfig, useConnect, useConnection, useDisconnect, WagmiProvider } from "wagmi";
import { injected } from "wagmi/connectors";
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
  theme: {
    container: { border: "1px solid #dfe3f0", borderRadius: "16px" },
  },
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

function shortAddress(address) {
  return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";
}

function App() {
  const ethereumHandler = useEthereumIframeHandler();
  const handlers = useMemo(() => [ethereumHandler], [ethereumHandler]);
  const { address, chain, isConnected } = useConnection();
  const { mutate: connect, isPending } = useConnect();
  const { mutate: disconnect } = useDisconnect();

  return (
    <main>
      <header>
        <div>
          <p className="eyebrow">ARBITRAGE CO-LEARNING</p>
          <h1>LI.FI 实时换币与跨链</h1>
          <p className="subtitle">查看实时路径，并通过自己的钱包逐笔确认交易。</p>
        </div>
        <button
          className="wallet-button"
          type="button"
          onClick={() => isConnected ? disconnect({}) : connect({ connector: injected() })}
          disabled={isPending}
        >
          {isPending ? "连接中…" : isConnected ? `${shortAddress(address)} · 断开` : "连接钱包"}
        </button>
      </header>

      <section className="content" aria-label="LI.FI 交易界面">
        <div className="notice" role="note">
          <strong>执行边界</strong>
          <span>报价会过期；请核对链、资产、最低到账、Gas 与路径。本站不托管密钥，也不会自动签名。</span>
          {chain && <span className="network">当前钱包：{chain.name}</span>}
        </div>
        <LiFiWidgetLight
          config={widgetConfig}
          handlers={handlers}
          autoResize
          className="widget"
          title="LI.FI 换币与跨链 Widget"
        />
      </section>
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
  </StrictMode>
);
