# LI.FI 全面研究文档

> 主题：以 LI.FI 作为本项目（链上套利残酷共学 / arbitrage-research）的跨链流动性基础设施
> 调研日期：2026-08-05
> 状态：✔ 已完成官网、官方文档（llms.txt 全量索引）、REST API 实测
> 结论速览：**建议同时使用 LI.FI REST API 与 LI.FI SDK（@lifi/sdk v4）**，二者职责不同，详见文末《SDK 使用建议》。

---

## 1. LI.FI 是什么

> LI.FI is the routing and execution layer that connects any application to all on-chain liquidity across chains, bridges, DEXs, solvers, and yield protocols through a single integration.

LI.FI（官网 https://li.fi/，文档 https://docs.li.fi/）是**跨链流动性的路由与编排层（routing & orchestration layer）**。它把分散在数十条链、几十个桥、几十个 DEX 聚合器、Intent/Solver 网络、收益协议背后的流动性统一到**一个 API / 一个 SDK** 之后：

- **同链 Swap**（DEX 聚合）
- **跨链 Swap 与桥接**（桥聚合 + 路径优化）
- **跨链合约调用**（目标链上任意合约调用）
- **多步交易流**（bridge → swap → zap → deposit）
- **Perps / 订单簿交易**
- **一键进入收益机会**（Earn + Composer）

**一句话定位**：它是"链上流动性领域的 Stripe"——集成方不需要逐个对接桥和 DEX，一次集成覆盖所有链、所有资产、所有流动性源。

---

## 2. 它解决了什么问题

| 痛点 | 没有 LI.FI | 有 LI.FI |
|---|---|---|
| 跨链支付 | 手工桥接，复杂易错 | 一个统一支付流 |
| 代币标准不一致 | USDC / USDC.e / 包装资产经常交易失败 | canonical 映射处理包装变体 |
| 维护多套 API | 需要维护几十个桥和 DEX 集成 | 统一 API / SDK |
| 跨链失败 | 自己处理失败与退款 | 内置 fallback 路由 |
| 新链接入 | 每条链重新集成 | LI.FI 持续扩展，集成方零成本跟随 |

**对本项目的核心价值**：套利研究的第一步是"看到完整路径与报价"。LI.FI 把同一笔跨链转账的所有可行路径（桥 + DEX + 中间资产）聚合出来，并返回费用拆解（Gas、桥费、LI.FI 费、Relayer 费、滑点）——这正是本共学项目 `modules/02-lifi-routing.md` 和净收益模型需要的输入。

---

## 3. 产品矩阵全景

| 产品 | 形态 | 适用场景 | 说明 |
|---|---|---|---|
| **LI.FI API** | REST，Base URL `https://li.quest` | 后端 / Agent 直接调用 | 最核心，无需依赖 |
| **LI.FI SDK** | `@lifi/sdk`（JS/TS，v4，2026-04） | 前端 / 后端业务集成 | 完整路由生命周期：request → quote → execute → track |
| **LI.FI Widget** | `@lifi/widget`（v4） | 快速嵌入换币/桥接 UI | 无需写代码 |
| **LI.FI Composer** | API/SDK/Widget 内能力 | 一键 DeFi 存款/质押/借贷 | 20+ 协议、20+ EVM 链 |
| **LI.FI Earn** | Data API `https://earn.li.fi` | 收益机会发现 + 组合 | Aave、Morpho、Euler、Pendle 等 |
| **LI.FI Intents** | 订单服务器 `https://order.li.fi` | Intent 执行 / Solver 市场 | 开放意图框架（OIF）基金会成员 |
| **LI.FI MCP Server** | `https://mcp.li.quest/mcp` | AI Agent（Claude/Cursor/Windsurf） | 零配置工具发现 |
| **LI.FI CLI** | `@lifi/cli` | 脚本 / Agent 节省 token | 输出人类可读表格，管道时 JSON |
| **Partner Portal** | 网页 | 集成方收费管理 | 手续费分成、提现 |

