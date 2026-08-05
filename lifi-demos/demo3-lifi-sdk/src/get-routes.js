/**
 * Demo 3a: @lifi/sdk v4 —— 获取多条候选路由（getRoutes）
 * ======================================================
 * SDK 是未来"前端 Swap / 钱包 / 执行模块"的集成方式。
 * 本 demo 只做只读部分（getRoutes），不签名、不广播，可放心运行。
 *
 * 运行：
 *   npm install          # 首次安装依赖
 *   npm run routes
 *
 * 输出：同一笔跨链转账的全部候选路径（工具 + 到账 + 步骤数）
 */
import { createClient, getRoutes } from "@lifi/sdk";

// integrator 是 LI.FI 平台规范要求的集成方标识，务必改成自己的名字
const client = createClient({ integrator: "arbitrage-research" });

// 演示地址：仅用于报价（fromAddress 为必填项），不会发生真实交易
const DEMO_ADDRESS = "0x552008c0f6872d7aa9e46e4b5a8c4a8f8f8f8f8f";

// 0.1 ETH (Ethereum) -> USDC (Arbitrum)
const params = {
  fromChainId: 1,
  toChainId: 42161,
  fromTokenAddress: "0x0000000000000000000000000000000000000000",
  toTokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  fromAmount: "100000000000000000", // 0.1 ETH (wei)
  fromAddress: DEMO_ADDRESS,
};

const { routes } = await getRoutes(client, params);

console.log(`共 ${routes.length} 条候选路由，按推荐排序：\n`);
for (const [i, route] of routes.entries()) {
  const first = route.steps[0];
  console.log(
    `#${i + 1}  ${(first.tool ?? "?").padEnd(16)}` +
      ` toAmount=${route.toAmount.padStart(12)}` +
      `  min=${route.toAmountMin.padStart(12)}` +
      `  steps=${route.steps.length}`
  );
}

// 对比最优 / 最差到账
const sorted = [...routes].sort(
  (a, b) => (BigInt(b.toAmount) > BigInt(a.toAmount) ? 1 : -1)
);
const best = sorted[0];
const worst = sorted[sorted.length - 1];
const diffUsdc =
  (BigInt(best.toAmount) - BigInt(worst.toAmount)) / 1_000_000n;
console.log(
  `\n最优 ${best.steps[0].tool} toAmount=${best.toAmount}，` +
    `最差 ${worst.steps[0].tool} toAmount=${worst.toAmount}，` +
    `差距 ≈ ${diffUsdc} USDC`
);
