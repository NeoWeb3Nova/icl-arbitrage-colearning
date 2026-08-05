# LI.FI SDK 使用建议（决策文档）

> 关联：[LI.FI 全面研究文档](./lifi-comprehensive-guide.md)
> 日期：2026-08-05
> 结论：**要使用 LI.FI SDK，但按使用场景选择集成方式**

---

## 一、核心结论

| 使用场景 | 集成方式 | 说明 |
|---|---|---|
| AI Agent / Hermes / 数据采集脚本 | **REST API**（`https://li.quest/v1`） | 官方推荐 Agent 直接用 API；只读报价无需 SDK |
| 前端 Swap / 桥接 UI、钱包 | **SDK**（`@lifi/sdk` v4） | 封装签名、执行、事件、Permit2 |
| 快速落地完整界面 | **Widget**（`@lifi/widget` v4） | 零代码嵌入 |
| MCP 宿主（Claude / Cursor / Windsurf） | **MCP Server**（`https://mcp.li.quest/mcp`） | 工具自动发现 |
| 命令行 / 脚本 / 省 token | **CLI**（`@lifi/cli`） | 人类可读、管道 JSON |

---

## 二、本项目当前阶段（第一周：数据采集）的选型

**推荐：REST API 为主 + CLI 辅助。**

理由：

1. 本阶段目标是**采集 Quote / Route / 费用拆解**，属于只读操作，`GET /quote` 已直接返回结构化 JSON。
2. SDK 的价值集中在**执行链路**（签名、广播、事件回调），本阶段明确"不执行交易"（见 `learning-plan.md`）。
3. 官方 Agent 指南（`/agents/overview`）的 5 个最小端点覆盖了我们的全部需求。
4. CLI 输出紧凑，适合 Hermes 在有限上下文里快速查看。

**本阶段不需要安装 SDK，但要在 `package.json` 里留好依赖位置，方便第二周"最小报价采集脚本"升级。**

---

## 三、未来阶段的 SDK 接入预案

### 什么时候升级到 SDK

- 第二周做 **Paper Trading / 模拟执行** 时，可用 SDK 的 `getQuote` + `getRoutes`（仍只读）。
- 第三周或后续做 **真实小额执行验证** 时，用 `executeRoute` 需要钱包签名，SDK 或直接构造交易均可。
- 如果 `NeoDeFi` / `opc-agent-treasury` 要落地跨链 Swap 能力 → 直接上 SDK + Widget。

### 升级清单

```bash
# 核心
npm install @lifi/sdk            # v4（2026-04 发布）
# 按需执行 provider
npm install @lifi/sdk-provider-ethereum   # EVM
npm install @lifi/sdk-provider-solana     # Solana
# 可选
npm install @lifi/widget                  # 前端 UI
npm install @lifi/cli                     # 命令行
```

```typescript
// 预留的最小接入骨架（v4）
import { createClient, getQuote, executeRoute } from "@lifi/sdk";

const client = createClient({ integrator: "arbitrage-research" });

const quote = await getQuote(client, {
  fromChainId: 1,
  toChainId: 42161,
  fromTokenAddress: "0x0000000000000000000000000000000000000000", // ETH
  toTokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",   // USDC(Arb)
  fromAmount: "100000000000000000",
  fromAddress: "0x...",
});

// 执行阶段（需钱包）：await executeRoute(quote, { updateRouteHook });
```

---

## 四、风险与注意

1. **API Key**：采集脚本接入后建议申请（200 req/2h 无 Key 限流较紧），Key 走环境变量，**不进仓库**。
2. **只读边界**：第一阶段绝不调用执行类接口，避免误触发签名/转账。
3. **版本**：SDK v4 已发布（2026-04），文档有 v2→v3、v3→v4 迁移指南，落地时以最新版为准。
4. **集成方标识**：`integrator` / `referrer` 字段必须填自己的名字（LI.FI 平台规范），方便后续在 Partner Portal 管理。

---

## 五、决策记录

| 日期 | 决策 | 状态 |
|---|---|---|
| 2026-08-05 | 第一阶段（数据采集）用 REST API，不装 SDK | ✔ 已定 |
| 2026-08-05 | 第二周 Paper Trading 评估是否引入 SDK 只读能力 | ⏳ 待定 |
| 2026-08-05 | 执行阶段（真实交易/NeoDeFi 集成）使用 @lifi/sdk v4 | 📌 预案 |