---

## 4. 支持范围（实测确认）

### 链（69+，实测 `/v1/chains` 返回 69 条）

- **EVM**：Ethereum、Arbitrum、Arbitrum Nova、Optimism、Base、Polygon、Avalanche、BSC、Fantom、Gnosis、zkSync Era、Polygon zkEVM、Linea、Scroll、Mantle、Mode、Blast、Celo 等
- **新链**（实测可见）：Robinhood Chain、Hyperliquid（HPL）、HyperEVM、Monad 等
- **非 EVM**：Solana（SPL）、Bitcoin（原生 BTC）、SUI、TRON
- **测试网**：Sepolia、Base Sepolia、Arbitrum Sepolia

### 桥（实测 `/v1/tools` 返回 35 个）

Stargate、Across、Hop、Celer cBridge、Connext、Synapse、Allbridge、Wormhole、LayerZero、Axelar、deBridge、Symbiosis、Router、Orbiter、Relay、Mayan v2、NEAR Intents 等

### DEX / 聚合器（实测 35 个）

1inch、0x、Paraswap、KyberSwap、OpenOcean、DODO、Odos、Bitget、OKX、Jupiter(Solana)、Enso 等

### Solvers（Intents）

LI.FI Solver、Enso、Propeller Heads、Bungee 等

---

## 5. 架构原理

```text
dApp / Wallet / Agent
        ↓ 调用
   LI.FI API（离链智能路由 + 聚合）
        ↓
   LI.FI Diamond 合约（EIP-2535 钻石模式，链上入口）
        ↓ 分派到 Facet
   Bridge / DEX / Solver 合约（最终执行）
```

- **Diamond 模式**：可升级、模块化；每个桥/DEX 集成一个 Facet
- **Executor**：处理复杂多步交易
- **Receiver**：管理跨链入账
- **Composer onchain VM**：EVM 上执行组合式操作
- **非托管**：用户始终掌控资金；智能合约开源、多轮独立审计、$1M 漏洞赏金

### 关键概念：Quote vs Route vs Step

| 对象 | 定义 | 用途 |
|---|---|---|
| **Quote** | 单步最优方案 + 可直接签名的 `transactionRequest` | 简单转账直接用 `/v1/quote` |
| **Route** | 多步路径方案（返回数组） | 需要对比备选时用 `/v1/advanced/routes` |
| **Step** | Route 中的单个原子操作（swap/cross/lifi/protocol） | 每步可能需要单独一笔交易 |
| **Action** | Step 内的具体操作类型 | — |

---

## 6. 核心 API（5 个最小端点集，Agent 可直接用）

Base URL: `https://li.quest/v1`

| # | 端点 | 用途 |
|---|---|---|
| 1 | `GET /quote` | 获取最优报价（含可签名交易） |
| 2 | `GET /status` | 查询跨链交易状态 |
| 3 | `GET /chains` | 列出支持的链 |
| 4 | `GET /tokens` | 列出支持的代币 |
| 5 | `GET /tools` | 列出桥和 DEX |

### 实测示例（2026-08-05）

**Quote：主网 ETH 0.1 → Arbitrum USDC**

```text
GET https://li.quest/v1/quote
  ?fromChain=1&toChain=42161
  &fromToken=0x0000000000000000000000000000000000000000
  &toToken=0xaf88d065e77c8cC2239327C5EDb3A432268e5831
  &fromAmount=100000000000000000
  &fromAddress=0x...

→ tool: across（AcrossV4）
→ 预计到手: 185,855,947 USDC(6位小数) ≈ $185.63
→ 最低到手(toAmountMin): 184,926,668
→ 费用拆解:
    LIFI Fixed Fee:    0.00025 ETH ≈ $0.4657（0.25% 中的 0.025%?）
    Relayer fee:       0.0185 USDC
    Relayer gas fee:   (略)
→ slippage: 0.005
```

