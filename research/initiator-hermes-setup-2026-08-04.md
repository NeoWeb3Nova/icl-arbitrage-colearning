---
title: 发起人 Hermes Agent 配置与学习 Prompt 整理
source: https://x.com/brucexu_eth/status/2084604766714261729
published: 2026-08-04
updated: 2026-08-05
status: source-reconciled
---

# 发起人 Hermes Agent 配置与学习 Prompt 整理

> 原始剪藏：`D:\ObsidianWorkspace\Neo\LLM-Wiki\raw\clippings\套利共学｜从零配置一个链上套利辅助和学习的 Hermes Agent：我的 Setup、硬件、模型和学习 Prompt.md`
>
> 本文整理发起人新文章对本项目的影响；硬件、模型、主机商和收益描述均是发起人的个人经验，不等于本项目验证结论或推荐。

## 1. 采用顺序

| 阶段 | 推荐动作 | 本项目边界 |
|---|---|---|
| 体验 | 先在本地电脑跑通 Hermes | 不先购买服务器，不先接资金 |
| 学习 | 接入一个消息入口，按主题分线程 | 学习、策略研究、数据回测、开发、打卡分开 |
| 验证 | 用 Agent 查资料、写最小脚本、做回测与 Paper Trading | 结果必须记录数据、时间、成本和失败原因 |
| 扩展 | 有持续需求后再迁移 VPS/裸金属、数据库或节点 | 先验证工作流，再扩容基础设施 |

## 2. Hermes 在套利共学中的角色

1. 研究助手：读取资料、解释 DEX、Bridge、流动性、Gas、滑点、MEV 和合约概念。
2. 数据引擎：调用 API/RPC，采集报价、Gas、滑点和路径变化。
3. 策略加速器：生成最小验证脚本、回测脚本、监控流程和可复用 Skill。
4. 记忆层：把策略假设、回测结果和“为什么不成立”保存到项目文件，而不是只留在聊天里。

## 3. 最小部署与消息组织

- 初始配置：本地 Hermes Desktop 或 CLI；远程在线需求出现后再部署服务器。
- 资源参考：发起人认为 Hermes 起步可从 2C/4G 开始；这只是经验值，计算型回测和节点需要单独评估。
- 消息入口：Telegram 群组 Topics 或飞书群聊都可用；按“套利学习 / 策略研究 / 数据与回测 / 开发 / 打卡”分区。
- Telegram 配置检查：Chat ID、Privacy Mode、Bot 权限和是否需要 @Bot 触发。
- 数据存储：策略数据不写 Hermes memory；先用项目内 Markdown/JSON，数据量和查询复杂度上升后再评估 PostgreSQL。

## 4. 学习 Prompt

```text
问我 10 个问题，判断我目前对链上、DeFi、编程和套利的了解，我接下来想做什么，以及每天愿意投入多少时间。一次问一个问题。问完以后再制定学习计划。
```

执行约束：

- 先建立能力、兴趣、时间和自动化边界画像，再制定最近 1–2 周计划。
- 每天只取下一条可执行任务；完成后记录结果，原计划不对就调整。
- 任何策略先做数据核验、完整成本核算和 Paper Trading，不直接执行真实资金。

## 5. 与本项目的衔接

```text
X/资料 → Hermes 提取规则 → 数据/RPC → 最小脚本 → 回测 → Paper Trading → 人工复核 → 记录执行/放弃原因
```

本项目已有对应位置：

- 套利路线：`research/initiator-guidance-2026-08-02.md`
- Hermes 工作流：`tools/hermes-setup.md`、`modules/03-hermes-signals.md`
- 假设与成本：`strategies/hypotheses.md`
- 证据与每日执行：`daily/`、`research/signals/`

## 6. 安全与证据边界

- Access Key、API Key、私钥和助记词不得写入仓库、Obsidian 或聊天；使用环境变量/密钥管理，并仅验证连通性。
- IntensiveCoLearning 的 Agent 接入是工作流入口，不等于学习任务自动完成；仍需核对实际学习、实验和证据。
- 发起人提到的模型、Sub2API、主机商、节点和回测收益属于个人经验；本项目不把它们当作已验证推荐。
- 回测盈利概率不等于实盘结果；实盘前必须单独验证滑点、Gas、延迟、失败交易、流动性和资金占用。
