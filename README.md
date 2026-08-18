# 链上套利残酷共学 ICL 2.0

> 21 天结构化共学项目 | 2026.08.05 – 2026.08.26
>
> 发起人: Bruce Xu ([@brucexu_eth](https://x.com/brucexu_eth), LI.FI DevRel) | 平台: [IntensiveCoLearning](https://intensivecolearn.ing/programs/b43d2e97-ed88-4ca3-b12f-7ef672b01205)
> 
> 发起原文: [X / Twitter](https://x.com/brucexu_eth/status/2082831191376613391)
> 最新说明: [为什么我在熊市发起链上套利残酷共学？顺便分享下我的学习大纲](https://x.com/brucexu_eth/status/2083935229757337948)（2026-08-02）
> Hermes 配置更新: [从零配置一个链上套利辅助和学习的 Hermes Agent](https://x.com/brucexu_eth/status/2084604766714261729)（2026-08-04）
> 第一性原理更新: [新手必读链上套利的第一性原理：从价差到可执行净利润](https://x.com/brucexu_eth/status/2086652810905751610)（2026-08-10）
> Obsidian 专栏: `D:\ObsidianWorkspace\Neo\链上套利残酷共学`（入口：`00-专栏首页.md`）

## 我的目标

1. **补上执行层认知**: 从"屏幕价差"到"可执行净利润"的完整链路，建立真实的成本建模能力
2. **Agent × 套利融合**: 探索链上套利作为 Agent 自主决策的试验场，把碎片认知变成可编程框架
3. **输出驱动输入**: 每天的发现、尝试、失败都记录在案，产生结构化的研究产出

## 最新方向

熊市阶段不以“立刻赚钱”为前提，而是先学清第一性原理、接好数据源、配置工具并建立可重复的评估流程。市场转热后，再针对新的资产、链、路径和策略快速微调验证。

最新三周路线：

1. **第一周**：套利地图、净收益模型、LI.FI API、The Graph、节点与 taoli.tools。
2. **第二周**：公开案例还原、数据脚本、Hermes 候选机会检查、回测与 Paper Trading。
3. **第三周**：筛选 2–5 个符合个人能力圈的方向，深挖 Edge，留下验证脚本或明确否定证据。

每日执行安排见 [21 天链上套利学习计划](./learning-plan.md)。完整方向整理见 [research/initiator-guidance-2026-08-02.md](./research/initiator-guidance-2026-08-02.md)；Hermes 配置更新见 [research/initiator-hermes-setup-2026-08-04.md](./research/initiator-hermes-setup-2026-08-04.md)；第一性原理、七步检查法与 14 类套利地图见 [research/initiator-arbitrage-first-principles-2026-08-10.md](./research/initiator-arbitrage-first-principles-2026-08-10.md)；人物、学习样本与工具资料见 [research/people-and-tools.md](./research/people-and-tools.md)；共学群重要代码库分享见 [shares/](./shares/)。现有 5 个模块继续保留，作为三周路线下的内部工作包。

在线工具：[LI.FI 实时换币与跨链 Widget](https://icl-arbitrage-lifi-widget.vercel.app)（EVM；所有交易均由用户钱包手动确认）。

## 项目结构

```
icl-arbitrage-colearning/
├── README.md                    ← 项目入口
├── learning-plan.md             ← 21 天每日执行路线
├── application.md               ← 报名动机
├── modules/                     ← 5 个模块的学习笔记
│   ├── 01-arbitrage-map.md
│   ├── 02-lifi-routing.md
│   ├── 03-hermes-signals.md
│   ├── 04-hypothesis-to-strategy.md
│   └── 05-execution-and-review.md
├── daily/                       ← 每日打卡记录
│   ├── template.md
│   ├── week1/                   ← 08.05–08.11
│   ├── week2/                   ← 08.12–08.18
│   └── week3/                   ← 08.19–08.26
├── research/                    ← 研究发现
│   ├── initiator-guidance-2026-08-02.md ← 发起者路线说明整理
│   ├── initiator-hermes-setup-2026-08-04.md ← Hermes 配置与学习 Prompt 更新
│   ├── initiator-arbitrage-first-principles-2026-08-10.md ← 第一性原理、检查法与套利地图
│   ├── lifi-comprehensive-guide.md ← LI.FI 全面研究文档（产品矩阵/API/SDK/实测）
│   ├── lifi-sdk-decision.md       ← LI.FI SDK 使用建议与决策记录
│   ├── people-and-tools.md         ← 学习榜样、证据边界与工具地图
│   ├── opportunities.md         ← 发现的机会结构
│   ├── papers-and-reading.md    ← 阅读清单
│   └── signals/                 ← 信号观测记录
├── shares/                      ← 共学群重要分享整理
│   ├── README.md
│   ├── gate-crossex.md
│   └── mev-flashbot-sandwich-rs.md
├── strategies/                  ← 策略实验
│   ├── hypotheses.md            ← 策略假设日志
│   ├── simulator/               ← 回测/模拟代码
│   └── trades-log.md            ← 交易记录
├── lifi-demos/                  ← LI.FI 新手快速上手 demo（4 个）
│   ├── README.md                  ← 新手快速教程（入口）
│   ├── demo1-basic-api/           ← REST API 五大端点入门（Python）
│   ├── demo2-quote-routes/        ← 报价与路由对比 + 费用拆解（Python）
│   ├── demo3-lifi-sdk/            ← @lifi/sdk v4 路由生命周期（Node）
│   └── demo4-lifi-widget/         ← Widget 快速嵌入（React）
├── tools/                       ← 工具配置
│   ├── lifi-setup.md
│   ├── lifi-quote-collector.py    ← LI.FI 只读报价/路由采集脚本
│   └── hermes-setup.md
└── outputs/                     ← 最终产出
    ├── knowledge-graph.md       ← 个人知识图谱
    └── final-retrospective.md   ← 复盘总结
```

## 关键日期

| 里程碑 | 日期 |
|--------|------|
| 报名 | 2026.07.30 |
| 报名截止 | 2026.08.04 |
| 共学开始 | 2026.08.05 |
| 第一周：基础地图与组件 | 08.05–08.11 |
| 第二周：工具、案例与 Agent | 08.12–08.18 |
| 第三周：个人 Edge 深挖 | 08.19–08.26 |
| 每周分享 | 周五 19:00–20:00（暂定，以群/邮件为准） |
| 共学结束 | 2026.08.26 |

## 5 个内部工作模块

1. **建立链上套利地图** — DEX 内/间、跨链、三角、稳定币、清算、MEV 机会结构全景
2. **使用 LI.FI 发现路径与机会** — 跨链流动性聚合、路由对比、报价分析
3. **用 Hermes Agent 构建研究与信号工作流** — 从一次性观察到可重复的信号系统
4. **从假设走向策略** — 成本建模、历史数据验证、模拟交易
5. **捕获、实施与复盘** — 信号甄别、执行决策、盈亏复盘

## 核心工具

- **LI.FI** — 跨链流动性聚合
  - 官网: https://li.fi/
  - 文档: https://docs.li.fi/introduction/introduction
  - Builders 社区: https://t.me/lifibuilders
- **Hermes Agent** — AI 研究代理
  - 文档: https://hermes-agent.nousresearch.com/docs/
  - 中文社区: [@hermescn_org](https://x.com/@hermescn_org)
- **GitHub**: https://github.com/IntensiveCoLearning/icl-agent-b43d2e97-ed88-4ca3-b12f-7ef672b01205
- **微信**: brucexu-eth（报名后加群）

## Bruce 的核心理念

<!-- 摘自发起人原文 -->

> "最重要的就是把套利第一性原理搞清楚，形成一个框架，之后可以逐步地去完善和尝试。"

> "共学结束时能留下什么，因人而异。可能是一份链上套利知识地图，一组持续采集的数据，一个监控脚本，一套策略假设，或者一个最小原型。哪怕最后证明某条路走不通，只要过程和原因记录清楚，也比继续收藏文章、一直没有开始强。"

> "这次我会让 Hermes 跟着整个学习过程一起工作……希望到时候也能产出一个链上套利专属的 Skills，可以方便快速检查机会和实施。"

## 打卡规则

- 每周可请假 2 次
- 长期无行动或无效打卡者将被移出共学群

## 关联项目

- [[NeoDeFi]] — 链上资管协议
- [[opc-agent-treasury]] — AI Agent 财务系统
- [[Web4自媒体创作/你的Web4自媒体定位方案 V1]] — 个人研究方向

---

*Created: 2026-07-30 | 报名动机见 [application.md](./application.md)*
