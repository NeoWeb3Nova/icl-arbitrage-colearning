---
title: Morpho MetaMorpho × sNUSD NAV 折价套利与 donation 机制
source: https://etherscan.io/tx/0x82a206c9dff00bf7b205987bdcd9384c06c6d9962aa929c84ab45dd0330c4e72
comparison_source: D:\NeoPersonal\weixin\xwechat_files\wxid_ebl0x13k32no22_3066\msg\file\2026-08\0x82a206c9_arbitrage_analysis_report.md
observed_at: 2026-08-14
transaction_time_utc: 2026-08-13T16:54:11Z
status: evidence-based-case-study
learning_state: unverified
---

# Morpho MetaMorpho × sNUSD NAV 折价套利与 donation 机制

> 这是对一笔已发生 Ethereum 主网交易的只读研究，不是交易教程、收益承诺或本人真实交易记录。
>
> 核心定性：它不是普通的即时“低买高卖”，而是把 **sNUSD 的 DEX 即时流动性价格与可延迟赎回 NAV 的偏离**，和 **Morpho 借贷、MetaMorpho `supply(onBehalf=vault)` donation、闪电贷临时大额持仓** 拼接起来。只有当 NAV/预言机不能兑现时，才应进一步定性为坏账提取或攻击；仅凭本交易不能直接下这个结论。

## 0. 与外部报告交叉复核后的结论

外部报告补足了本报告第一版缺少的历史状态和 marketParams：目标市场 LLTV 为 91.5%，oracle 为 `0x28e82e7f25dbcd487af27c80de4f62553260feca`（Etherscan 可独立识别为 `MorphoChainlinkOracleV2`），交易时 sNUSD NAV 约为 `1.0637953511 USDC`，交易前目标市场利用率为 100%。这些信息使流程解释更完整：1,000 USDC donation 不只是抬高 vault share 价格，更重要的是为原本无剩余流动性的目标市场补出可借空间。

两份分析的主流程和 `166.666013 USDC` 现金流完全一致，但需要纠正以下表述：

1. 外部报告的十进制区块号 `25,710,561` 写错；其十六进制 `0x188dfe1` 和 Etherscan 对应的正确十进制都是 `25,747,425`。
2. 外部报告的 Gas used `1,739,038` 与 Etherscan receipt 页面不符；Etherscan 显示 `1,740,574`，相差 1,536 gas。手续费 `0.000227020318453654 ETH` 与 Etherscan一致。
3. 外部报告写“share 单价上涨 3.13 bps”大了 10 倍；按链上 Deposit/Withdraw 事件计算是约 `0.31371785 bp`，即 `0.0031371785%`。
4. 外部报告列出的两个 V4 pool id 是真实 event id 的中间截段，不是完整 id。完整值分别为：
   - `0x7a3536c19286fb12964c85d5bc4146ed2af95067570f528c1445d8530f1aca9c`
   - `0xccf5f35a3e2946ca60339957e6a803f91369422e736ea73ca80c5f5820a7ecee`
5. Kyber `ClientData.AmountOutUSD = "0"` 只证明这份客户端元数据没有输出美元估值，不能据此推出“市场不知情”或 Kyber 将 sNUSD 的真实价值判为零。
6. “把债务丢给一次性合约”容易误导。债务仍是有效 Morpho 债务，且执行器获得了该账户授权；只有放弃账户且抵押品不足时，风险才转给 lender。若 sNUSD 最终能按 NAV 赎回，账户还有约 `93.6591 USDC` 的 NAV 口径净权益，而非已经消失的债务。
7. 本报告第一版把它直接定性为“攻击/向存款人转移价值”也过强。更稳妥的分类是 **带期限与赎回风险的 NAV 折价套利，使用 vault donation 降低临时流动性成本**；是否构成坏账提取，取决于 sNUSD/NUSD 的真实可赎回性、时间成本和清算结果。
8. 外部报告所说的“单次利润上限约 260 美元”没有被证明是上限；`260.3251 USDC` 恰好是本交易 `166.666013` 已实现现金加 `93.6591` NAV 口径头寸权益。真正容量还取决于 AMM 曲线、可借流动性、donation 成本和赎回折价。
9. “无头寸版本：买入 → 抵押 → 借款”用词错误；只要抵押并借款就会留下抵押/债务头寸。准确说法应是“去掉 flash-vault-donation 腿的简化版本”。

