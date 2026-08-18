# AI × Web3「捡钱」X Article 配图 Shot Config

文章：`shares/2026-ai-web3-pick-money-x-article.md`
状态：已收到并接入 4 张图片；`IMG-00` 至 `IMG-03` 已完成，`Base 单次小利润` 与 `漏洞赏金` 暂无配图。

## Visual system

- Style: quirky hand-drawn editorial illustration
- IP: none by default；如使用 Gimi，所有图片附同一张 Gimi reference image
- Cover: exact 5:2，建议 2000×800
- Body: exact 16:9，建议 1920×1080
- Background: white / warm off-white
- Scene: black wobbly ink lines, soft blue main accent, soft orange ≤ 2 tiny highlights
- Text: sparse labels only；权威金额、证据和长句保留在 Markdown 正文
- Do not use: neon, dark cyberpunk, money rain, rocket, 100X, guaranteed profit, casino imagery, dense dashboard, PPT infographic

## Shots

### IMG-00 — Cover

- 插入：文章标题后，正文前
- Claim：AI 降低普通人进入复杂 Web3 研究世界的门槛，但不保证收益
- Composition：5:2 continuous horizontal scene；左侧标题安全区，右侧 AI research desk → blockchain blocks → DEX pools → compute node → bug bounty shield
- Labels：`快来用 AI，到 Web3 的 Crypto 世界捡钱`、`5 个真实案例，普通人也能开始`
- QA：标题可读；主体不能被移动端中心裁切；不能出现“稳赚”或“100X”暗示
- Prompt：见 `prompts.md` 的 `IMG-00`

### IMG-01 — MEV atomic arbitrage

- 插入：第 01 节后
- Claim：MEV 利润来自交易排序和执行精度，不是魔法
- Composition：三个 DEX liquidity pools；用户交易改变一个池子价格；AI 发现偏差；atomic path 在同一区块完成买卖
- Labels：`用户交易`、`价格偏差`、`原子套利`、`Gas`、`净收益`
- QA：只画三段主路径；不把 MEV 画成无风险收益
- Prompt：见 `prompts.md` 的 `IMG-01`

### IMG-02 — MEV double edge

- 插入：第 03 节后
- Claim：MEV 机器人可以产生高额归因收益，也可能让普通用户获得更差成交
- Composition：同一用户交易路径左右分叉；一侧是历史归因收益 ledger，另一侧是用户收到更少 Token、承担滑点；AI 在底部做证据分析
- Labels：`MEV 机器人`、`用户交易`、`高额归因收益`、`滑点`、`不要照抄`
- QA：不表现为英雄叙事；明确收益与用户损失的关联
- Asset：`research.png`
- Prompt：见 `prompts.md` 的 `IMG-03`

### IMG-04 — Bittensor contribution

- 插入：第 04 节后
- Claim：Web3 收入机会也可以来自提供 AI 计算、推理或预测服务
- Composition：普通人研究 Subnet 规则；AI service node 提供 inference / compute / prediction；Validator 评分；TAO reward follows contribution
- Labels：`Subnet 规则`、`AI 推理`、`Validator 评分`、`TAO 奖励`、`成本`
- QA：奖励是条件性的；不画 Token 投机或被动躺赚
- Asset：`bittensor.png`
- Prompt：见 `prompts.md` 的 `IMG-04`

### IMG-05 — bug bounty whitehat

- 插入：第 05 节后
- Claim：AI 可以辅助授权内漏洞研究；协议在修复后用赏金奖励白帽子
- Composition：researcher + AI contract analysis；透明智能合约内一个会计连接出现问题；authorized report → protocol repair → bounty envelope；不要画资金被盗
- Labels：`授权范围`、`资金流`、`漏洞报告`、`修复`、`赏金`
- QA：必须表现负责任披露；不得出现私钥、助记词、漏洞利用代码或盗币场景
- Prompt：见 `prompts.md` 的 `IMG-05`

## Integration gate

当前已接入：`00-cover.png`、`mev.png`、`research.png`、`bittensor.png`。

暂缺：Base 单次小利润、漏洞赏金两张配图。它们不阻塞当前 X Article；如后续补图，再新增到对应章节即可。
