/**
 * Demo 3c: @lifi/sdk v4 —— 执行路由（executeRoute）
 * ==================================================
 * ⚠️ 本 demo 是【执行链路】的代码骨架，展示 executeRoute 的标准写法，
 * 但默认不真正执行（DEMO_EXECUTE = false）。
 *
 * 如果未来要做真实交易：
 *   1. 安装 EVM provider：npm install @lifi/sdk-provider-ethereum
 *   2. 配置钱包（viem 的 walletClient / 私钥 / EIP-1193 provider）
 *   3. 把 DEMO_EXECUTE 改为 true，并填入你自己的钱包
 *
 * 运行（只读检查，不会广播）：
 *   npm install
 *   npm run execute
 */
import { createClient, getQuote, executeRoute } from "@lifi/sdk";

// 默认不执行！只打印"如果执行会怎么走"
const DEMO_EXECUTE = false;

const client = createClient({
  integrator: "arbitrage-research",
  apiKey: process.env.LIFI_API_KEY,
});

const DEMO_ADDRESS = "0x552008c0f6872d7aa9e46e4b5a8c4a8f8f8f8f8f";

const quote = await getQuote(client, {
  fromChain: 1,
  toChain: 42161,
  fromToken: "0x0000000000000000000000000000000000000000",
  toToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  fromAmount: "100000000000000000", // 0.1 ETH
  fromAddress: DEMO_ADDRESS,
});

console.log(`获取到可执行报价: ${quote.tool} -> ${quote.estimate.toAmount}\n`);
console.log("执行链路（executeRoute）标准流程:");
console.log("  1. 安装 provider:  npm install @lifi/sdk-provider-ethereum");
console.log("  2. 配置钱包:       viem walletClient / 私钥 / EIP-1193 provider");
console.log("  3. 调用 executeRoute(quote, { updateRouteHook })");
console.log("  4. 监听 updateRouteHook 实时获取执行进度（待签名/已广播/已完成）");
console.log("  5. 用 getStatus(routeId) 或 /v1/status 查询跨链最终状态");

if (DEMO_EXECUTE) {
  // 真实验证请先完成 provider + 钱包配置，否则这里会因缺少签名器报错
  console.log("\n⚠️ 已开启 DEMO_EXECUTE，尝试执行……");
  await executeRoute(quote, {
    updateRouteHook: (route) => console.log("进度:", route.status),
  });
} else {
  console.log("\n✅ DEMO_EXECUTE=false，本次只做流程演示，未广播任何交易。");
}