## 1. 一句话结论

执行者用 Morpho 零费闪电贷暂时成为 MetaMorpho 金库的绝对大股东，再向目标 sNUSD/USDC Morpho 市场直接捐赠 1,000 USDC；随后以约 709.93 USDC 从薄流动性市场买入 1,034.60 sNUSD，按更高的借贷估值借出 1,006.94 USDC，最后按被捐赠抬高后的金库份额价格退出并归还闪电贷，链上留下 **166.666013 USDC 毛收益**。

这 166.666013 USDC 的经济来源不是闪电贷本身，也不是即时 DEX 循环价差，而是 sNUSD 即时退出价格相对 NAV 折价所释放的借款能力，减去 donation 未被临时 vault share 回收的部分。最终由折价卖方、期限/赎回风险还是 lender 坏账承担，不能只靠本交易确定。

## 2. 已核验对象

| 角色 | 地址 / 标识 | 已核验信息 |
|---|---|---|
| 交易 | `0x82a206c9dff00bf7b205987bdcd9384c06c6d9962aa929c84ab45dd0330c4e72` | Ethereum 主网，成功，区块 `25747425` |
| 发起 EOA | `0x343De4Fe545E0BdE879A96500700800720f7af32` | 支付 Gas，最终收到 166.666013 USDC |
| 执行器 | `0xFBC74F4A2b603715c8b4368Be062157EA536142d` | 未验证源码；编排闪电贷、金库、兑换、借贷与清算余额 |
| Morpho Blue | `0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb` | 提供 USDC 闪电贷并承载 supply / collateral / borrow / withdraw |
| MetaMorpho 金库 | `0xf29ce940178C8794802fB48a6c1B2EdDdAC96431` | Etherscan 标识 `MetaMorphoV1_1`；底层资产为 USDC |
| USDC | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | 6 decimals |
| sNUSD | `0x08EFCC2F3e61185D0EA7F8830B3FEc9Bfa2EE313` | Etherscan 标识 `Staked NUSD`，18 decimals |
| Kyber 聚合路由 | `0x6131B5fae19EA4f9D964eAc0408E4408b66337b5` | 将 USDC 路由为 sNUSD |
| Uniswap V4 PoolManager | `0x000000000004444c5dc75cB358380D2e3dE08A90` | 两段 sNUSD/USDC swap 的结算方 |
| 临时借款账户 | `0xeBf74C12319FC28251Ce7f7AaC5e8c877509705E` | 交易内创建，被授权给执行器，持有抵押与债务头寸 |
| 目标 Morpho 市场 ID | `0xae60b71b407e0517ead445b7113a7ffa07ea4a9379d526ade541a3e9ec777cb4` | 本交易中接受 sNUSD 抵押并借出 USDC |
| 目标市场 oracle | `0x28e82e7f25dbcd487af27c80de4f62553260feca` | Etherscan 标识 `MorphoChainlinkOracleV2`；外部报告历史查询值约为 1.0637953511 USDC/sNUSD |
| 目标市场 LLTV | `91.5%` | 外部报告通过历史 marketParams 查询得到；本交易实际借款 LTV 约 91.4902% |

证据边界：执行器未验证源码；外部报告声称基于 `debug_traceTransaction` 与历史 `eth_call`，但其 `/home/zhangy/temp/` 中间文件不在当前环境，无法逐字节复算。oracle 合约类型可由 Etherscan 独立核验；LLTV、历史 NAV 与交易前 100% 利用率目前属于“高可信外部复核结果”，仍应在后续保存可复现 RPC JSON。

