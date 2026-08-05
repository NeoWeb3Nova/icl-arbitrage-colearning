/**
 * Demo 3b: @lifi/sdk v4 —— 单条最优报价（getQuote）
 * ==================================================
 * getQuote 返回可直接签名的单步最优方案 + 完整费用拆解。
 * 只读，不签名、不广播。
 *
 * 运行：
 *   npm install
 *   npm run quote
 */
import { createClient, getQuote } from "@lifi/sdk";

const client = createClient({ integrator: "arbitrage-research" });

const DEMO_ADDRESS = "0x552008c0f6872d7aa9e46e4b5a8c4a8f8f8f8f8f";

const quote = await getQuote(client, {
  fromChain: 1,
  toChain: 42161,
  fromToken: "0x0000000000000000000000000000000000000000",
  toToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  fromAmount: "100000000000000000", // 0.1 ETH
  fromAddress: DEMO_ADDRESS,
});

const est = quote.estimate;
console.log(`最优方案工具: ${quote.tool} (${quote.toolDetails?.name})`);
console.log(`预计到手:     ${est.toAmount} (≈$${Number(est.toAmountUSD).toFixed(4)})`);
console.log(`最低到手:     ${est.toAmountMin}（滑点保护线）`);
console.log(`预计耗时:     ${est.executionDuration} 秒\n`);

console.log("费用拆解:");
for (const fee of est.feeCosts ?? []) {
  console.log(
    `  - ${fee.name.padEnd(20)} ${fee.amount} ${fee.token?.symbol}` +
      `  (≈$${Number(fee.amountUSD).toFixed(4)}, ${(Number(fee.percentage) * 100).toFixed(2)}%)`
  );
}
for (const gas of est.gasCosts ?? []) {
  console.log(
    `  - gas(${gas.type})        ${gas.amount} ${gas.token?.symbol}` +
      `  (≈$${Number(gas.amountUSD).toFixed(4)})`
  );
}
