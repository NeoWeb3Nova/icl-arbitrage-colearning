# LI.FI 工具配置

> 跨链流动性聚合与路由发现
> Bruce (发起人) 在 LI.FI 做 DevRel，共学中会重点用 LI.FI 学习跨链套利

---

## 基本信息

- 官网: https://li.fi/
- 文档: https://docs.li.fi/introduction/introduction
- llms.txt（机器可读全量索引）: https://docs.li.fi/llms.txt
- OpenAPI Spec: https://docs.li.fi/openapi.yaml
- API Base: https://li.quest/v1
- Builders 开发者社区: https://t.me/lifibuilders
- API Key: 可选环境变量 `LIFI_API_KEY`（申请入口 https://li.fi/，无 Key 限流 200 req/2h）

## 全面研究文档

> 2026-08-05 已完成 LI.FI 全面调研，见:
> - [LI.FI 全面研究文档](../research/lifi-comprehensive-guide.md) —— 产品矩阵、API/SDK、实测数据、项目结合点
> - [LI.FI SDK 使用建议](../research/lifi-sdk-decision.md) —— 是否用 SDK 的决策记录

## Bruce 的使用思路

<!-- 摘自发起人原文 -->

> "同一个资产从一条链转到另一条链，可能经过不同的桥、DEX 和中间资产。交易金额、网络状态和流动性一变，路由和最终报价也会跟着变。LI.FI 已经把很多跨链桥和 DEX 的路径聚合起来了。"

核心观察维度:
- 同一笔交易有哪些路线
- 费用分别是多少
- 为什么路由会变化
- 最终收到的资产为什么会不同

## API 常用端点

| 端点 | 用途 |
|---|---|
| `GET /v1/quote` | 最优报价（含可签名交易） |
| `POST /v1/advanced/routes` | 多条候选路由（路径对比） |
| `GET /v1/status` | 跨链交易状态 |
| `GET /v1/chains` | 支持的链（实测 69 条） |
| `GET /v1/tokens` | 支持的代币 |
| `GET /v1/tools` | 桥 + DEX（实测 35 桥 / 35 DEX） |

### 实测示例（2026-08-05）

```
GET https://li.quest/v1/quote?fromChain=1&toChain=42161
  &fromToken=0x0000000000000000000000000000000000000000  # ETH
  &toToken=0xaf88d065e77c8cC2239327C5EDb3A432268e5831    # USDC(Arb)
  &fromAmount=100000000000000000                          # 0.1 ETH
  &fromAddress=0x...

→ tool: across
→ toAmount: 185,855,947（≈$185.63）
→ 费用: LIFI Fee $0.47 + Relayer fee $0.019 + Relayer gas $0.005
→ 候选路由: across / relaydepository / celercircle / near / mayan（到账各不相同）
```

## 数据采集计划

Bruce 建议的采集维度:
- 不同时间的报价
- 不同链的报价
- 不同资产的报价
- 不同交易规模的报价

### 采集工具（已就绪）

```bash
# 最小只读报价采集脚本（含 Quote + 候选 Routes + 费用拆解）
python3 tools/lifi-quote-collector.py --amount 0.1 --output quotes.json
```

> 脚本原则：只读，不签名、不广播。输出标准化 JSON 供净收益模型使用。

## 常用查询模板

<!-- 复用的查询模式 -->

- Quote 采集: `GET /v1/quote`（参数见上）
- 路径对比: `POST /v1/advanced/routes`
- 定时采集建议: 固定资产对 × 多链 × 多金额，每小时记录一次原始响应

## SDK / 代码集成

**决策（2026-08-05）**：本阶段数据采集用 **REST API**（官方推荐 Agent/脚本直接用 API），不装 SDK；
第二周评估引入 SDK 只读能力；未来执行阶段（真实交易 / NeoDeFi 集成）使用 `@lifi/sdk` v4。
详见 [LI.FI SDK 使用建议](../research/lifi-sdk-decision.md)。

```bash
# 未来执行阶段依赖（预案）
npm install @lifi/sdk            # v4
npm install @lifi/sdk-provider-ethereum
```

## 与 Hermes Agent 的联动

- Hermes 直接调 REST API 的 5 个最小端点（quote/status/chains/tokens/tools）
- 官方 Agent 指南: https://docs.li.fi/agents/overview
- MCP Server: `https://mcp.li.quest/mcp`（Claude/Cursor 等宿主零配置接入）
- CLI: `@lifi/cli`（省 token，输出紧凑，适合 Agent 快速查看）
- LI.FI 能力已发布为 ClawdHub / skills.sh / Playbooks 上的 Agent Skills

## 限流与安全

- 无 API Key: 200 req / 2h；有 Key: 200 req / min
- 429 → 指数退避重试
- 非托管、多轮审计、$1M 漏洞赏金
- **Key 只放 `LIFI_API_KEY` 环境变量，不进仓库**；服务端脚本会自动使用，浏览器 Widget 不注入 Key
