# 共学群重要分享

这里整理共学群中值得长期复用的项目、代码库和文章。每份记录都区分：

- 外部项目实际已经实现什么；
- README 宣称但当前代码尚未证明什么；
- 对本项目学习路线的启发；
- 是否适合直接复用。

## 分享索引

| 项目 | 类型 | 当前判断 | 记录 |
|---|---|---|---|
| [Gate CrossEx](./gate-crossex.md) | 本地多交易所交易终端 | 适合研究本地交易终端、安全边界和状态管理；不等于链上套利基础设施 | [阅读记录](./gate-crossex.md) |
| [MEV-Flashbot-Sandwich-RS](./mev-flashbot-sandwich-rs.md) | Rust mempool / MEV 原型 | 适合做代码审计和 MEV 入门反例；当前不具备 README 所描述的完整实盘能力 | [阅读记录](./mev-flashbot-sandwich-rs.md) |
| [LI.FI：从发现价差到执行与 Agent 集成](./lifi-arbitrage-agent-integration-2026-08-05.md) | 发起人使用分享 | 以真实只读 Quote 说明费用、执行边界、库存再平衡和 Agent 接入；当前项目仍保持只读与 Paper Trading | [阅读记录](./lifi-arbitrage-agent-integration-2026-08-05.md) |

## 统一审阅原则

1. 以当前代码、依赖和可复现实验为准，不把 README 的目标描述当成已完成能力。
2. 钱包、API Key、私钥和交易广播属于高风险边界；当前共学默认只读、模拟和 Paper Trading。
3. 外部仓库的许可证、凭据处理和运行方式必须先审阅，再考虑借鉴或引入。
4. 分享记录不是外部代码的副本；需要复用时，重新实现最小、可验证的本项目版本。

最后审阅：2026-08-05