## 3. 交易逐步还原

### 3.1 闪电贷与金库建仓

1. 执行器从 Morpho 借出 `27,722,557.767661 USDC` 闪电贷。
2. 向 MetaMorpho 金库存入 `27,720,847.840856 USDC`，铸造约 `26,222,631.8090406107` 份金库 share。
3. 金库按 supply queue 将这笔资金分配到三个 Morpho 市场：
   - `9,958,751.776621 USDC`
   - `8,340,464.534694 USDC`
   - `9,421,631.529541 USDC`
4. 三项合计严格等于金库存款：`27,720,847.840856 USDC`。

闪电贷的作用是让执行者只在一个交易内，以几乎零自有本金持有金库绝大多数新增 share。它是杠杆，不是利润源。

### 3.2 直接向目标市场捐赠

执行器绕过金库的存款入口，直接在 Morpho Blue 的目标市场供应 `1,000 USDC`，但 `onBehalf` 指向 MetaMorpho 金库。

结果是：

- 目标市场把这 1,000 USDC 记为金库资产；
- 金库没有为这笔外部供应铸造新 share；
- 每份金库 share 对应的资产价值上升；
- 执行者因刚通过闪电贷取得绝大多数 share，可在退出时回收捐赠的大部分价值。

外部报告的历史状态查询显示，交易前目标市场：

```text
totalSupplyAssets = 1,659,566.249220 USDC
totalBorrowAssets = 1,659,566.249220 USDC
utilization       = 100%
```

所以 donation 还有第二个关键作用：补充 1,000 USDC 可借流动性。交易中目标市场的 vault allocation 最终少取回 `6.940350 USDC`，两者合计正好覆盖借款：

```text
1,000.000000 + 6.940350 = 1,006.940350 USDC
```

官方安全文档特别指出：MetaMorpho 的 supply cap 只约束金库/allocator 的 reallocation，不约束第三方直接在 Morpho Blue `supply(onBehalf=vault)`；因此 cap 不能单独阻止此类 donation。

### 3.3 低价买入抵押品并高估值借款

1. 执行器经 Kyber/Uniswap V4 用 `709.926805 USDC` 买入 `1,034.596985500417093984 sNUSD`。
2. 两个 Uniswap V4 swap 事件分别输出约：
   - `960.382602856963720399 sNUSD`，支付 `653.132660 USDC`；
   - `74.214382643453373585 sNUSD`，支付 `56.794145 USDC`。
3. 实际成交均价：

```text
709.926805 / 1,034.596985500417093984
= 0.68618681 USDC / sNUSD
```

4. 执行器在交易内创建临时账户，将全部 sNUSD 作为目标 Morpho 市场抵押品。
5. 该账户借出 `1,006.940350 USDC`，资金回到执行器。

观察到的借款额/抵押品数量为：

```text
1,006.940350 / 1,034.596985500417093984
= 0.97326820 USDC / sNUSD
```

外部报告历史查询得到 sNUSD NAV/oracle 口径约 `1.0637953511 USDC`、LLTV 为 91.5%。独立计算得到最高可借约 `1,007.048509 USDC`，实际借款 `1,006.940350 USDC`，实际 LTV 约 `91.4902%`，与贴近上限借款的结论一致。抵押品市场成交价与实际借款之间产生：

```text
1,006.940350 - 709.926805
= 297.013545 USDC
```

### 3.4 金库退出与闪电贷归还

金库从三个 Morpho 市场依次撤出：

- `8,340,457.594344 USDC`
- `9,958,751.776621 USDC`
- `9,422,508.122359 USDC`

合计向执行器兑回：

```text
27,721,717.493324 USDC
```

相对原金库存款多取回：

```text
27,721,717.493324 - 27,720,847.840856
= 869.652468 USDC
```

因此 1,000 USDC donation 中，执行者通过其临时持有的金库 share 回收了 869.652468 USDC；其真正承担的 donation 净成本为：