**Advanced Routes：同参数返回 8 条候选路由**，top3 工具分别为 `across`、`relaydepository`、`celercircle`——**同一笔转账存在多种桥方案，到账数量不同**，这正是跨链套利/路径优化的素材。

---

## 7. LI.FI SDK（@lifi/sdk v4）

### 为什么需要 SDK

- 前端/后端业务集成时，SDK 封装了**完整路由生命周期**（request → quote → execute → track）
- **事件钩子**：执行过程实时回调
- **多 VM 支持**：EVM(Solana/Bitcoin/SUI/TRON 需装 provider 包)
- **标准支持**：EIP-7702、EIP-5792、ERC-2612、EIP-712、Permit2
- 底层基于 Viem、Wallet Standard、Bigmi
- 可配置 RPC、allow/deny 链/代币/桥/DEX/Solver 列表
- 支持目标链任意合约调用；Composer 开箱即用

### 安装

```bash
npm install @lifi/sdk
# 按需安装执行所需 provider
npm install @lifi/sdk-provider-ethereum   # EVM（viem）
npm install @lifi/sdk-provider-solana     # Solana
npm install @lifi/sdk-provider-bitcoin    # Bitcoin（bigmi）
npm install @lifi/sdk-provider-sui        # Sui
npm install @lifi/sdk-provider-tron       # Tron
```

### 快速开始

```typescript
import { createClient, getRoutes, getQuote, executeRoute } from "@lifi/sdk";

const client = createClient({ integrator: "arbitrage-research" });

// 获取多条路由
const { routes } = await getRoutes(client, {
  fromChainId: 42161,                                     // Arbitrum
  toChainId: 10,                                          // Optimism
  fromTokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // USDC
  toTokenAddress: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",   // DAI
  fromAmount: "10000000",                                 // 10 USDC
});

// 或直接拿单条最优 Quote
const quote = await getQuote(client, {
  fromChainId: 1,
  toChainId: 42161,
  fromTokenAddress: "0x0000000000000000000000000000000000000000",
  toTokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  fromAmount: "100000000000000000",
  fromAddress: "0x...",
});

// 执行（需要钱包签名）
await executeRoute(quote, { updateRouteHook: (route) => console.log(route) });
```

### API vs SDK vs MCP vs CLI 选择矩阵

| 场景 | 推荐 | 理由 |
|---|---|---|
| AI Agent 集成（本项目 Hermes） | **REST API**（或 MCP） | 无依赖、HTTP 直连；官方明确建议 Agent 用 API 而非 SDK |
| 前端 Swap UI / 钱包 | **SDK** | 封装钱包、签名、执行、事件 |
| 快速嵌入完整 UI | **Widget** | 零代码 |
| MCP 兼容宿主（Claude/Cursor） | **MCP Server** | 工具自动发现 |
| 脚本 / 命令行 / 省 token | **CLI** | 人类可读、输出紧凑 |

---

## 8. LI.FI × 本项目的结合点

### 8.1 套利研究数据层（P0，立即做）

对照 `modules/02-lifi-routing.md` 与 `research/people-and-tools.md` 的采集计划：

1. **固定参数采集 Quote / Routes**：固定源资产/目标资产，2 条源链 × 2 条目标链 × 3 个金额档位，保存原始响应 + 标准化成本字段
2. **比较 `CHEAPEST` vs `FASTEST`**：研究收益与时间风险的交换
3. **路径多样性记录**：同一笔转账的多个桥方案（across / relaydepository / celercircle…）及其到账差异
4. **费用拆解入库**：LIFI Fee、Relayer fee、Relayer gas、桥费、DEX 费、滑点、Gas——喂给净收益模型
5. **不执行交易**：第一阶段只读，采集报价不做签名广播

### 8.2 跨链套利机会发现

- 同一资产在不同链的价格差 → LI.FI 报价里的 `priceUSD` 与到账数量可交叉核对
- 稳定币跨链价差（USDC/USDC.e/wrapped）→ LI.FI canonical 映射 + 桥方案对比
- 路由随市场变化 → 定时采集 `/v1/quote` 观察路径漂移

