/**
 * Demo 4: @lifi/widget v4 快速嵌入
 * ================================
 * 零代码嵌入一个完整的换币 / 跨链桥接 UI。
 *
 * 运行：
 *   npm install
 *   npm run dev          # 打开 http://localhost:5173
 *
 * config 里可以预设：
 *   - integrator:  你的集成方标识（LI.FI 平台规范，务必改成自己的）
 *   - fromChain / toChain: 默认源/目标链
 *   - fromToken / toToken: 默认代币
 *   - theme: 主题色
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LiFiWidget } from "@lifi/widget";

const widgetConfig = {
  integrator: "arbitrage-research",
  fromChain: 1, // Ethereum
  toChain: 42161, // Arbitrum
  fromToken: "0x0000000000000000000000000000000000000000", // ETH
  toToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // USDC (Arbitrum)
  theme: {
    palette: {
      primary: { main: "#5C86FF" },
      secondary: { main: "#5C86FF" },
    },
    shape: { borderRadius: 12, borderRadiusSecondary: 8 },
  },
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 24 }}>
      <h2>⚡ LI.FI Widget 快速 Demo</h2>
      <p style={{ color: "#666", fontSize: 14 }}>
        同一界面支持同链 Swap 与跨链桥接，聚合 69 条链、35 个桥、35 个 DEX。
      </p>
      <LiFiWidget config={widgetConfig} />
    </div>
  </StrictMode>
);
