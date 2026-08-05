# Module 2: 使用 LI.FI 发现路径与机会

> 日期：2026.08.09 – 08.12
> 目标：掌握 LI.FI 作为跨链流动性与路由发现工具
> 关联：[LI.FI 全面研究文档](../research/lifi-comprehensive-guide.md) | [SDK 使用建议](../research/lifi-sdk-decision.md) | [工具配置](../tools/lifi-setup.md)

---

## LI.FI 核心理解

<!-- LI.FI 是什么、解决了什么问题 -->

**LI.FI = 跨链流动性的路由与编排层。** 一个 API/SDK 聚合 69 条链、35 个桥、35 个 DEX 聚合器、Intent/Solver 网络与收益协议，统一返回 Quote / Route / 费用拆解。

> Bruce (发起人，LI.FI DevRel): "同一个资产从一条链转到另一条链，可能经过不同的桥、DEX 和中间资产。交易金额、网络状态和流动性一变，路由和最终报价也会跟着变。LI.FI 已经把很多跨链桥和 DEX 的路径聚合起来了。"

### 关键参考
- 文档: https://docs.li.fi/introduction/introduction
- 全面研究: [../research/lifi-comprehensive-guide.md](../research/lifi-comprehensive-guide.md)
- Builders 社区: https://t.me/lifibuilders

## 路由对比实践

### 对比维度
- 不同链之间的同一资产报价
- 不同资产对的路由差异
- 不同交易规模的滑点变化
- 不同桥方案的费率和确认时间

### 实际对比记录

**2026-08-05 实测：0.1 ETH（Ethereum）→ USDC（Arbitrum）**

| 方案 | 到账(toAmount) | 备注 |
|---|---|---|
| relaydepository | 185,743,888 | |
| near | 185,633,862 | |
| mayan | 185,562,676 | |
| across | 185,823,312 | |
| celercircle | 185,747,212 | |

> 同一笔转账 5 种桥方案到账各不相同（最高差约 $0.26），最优方案随时间/流动性变化——这就是路由漂移与机会研究的起点。

| 日期 | 资产 | 路径 | 金额 | 报价 | Gas | 桥接费 | 净收益 | 备注 |
|------|------|------|------|------|-----|--------|--------|------|
| 08-05 | ETH→USDC | across | 0.1 ETH | ≈$185.63 | $0.0053 | $0.019 | — | 含 LIFI Fee $0.47 |

> 完整费用拆解：LIFI Fixed Fee 0.25%、Relayer fee、Relayer gas、滑点 0.5%（默认）。持续采集记录见 `tools/lifi-quote-collector.py` 输出。

## 费用拆解框架

<!-- bridge, DEX fee, gas, slippage, routing 的变化如何影响机会 -->

```
预期净收益
= 到手价值（toAmount × 目标资产价格）
- 源资产投入（fromAmount × 源资产价格）
- LIFI Fee（默认 0.25%，集成方可分成）
- 桥费 / Relayer fee
- DEX 费（swap 步骤）
- Gas（源链 + 目标链）
- 滑点与价格冲击（默认 0.5%）
- 延迟损失（报价过期 / 跨链确认时间内的价格变动）
```

## LI.FI Builders 社区参与

<!-- Telegram 讨论记录、有价值的信息 -->

- Builders 群: https://t.me/lifibuilders

## 工具集成笔记

<!-- API 配置、常用查询、技巧 -->

- API Base: `https://li.quest/v1`
- 最小端点集: quote / status / chains / tokens / tools
- 只读采集脚本: `tools/lifi-quote-collector.py`
- Agent 集成（Hermes）: https://docs.li.fi/agents/overview
- MCP Server: `https://mcp.li.quest/mcp`

## 待探索问题

- [ ] 同一资产在不同链的 `priceUSD` 是否存在可捕捉价差
- [ ] 稳定币（USDC/USDC.e/wrapped）跨链 canonical 映射对报价的影响
- [ ] 路由如何随时间和流动性漂移（定时采集观测）
- [ ] `CHEAPEST` vs `FASTEST` 的收益-时间权衡
- [ ] 大额交易对滑点和价格冲击的影响（3 个金额档位对比）