```text
1,000 - 869.652468
= 130.347532 USDC
```

最后执行器向 Morpho 归还全部闪电贷 `27,722,557.767661 USDC`，并将余额 `166.666013 USDC` 转给发起 EOA。

## 4. 完整损益恒等式

按执行器 USDC 现金流精确重算：

```text
+ 27,722,557.767661  闪电贷流入
- 27,720,847.840856  存入 MetaMorpho 金库
-          1,000.000000  直接供应给目标市场，onBehalf=vault
-            709.926805  买入 sNUSD
+          1,006.940350  以 sNUSD 抵押借出 USDC
+ 27,721,717.493324  赎回金库 share
- 27,722,557.767661  归还闪电贷
=            166.666013  USDC 毛收益
```

也可以拆成两个经济模块：

```text
抵押品估值差提取 = 1,006.940350 - 709.926805
                  = 297.013545 USDC

donation 净成本   = 1,000 - 869.652468
                  = 130.347532 USDC

毛收益            = 297.013545 - 130.347532
                  = 166.666013 USDC
```

交易 Gas 为 `0.000227020318453654 ETH`。Etherscan 按交易时 ETH 价格显示约 `$0.43`，所以按该页面美元估值：

```text
保守近似净收益 ≈ 166.666013 - 0.43
               ≈ 166.236013 USDC
```

这里没有另扣 Morpho 闪电贷费，因为事件显示本金借出与归还相同；swap 的池费和价格影响已反映在实际 USDC 输入与 sNUSD 输出中，不能重复扣除。

## 5. 金库 share 价格变化

按 Deposit/Withdraw 事件中的资产和 share 数量计算：

```text
存入时每 share 资产 ≈ 1.0571344647145165 USDC
退出时每 share 资产 ≈ 1.0571676289092640 USDC
单交易增幅          ≈ 0.31371785 bp
```

增幅看起来只有约万分之 0.314，但执行者用约 2,772 万 USDC 的闪电规模放大后，仍回收了 869.65 USDC。这里体现的是：

> 微小 share-price 变化 × 巨额临时持仓 = 可观现金变化。

## 6. 价值究竟从哪里来

### 不是来自闪电贷

闪电贷本金全部归还，且本交易观察不到额外闪电贷费用。它只解决“如何在一个交易里短暂持有大多数金库 share”的资本门槛。

### 不是普通 DEX 套利

交易没有把 sNUSD 再卖回 USDC。sNUSD 被留在一个带债务的临时 Morpho 账户中；因此路径不是 `USDC → sNUSD → USDC` 的市场循环。

### 主要来自即时流动性价格与 NAV 的期限错配

执行者用约 709.93 USDC 获得抵押品，却立即借出 1,006.94 USDC。外部资料显示 sNUSD unstake 存在 cooldown，因此 0.6862 USDC 的 DEX 价格可能包含期限、队列、NUSD 信用和流动性折价；NAV 不是无风险现价。

交易结束后，临时账户仍有 `1,034.5969855 sNUSD` 抵押与 `1,006.940350 USDC` 债务。按 1.0637953511 NAV 计，净权益约 `93.6591 USDC`；已转给 EOA 的 166.666013 USDC 是现金收益。若 NAV 最终可兑现，合计 NAV 口径收益约 `260.3251 USDC`；若不能兑现，头寸可能被清算并给 lender 留下损失。因此必须把“已实现现金”“NAV 口径未实现权益”和“真实最终利润”分开。

## 7. 这类结构成立的必要条件

缺一项都可能让交易无利可图或直接回滚：

