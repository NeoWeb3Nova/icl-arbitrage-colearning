# MEV-Flashbot-Sandwich-RS：Rust Mempool / MEV 原型

- 来源：https://github.com/theoweb3/mev-flashbot-sandwich-rs
- 审阅提交：`562fc301ef68d6f1435aeef6d94c1ef36212ba90`
- 审阅日期：2026-08-05
- 许可证：仓库根目录未发现 LICENSE 文件，不能假定可自由复用
- 仓库规模：10 个 Git 跟踪文件（浅克隆审阅）

## 一句话判断

这是一个能通过 WebSocket 订阅 pending transaction 并尝试解码 calldata 的 Rust 原型；README 宣称的 sandwich 策略、Flashbots bundle、AES-GCM 私钥保护和模块化发送器，在当前提交中没有得到代码证明。

## README 宣称的目标

README 将项目描述为：

- 监听 Ethereum mempool 中的 pending 交易；
- 识别高滑点交易；
- 构造 sandwich 的前后两笔交易；
- 通过 Flashbots relay 私下提交 bundle；
- 使用 Rust、Tokio、ethers-rs 和 WebSocket；
- 用 AES-GCM 加密私钥；
- 可扩展到清算、套利、JIT 等策略。

这些内容应视为目标/设计叙述，而不是当前能力清单。

## 当前代码实际做了什么

### 1. 可编译的入口

`src/main.rs` 只启动 `mempool::mempool_listen()`，打印启动信息，然后等待监听函数结束。

### 2. `src/mempool.rs` 的实际链路

当前代码：

1. 硬编码连接一个 Alchemy Ethereum Mainnet WebSocket endpoint；
2. 订阅 pending transaction hash；
3. 对每个 hash 调用 `get_transaction`；
4. 只筛选 `tx.to` 等于 USDC 合约地址的交易；
5. 打印发送方、目标地址、金额、gas price、nonce、input 和 pending 状态；
6. 用内置 ABI 尝试匹配函数签名并解码参数。

`src/mev.rs` 和 `src/tx_sender.rs` 当前是空文件，因此没有实际 sandwich 计算、交易构造、签名、Flashbots relay 或 bundle 提交实现。

## 代码审计发现

### 高风险：源码中硬编码了 RPC 凭据

`src/mempool.rs` 直接包含 WebSocket provider URL 和访问凭据。本文不复制该值。任何公开仓库中出现的此类凭据都应视为已经暴露，维护者应立即撤销/轮换，而不是只把字符串挪到 `.env`。

### 高风险：`.env` 被跟踪，且 `.gitignore` 没有忽略它

仓库跟踪列表包含 `.env`；`.gitignore` 只有通用的构建产物规则，没有 `.env`、`.env.*` 或密钥文件规则。本次审阅没有读取 `.env` 内容，也没有把它带入当前项目。

### 功能缺口：目标过滤器不像 DEX swap 监听器

代码把 `tx.to` 与 USDC token 合约地址比较，但 Uniswap swap 通常发往 Router/Universal Router，而不是直接发往 USDC 合约。仓库内的 `ROUTER_LIST` 也没有被使用。因此它很可能漏掉目标交易，不能据此证明已经捕获 sandwich 机会。

### 功能缺口：没有利润和风险计算

当前没有：

- 交易 calldata 的可靠解码与 token/path/amount 提取；
- pool 状态和价格影响计算；
- gas、builder/relay 成本、滑点和失败成本建模；
- 前后腿交易构造；
- nonce、竞争、revert 和余额约束处理；
- bundle 模拟、回执确认或失败重试。

### 可信度问题：README 与代码不一致

README 的模块结构把 `mev.rs` 和 `tx_sender.rs` 描述为已存在的核心能力，但两个文件为空。README 还描述 AES-GCM，而 `Cargo.toml` 中没有 AES-GCM 依赖。`cargo check` 可以通过，但只有未使用常量 warning，不能证明交易能力存在。

## 对当前套利共学的价值

它适合作为“执行层为什么难”的反例和阅读材料：

- mempool 观察只是套利系统的输入，不是套利本身；
- 识别一笔 pending tx 不等于判断它可被夹、可盈利或可安全执行；
- 从观察到执行之间至少还需要状态、成本、竞争、失败和证据闭环；
- 代码审阅必须把 README 的愿景和当前提交的实现拆开。

这与当前项目的 Day 1 结论直接相连：真实跨链报价不等于完整套利；同样，真实 pending 监听也不等于可执行 MEV。

## 对当前项目的处理建议

**不复制、不运行、不接入，不把它作为执行样板。**

如果未来研究 MEV，按以下安全顺序推进：

1. 只读、脱敏的历史交易数据解析；
2. 离线 calldata 解码和机会分类；
3. 固定输入的价格/成本模拟；
4. 本地 fork 或 Paper Trading；
5. 在明确授权、密钥轮换、回滚和回执验证前，不做真实签名和广播。

当前共学项目继续以 LI.FI 只读报价、虚拟套利和可复现证据为主，不新增 Rust、Flashbots 或 mempool 依赖。

## 验证记录

- 已从 GitHub 获取仓库并核对 HEAD；
- 已阅读中英文 README、`Cargo.toml`、`main.rs`、`mempool.rs`、`.gitignore` 和跟踪文件清单；
- 已运行 `cargo check`：通过，但出现未使用 `CONTRACT_ABI` 和 `ROUTER_LIST` 的 warning；
- 未读取 `.env`，未连接其 RPC，未签名、广播或提交任何交易；
- 未运行真实 mempool 监听，因为仓库包含硬编码凭据且当前学习目标是只读/模拟。