### 8.3 Agent 工作流（Hermes 联动）

- Hermes 通过 REST API（或 MCP Server）获取 quote/routes/status
- 官方已有 **Agents 专区**：`/agents/overview`，5 个端点 + 决策表 + 错误 playbook
- LI.FI 能力还发布为 ClawdHub / skills.sh / Playbooks 上的预置 Agent Skills

### 8.4 后续阶段（收益/执行）

- **Earn API**：`https://earn.li.fi/v1/vaults?chainId=8453&asset=USDC&sortBy=apy` 发现收益机会
- **Composer**：一键存款/质押/借贷
- **Intents**：如果未来走"意图式执行"，`https://order.li.fi` 提供订单服务器 + Solver 网络

---

## 9. 限流与安全

### 限流

| 档位 | 限制 |
|---|---|
| 无 API Key | 200 请求 / 2 小时 |
| 有 API Key | 200 请求 / 分钟 |

- 适用于 API、MCP Server、CLI
- Key 申请：https://li.fi/
- 429 处理：指数退避重试

### 安全

- 多轮独立审计（Diamond、Facets、Composer onchain VM）
- $1,000,000 漏洞赏金
- 实时合约监控
- **非托管**：资金始终在用户钱包
- 官方对集成方提供 Hypernative 代币风险筛查

---

## 10. 关键链接速查

| 用途 | 链接 |
|---|---|
| 官网 | https://li.fi/ |
| 文档 | https://docs.li.fi/ |
| llms.txt（机器可读索引） | https://docs.li.fi/llms.txt |
| OpenAPI Spec | https://docs.li.fi/openapi.yaml |
| API 参考 | https://docs.li.fi/api-reference/introduction |
| SDK | https://docs.li.fi/sdk/overview |
| Widget | https://docs.li.fi/widget/overview |
| Composer | https://docs.li.fi/composer/overview |
| Earn | https://docs.li.fi/earn/overview |
| Intents | https://docs.li.fi/lifi-intents/introduction |
| Agent 集成 | https://docs.li.fi/agents/overview |
| MCP Server | https://docs.li.fi/mcp-server/overview |
| CLI | https://docs.li.fi/cli/overview |
| API Base | https://li.quest/v1 |
| Widget Playground | https://playground.li.fi |
| Transaction Explorer | https://explorer.li.fi |
| Builders 社区 | https://t.me/lifibuilders |
| GitHub (lifi-mcp) | https://github.com/lifinance/lifi-mcp |
| GitHub (lifi-cli) | https://github.com/lifinance/lifi-cli |

---

## 11. 结论：是否使用 LI.FI SDK？

**结论：要使用，但分场景。**

1. **AI Agent / 数据采集（本项目的 Hermes、脚本）** → **用 REST API**，不用 SDK。
   - 官方明确建议：*"For AI agent integrations, use the REST API directly rather than the SDK."*
   - 理由：无依赖、HTTP 直连、省 token；只读报价采集根本不需要 SDK 的执行能力。

2. **未来做前端 UI / 钱包 / 执行模块（NeoDeFi、opc-agent-treasury 落地）** → **用 SDK（@lifi/sdk v4）**。
   - SDK 封装签名、执行、事件跟踪、Permit2、多 VM provider，是前端集成的标准姿势。
   - 配合 `@lifi/widget` 可快速出一个可用界面。

3. **Hermes / Claude 等 MCP 宿主** → 可选 **MCP Server**（`https://mcp.li.quest/mcp`），工具自动发现，几乎零配置。

**所以：REST API 是数据层的骨架，SDK 是未来执行层的肌肉。两套都要掌握，当前阶段以 REST API 为主。**

---

*来源：LI.FI 官网、docs.li.fi 全量文档（llms.txt）、REST API 实测（2026-08-05）。*