1. **金库允许即时 deposit 与 withdraw/redeem**，且没有足以阻断同交易临时持仓的限制。
2. **金库 supply queue 非空**，大额闪电存款能自动部署到 Morpho 市场并铸造 share。
3. **第三方可以在 Morpho Blue 直接 `supply(onBehalf=vault)`**，使金库资产增加但不铸造新 share。
4. **目标市场仍在金库可计价/可退出结构中**，即使金库层 cap 已降低也不一定安全。
5. **抵押品真实可买价格显著低于借贷可借价值**。
6. **目标市场有可借 USDC 流动性**；本交易先直接供应 1,000 USDC，正是为了制造/补足可借流动性。
7. **金库其他市场有足够现金流动性**，允许执行者 redeem；交易结束后目标市场新增借款头寸由 vault 的供给承接。
8. **所有步骤可在同一 Ethereum 交易内原子执行**，否则执行者会暴露于 sNUSD 价格、预言机、队列和竞争变化。
9. **毛利高于 Gas、路由价格影响、失败成本和竞争成本**。

## 8. 风险与否定条件

### 执行者风险

- 报价或池状态变化导致买不到足量 sNUSD；
- 预言机/LLTV/可借流动性变化导致借款小于预期；
- 金库 withdrawal queue 现金不足，无法赎回并归还闪电贷；
- 其他搜索者复制交易并抢先消耗 sNUSD 或可借 USDC；
- 私有 bundle 未上链或公开 mempool 暴露交易意图；
- 合约审批、授权、回调或最小利润检查任一失败，整笔交易回滚并产生提交/搜索成本。

### 协议与存款人风险

- 抵押品预言机没有及时反映 DEX 深度和脱锚；
- cap 被误解为完整风险上限，但 direct supply donation 可绕过金库层 cap；
- withdrawal queue 让先退出者拿走优质流动性，剩余持有人承受低流动性/坏账资产；
- share price/NAV 在同交易内可被外部 supply 改变；
- 临时高额 deposit 使 donation 的大部分价值被执行者而非原存款人回收。

### 明确否定条件

出现任一条件时，这条路径应被判定为不可执行：

- `borrowable_value(sNUSD) <= acquisition_cost(sNUSD) + unrecovered_donation + gas + failure_buffer`；
- 目标市场不可借、被移出 withdrawal queue，或 oracle/LLTV 已修正；
- 金库不能即时赎回足以覆盖闪电贷的 USDC；
- donation 不再计入可赎回 NAV，或金库对 share-price 突变/同交易进出有有效防护；
- 竞争后只剩屏幕毛差，没有保守净收益。

## 9. 事件后的链上信号

Etherscan 显示，在本交易后约 4–6 分钟，金库管理地址连续执行了多笔 `Submit Cap`、`Set Supply Queue` 和 `Multicall`。这是明确的风险处置时序信号，但仅凭方法名不能断言每项参数的具体修复效果。

同一执行器地址历史上至少出现 7 次相同 selector `0x02393416` 的调用，并在每次交易中创建临时合约账户；说明这更接近可重复扫描的策略族，而不是单次偶然手工操作。但每笔是否盈利、是否针对同一金库/抵押品，必须逐笔重算，不能从调用形态直接推断。

## 10. 分类

| 维度 | 结论 |
|---|---|
| 链 | Ethereum 单链 |
| 原子性 | 单笔 EVM 交易，成功则全部生效，失败则状态回滚 |
| 资金工具 | Morpho 闪电贷 |
| 主要价差 | sNUSD DEX 成交价 vs Morpho 借贷可借价值 |
| 放大器 | MetaMorpho donation 导致的 NAV/share-price 变化 + 临时大股东持仓 |
| 风险转移 | 临时账户保留抵押与债务；NAV 无法兑现时 lender/金库存款人承受坏账风险 |
| 更准确名称 | sNUSD NAV discount arbitrage with Morpho borrowing and MetaMorpho donation |
| 是否普通套利 | 不是即时闭环无风险套利；属于带赎回期限、预言机和清算风险的结构性套利 |
| 本项目当前结论 | 已核验历史毛收益；不是当前可执行机会，也不是本人真实交易 |

## 11. 防守型监控最小方案

不先写执行器。项目更适合先做只读监控，观察以下组合信号：

