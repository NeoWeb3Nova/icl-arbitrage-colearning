# 阅读与参考清单

> 共学期间的阅读材料、论文、文章、代码库

---

## Bruce 推荐

- [发起公告: 我发起了链上套利残酷共学](https://x.com/brucexu_eth/status/2082831191376613391) (2026-07-30) — 发起人 Bruce Xu 的原始推文，阐述了共学的出发点、学习方式、LI.FI 和 Hermes 的使用思路、以及产出期望
- [为什么我在熊市发起链上套利残酷共学？顺便分享下我的学习大纲](https://x.com/brucexu_eth/status/2083935229757337948) (2026-08-02) — 最新三周路线、基础组件、Hermes 套利 Agent 目标、打卡与分享规则；项目整理见 [initiator-guidance-2026-08-02.md](./initiator-guidance-2026-08-02.md)
- [LI.FI 文档](https://docs.li.fi/introduction/introduction) — 跨链流动性聚合开发文档
- [LI.FI Builders 社区](https://t.me/lifibuilders) — 跨链开发者 Telegram 群
- [Hermes Agent 文档](https://hermes-agent.nousresearch.com/docs/) — AI 研究代理
- [GitHub: icl-agent](https://github.com/IntensiveCoLearning/icl-agent-b43d2e97-ed88-4ca3-b12f-7ef672b01205) — 共学 GitHub 仓库
- [发起人分享：从发现价差到执行：如何接入 LI.FI 实现跨链套利和 AI Agent 集成](https://x.com/brucexu_eth/status/2085022891339554855) (2026-08-05) — 真实只读 Quote、Break-even Spread、库存再平衡和 Agent/MCP 接入边界；项目整理见 [shares/lifi-arbitrage-agent-integration-2026-08-05.md](../shares/lifi-arbitrage-agent-integration-2026-08-05.md)

<!-- 发起人在共学过程中分享的其他资源 -->

## 社区推荐

<!-- LI.FI Builders Telegram 群中讨论的资源 -->

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
