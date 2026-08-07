# LI.FI：从发现价差到执行与 Agent 集成

> 来源：Bruce Xu（@brucexu_eth）于 2026-08-05 发布的分享
> 原文：[X / 2085022891339554855](https://x.com/brucexu_eth/status/2085022891339554855)
> 对应 Obsidian clipping：`套利共学｜从发现价差到执行：如何接入 LI.FI 实现跨链套利和 AI Agent 集成.md`

## 一句话结论

LI.FI 是跨链套利的执行基础设施，不是套利策略本身。策略系统先判断机会和净收益，LI.FI 再负责 Route、费用、交易构造和跨链状态跟踪。

## 分享中的真实只读报价

场景：Ethereum USDC → Arbitrum 原生 USDC，输入 1,000 USDC，滑点 0.5%，使用公开占位地址；只获取未签名交易，没有广播。

- Route 工具：Eco
- 预计到账：997.5 USDC
- 最低到账：997.5 USDC
- LI.FI Service Fee：2.5 USDC（0.25%，25 bps）
- Ethereum Gas：约 0.2456 美元
- 预计执行时间：约 7 秒
- `transactionRequest`：已返回未签名交易数据
- 显性执行成本：约 2.7455 美元，约 27.455 bps

这只是指定金额、资产、时间和 Route 的一次 Quote，不能外推到其他规模或时点。套利机会必须继续扣除目标市场成交滑点、Price Impact、延迟、资金占用和失败成本。

## 对本项目的关键启发

1. **Break-even Spread 先于执行**：
   ```text
   最低所需价差 = LI.FI Service Fee
                + Bridge / DEX / Solver Fee
                + 源链与目标链 Gas
                + 两端交易滑点与 Price Impact
                + 延迟、失败与资金占用成本
   ```
2. **发现机会与跨链调仓要分开**：普通跨链流程可能不是原子执行，机会到资产抵达时可能已经消失。更可行的方向是多链预置资金，抓机会后再用 LI.FI 做库存再平衡。
3. **Quote 是执行前证据**：重点记录 `toAmount`、`toAmountMin`、`feeCosts`、`gasCosts`、`executionDuration`、`tool`、`includedSteps` 和 `transactionRequest`。
4. **Token 身份必须先校验**：链、Token 地址、decimals、USDC 与 USDC.e 等版本错误，会让价格比较失真。
5. **Agent 接入优先只读**：MCP、CLI、Agent Skills 或 REST API 可用于 Token 查询、Quote、Route 比较、成本计算和 Status 跟踪；Approve、签名、广播和扩大仓位必须留在隔离的钱包执行层，并设置金额、滑点、资产与 Bridge allowlist 及人工审批。
6. **调用治理是执行前置条件**：缓存变化慢的 `/chains`、`/tokens`、`/tools`，对扫描请求做 debounce/batch，记录限流响应，收到 429 后按 reset 时间退避，不用多 Key 或多 IP 绕过限制。

## 本项目落地边界

- 当前继续使用 REST API 做只读报价、Route 对比和 Paper Trading。
- 当前不接入自动签名、自动广播或真实资金执行。
- 当前套利判断必须把 LI.FI 费用与两腿交易成本纳入净收益模型。
- 后续若接入 Hermes MCP，先验证只读工具和输出，再讨论隔离钱包执行层；不因这篇分享新增执行依赖。

## 建议实验

1. 确认 Ethereum、Arbitrum 及两边 USDC 的地址和 decimals。
2. 获取 `/quote`，记录到账、最低到账、费用、Gas、耗时和工具。
3. 获取 `/advanced/routes`，比较候选 Route。
4. 与目标 DEX/CEX 的真实可成交价格和深度对照。
5. 输出“可执行 / 不可执行”及主要瓶颈：Fee、Gas、Slippage、Liquidity 或 Latency。
6. 第一轮保持只读、模拟、不签名、不广播。

## 与现有项目资料的关系

- [LI.FI 工具配置](../tools/lifi-setup.md)
- [LI.FI 全面研究文档](../research/lifi-comprehensive-guide.md)
- [LI.FI 路由模块](../modules/02-lifi-routing.md)
- [虚拟套利验证](../daily/2026-08-05.md)
