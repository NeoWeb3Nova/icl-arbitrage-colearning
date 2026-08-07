# Gate CrossEx：本地多交易所交易终端

- 来源：https://github.com/your-quantguy/gate-crossex
- 审阅提交：`8b3b371ece4751c223316d7c0f08315cf03fe1d2`
- 审阅日期：2026-08-05
- 许可证：AGPL-3.0-only
- 仓库规模：184 个 Git 跟踪文件（浅克隆审阅）

## 一句话判断

这是一个面向 Gate CrossEx 的本地单用户交易终端，不是链上套利机器人。它对本项目最有价值的部分不是交易策略，而是本地交易工具的安全边界、凭据隔离、状态恢复和“先锁定、再显式授权”的执行设计。

## 实际定位与结构

README 和架构文档描述的主链路是：

```text
本地浏览器 UI
  -> 127.0.0.1 上的 Fastify backend
  -> 本地 SQLite
  -> OS keychain / 本地 .env
  -> Gate CrossEx API 与公开交易所数据接口
```

主要目录职责：

- `apps/backend`：Fastify API、交易所适配器、策略、SQLite；
- `apps/frontend`：React/Vite UI；
- `packages/domain`：十进制安全的交易辅助逻辑；
- `packages/public-data`：公开行情适配器；
- `packages/shared-types`：运行时 schema 和共享契约；
- `migrations`：带校验和的不可变 SQLite migration；
- `scripts`：启动、维护、测试和发布工具。

根目录脚本提供 `lint`、类型检查、单元测试、Playwright E2E、安装器测试、构建和完整 `verify` 流程。它要求 Node.js 20.19+、22.13+ 或 24，并使用锁文件固定依赖。

## 值得学习的设计

### 1. 凭据不经过前端

前端不直接连接交易所，也不接触保存的 API Secret；敏感操作由本地 backend 处理。凭据默认放 OS keychain，或放在明确选择且被 Git 忽略的本地 `.env` 中。SQLite 只保存非秘密元数据。

对应本项目启发：未来如果加入只读交易所数据源，也应保持“前端无密钥、后端固定 allowlist、日志脱敏”的边界。当前 `.env.local` 约定应继续保留，绝不把 Key 写入分享笔记或输出。

### 2. 交易默认锁定

每次启动都回到锁定状态；下单、杠杆、转账和策略运行需要本次会话的显式授权。项目还强调不要授予提现权限。

对应本项目启发：这和当前“只读报价 -> 虚拟套利 -> Paper Trading -> 人工确认”的学习顺序一致，但暂时不应把它扩展成真实执行能力。

### 3. 状态恢复比“发出交易”更重要

架构文档强调：远程结果不明确时保持 unresolved，直到 reconciliation 证明终态；策略要追踪成交、修复双腿失衡，恢复失败时暂停；更新前备份 SQLite，启动时校验 migration checksum。

对应本项目启发：未来记录套利候选时，不应只保存报价。应同时记录报价时间、费用、状态、失败原因和是否完成闭环，避免把“请求已发出”误写成“交易已完成”。

### 4. 运行边界收窄

服务默认只绑定 `127.0.0.1`，后端校验 Host/Origin、CSRF、意图 header 和运行时 schema；开发文档明确禁止通过 `GCT_HOST=0.0.0.0` 暴露服务。

对应本项目启发：本项目的报价采集工具继续保持本地运行和只读，不增加通用代理或公网控制面。

## 不应直接照搬的部分

- CrossEx 是 Gate 体系的中心化跨所账户产品，与当前 LI.FI 跨链路由和链上套利学习目标不是同一执行层；
- 项目明确是 live-only，没有 Paper Trading 执行路径；当前共学不应因此跳过模拟和证据闭环；
- 许可证是 AGPL-3.0-only。即使技术设计值得借鉴，也不能在未评估许可证义务前复制代码或混入当前项目；
- README 含注册/返佣链接，学习时应把产品推广信息与技术事实分开判断；
- 发布包目前未做 Apple notarization 或 Windows Authenticode 签名，不能把“校验了压缩包 hash”理解成完整供应链信任。

## 对当前项目的结论

**保留为架构与安全参考，不引入代码和依赖。**

最小可执行吸收项：

1. 在后续工具中继续区分 public data、private account data、execution 三类边界；
2. 所有潜在执行模块默认 locked，并要求人工确认；
3. 给虚拟套利记录增加状态和 reconciliation 字段；
4. 继续使用现有本地 `.env.local`，不复制外部仓库的凭据处理实现。

## 验证记录

- 已从 GitHub 获取仓库并核对 HEAD；
- 已阅读 README、架构文档、开发文档、`package.json`、许可证和第三方声明；
- 未运行安装器、未连接交易所、未读取任何本地或外部凭据；
- 外部仓库的完整 `npm run verify` 未在本次审阅中执行，因为它会安装依赖、启动浏览器测试并超出“分享代码审阅”的必要范围。