1. 同一交易出现 Morpho `FlashLoan`；
2. 大额 MetaMorpho `Deposit` 后，同交易快速 `Withdraw/Redeem`；
3. 第三方直接 Morpho `Supply`，且 `onBehalf` 是 vault；
4. 某抵押品的实际 DEX 成交均价显著低于该市场可借价值；
5. 新建临时账户获得 Morpho 授权、供应抵押、借出 loan token；
6. 交易末尾闪电贷归还，余额 sweep 到 EOA。

第一版只需要历史事件解析与精确 Decimal 现金流重算；不需要钱包、签名器、自动交易或复杂 Agent。

## 12. 下一阶段最小验证清单

- [ ] 把外部报告中的完整 `marketParams / oracle price / utilization` 历史 RPC 响应保存为项目证据 JSON；
- [ ] 对比交易前后金库 totalAssets、totalSupply、各 market position；
- [ ] 确认临时借款账户后续是否可清算、是否形成已实现坏账；
- [ ] 逐笔重算同执行器其余 6 笔交易的毛收益、Gas 与目标金库；
- [ ] 验证事后 cap / supply queue 调整是否真正移除脆弱市场；
- [ ] 只读实现一个历史交易解析器，输出可复现 JSON，不包含执行代码。

## 13. 费曼理解门

在把本课题标记为“已掌握”前，需要用户回答：

> 为什么执行者不能只做“买便宜 sNUSD → 抵押借 USDC”，还要先用闪电贷成为金库大股东并向目标市场 donation 1,000 USDC？请分别说明 donation 对“可借流动性”和“金库 share 价格/成本回收”的两个作用。

边界追问：

> 如果借贷预言机与 sNUSD 的真实可清算价格完全一致，但 `supply(onBehalf=vault)` 仍可用，这笔交易还能稳定盈利吗？为什么？

当前学习状态：`unverified`。代理已完成证据核验与研究整理，不代表用户已经掌握。

## 14. 证据与参考

### 一手链上证据

- [目标交易 Etherscan](https://etherscan.io/tx/0x82a206c9dff00bf7b205987bdcd9384c06c6d9962aa929c84ab45dd0330c4e72)
- [执行器地址](https://etherscan.io/address/0xfbc74f4a2b603715c8b4368be062157ea536142d)
- [MetaMorpho 金库](https://etherscan.io/address/0xf29ce940178c8794802fb48a6c1b2edddac96431)
- [sNUSD Token](https://etherscan.io/token/0x08efcc2f3e61185d0ea7f8830b3fec9bfa2ee313)

### 协议资料

- [Morpho Docs: Security Considerations for Vault Curators](https://docs.morpho.org/curate/concepts/security-considerations) — 官方列出 acquire vault shares → donate on broken market → buy cheap collateral and borrow → withdraw inflated position 的同类攻击结构，并明确 supply caps 不阻止 direct donation。
- [Morpho Docs: Flash Loans](https://docs.morpho.org/learn/concepts/flashloans)
- [Morpho MetaMorpho v1.1](https://github.com/morpho-org/metamorpho-v1.1)
- [Re7 Labs incident update](https://x.com/Re7Labs/status/2035770653261869480) — 同类 `supplyOnBehalf` 风险的公开事件说明；不是本交易本身的归因证据。

### 二手解释

- [Unified Labs: Anatomy of a Morpho vault NAV flash loan manipulation attack](https://unifiedlabs.io/insights/research-anatomy-of-a-morpho-vault-nav-flash-loan-manipulation-attack-after-the-usr-depeg) — 用于理解同类机制，不替代本交易逐事件核验。

### 外部对照报告

- `D:\NeoPersonal\weixin\xwechat_files\wxid_ebl0x13k32no22_3066\msg\file\2026-08\0x82a206c9_arbitrage_analysis_report.md` — 提供 callTracer、历史状态、oracle、LLTV、利用率与 NAV 结果；本文已吸收其可交叉验证部分，并保留错误与证据边界说明。
