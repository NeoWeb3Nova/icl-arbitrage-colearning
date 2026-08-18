# 阅读与参考清单

> 共学期间的阅读材料、论文、文章、代码库

---

## Bruce 推荐

- [发起公告: 我发起了链上套利残酷共学](https://x.com/brucexu_eth/status/2082831191376613391) (2026-07-30) — 发起人 Bruce Xu 的原始推文，阐述了共学的出发点、学习方式、LI.FI 和 Hermes 的使用思路、以及产出期望
- [为什么我在熊市发起链上套利残酷共学？顺便分享下我的学习大纲](https://x.com/brucexu_eth/status/2083935229757337948) (2026-08-02) — 最新三周路线、基础组件、Hermes 套利 Agent 目标、打卡与分享规则；项目整理见 [initiator-guidance-2026-08-02.md](./initiator-guidance-2026-08-02.md)
- [新手必读链上套利的第一性原理：从价差到可执行净利润](https://x.com/brucexu_eth/status/2086652810905751610) (2026-08-10) — 从可比较经济价值、资产闭环和全成本期望净利润出发，给出七步检查法及 14 类套利地图；项目整理见 [initiator-arbitrage-first-principles-2026-08-10.md](./initiator-arbitrage-first-principles-2026-08-10.md)
- [LI.FI 文档](https://docs.li.fi/introduction/introduction) — 跨链流动性聚合开发文档
- [LI.FI Builders 社区](https://t.me/lifibuilders) — 跨链开发者 Telegram 群
- [Hermes Agent 文档](https://hermes-agent.nousresearch.com/docs/) — AI 研究代理
- [GitHub: icl-agent](https://github.com/IntensiveCoLearning/icl-agent-b43d2e97-ed88-4ca3-b12f-7ef672b01205) — 共学 GitHub 仓库
- [发起人分享：从发现价差到执行：如何接入 LI.FI 实现跨链套利和 AI Agent 集成](https://x.com/brucexu_eth/status/2085022891339554855) (2026-08-05) — 真实只读 Quote、Break-even Spread、库存再平衡和 Agent/MCP 接入边界；项目整理见 [shares/lifi-arbitrage-agent-integration-2026-08-05.md](../shares/lifi-arbitrage-agent-integration-2026-08-05.md)

<!-- 发起人在共学过程中分享的其他资源 -->

## 社区推荐

- [Morpho MetaMorpho × sNUSD 金库 NAV 操纵案例](./morpho-metamorpho-snusd-nav-manipulation-case-2026-08-14.md)（2026-08-14）— 社群成员“梦”分享的 Ethereum 主网交易；已按事件与精确现金流还原为 vault donation / NAV manipulation 案例，当前为研究材料，不代表已掌握或本人交易
- [X Article 草稿：Morpho × MetaMorpho × sNUSD 闪电贷案例](../shares/morpho-snusd-flashloan-case-20260815.md)（2026-08-15）— 基于研究稿和今日费曼问答整理；保留交易、协议状态、头寸、坏账与规模化边界，不代表本人交易或当前可执行机会

## 自行发现

<!-- 自己研究过程中找到的有价值资源 -->

## 论文

| 标题 | 作者/来源 | 关键结论 | 与我研究的关联 |
|------|-----------|----------|----------------|
| | | | |

## 代码库

| 项目 | GitHub | 用途 | 学习要点 |
|------|--------|------|----------|
| Gate CrossEx | [your-quantguy/gate-crossex](https://github.com/your-quantguy/gate-crossex) | 本地多交易所交易终端 | 凭据隔离、交易锁、状态恢复；不是链上套利执行器，许可证为 AGPL-3.0-only。详见 [shares/gate-crossex.md](../shares/gate-crossex.md) |
| MEV-Flashbot-Sandwich-RS | [theoweb3/mev-flashbot-sandwich-rs](https://github.com/theoweb3/mev-flashbot-sandwich-rs) | Rust mempool / MEV 原型 | 观察 pending tx 不等于可执行套利；当前策略和 Flashbots 发送模块为空，存在凭据卫生问题。详见 [shares/mev-flashbot-sandwich-rs.md](../shares/mev-flashbot-sandwich-rs.md) |
