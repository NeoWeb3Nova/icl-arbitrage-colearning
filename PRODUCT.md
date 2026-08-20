# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

公开访客，主要在浏览器中了解链上套利研究方法、工具和可复核的机会判断流程。

## Product Purpose

这是一个链上套利共学与研究实验室。它把报价、成本、风险、失败条件和否定条件拆成可检查的研究步骤，帮助访客理解一个机会为什么成立或不成立，而不是把屏幕价差直接包装成可执行利润。

产品成功的标准是：访客能够找到研究入口，理解数据证据的类型，区分模拟、实时只读报价和真实交易，并沿着流程形成可解释的判断。

## Positioning

产品以“可复核的套利研究流程”作为核心机制：工作流、诊断终端、只读行情、Paper Trading 证据和风险边界共同组成判断链路。它不以自动执行或盈利承诺作为产品价值。

## Operating Context

- 访客从 Scan、诊断终端、实验工作流、LI.FI 工具、Binance 行情和套利监控平台等入口浏览研究内容。
- 研究流程需要展示背景、输入、报价、成本、风险、证据、失败条件和下一步。
- Watchlist 允许登录用户保存机会并后续复核。
- LI.FI Widget 用于 EVM 换币与跨链的用户手动确认流程；网站不自动签名或广播交易。
- Binance Web3 Market API 用于只读市场数据；服务端代理负责签名和密钥保护。

## Capabilities and Constraints

- 只读和模拟优先，不自动签名、不自动广播交易。
- 真实报价、模拟数据、链上证据和真实交易必须明确区分。
- 现有能力包括套利 Scan、Paper Trading/诊断、实验工作流、LI.FI Widget、Binance 只读行情、套利监控平台资源目录，以及 Supabase Auth/Watchlist。
- Supabase 用于登录和 Watchlist 持久化；用户数据按用户身份隔离。
- LI.FI API key、Binance key/secret 和 Supabase 服务端凭证不得进入公开浏览器 bundle。
- 任何套利判断都必须考虑费用、Gas、滑点、流动性、延迟、失败成本、MEV/执行风险和资金占用。
- 不把屏幕价差、理论毛利润或模拟结果称为可执行机会或真实盈利。
- 尚未确认的内容：未来是否开放团队协作、是否增加更多链/非 EVM 生态、是否提供更多实时数据源。

## Brand Commitments

- 产品名称和当前身份：ARBITRAGE//SCAN / 套利研究实验室。
- 公开内容应保持证据优先、风险诚实、可解释和不夸大收益。
- 现有网站与 `lifi-demos/Arbitrage` 的复用关系属于实现背景；最终线上应用是 `lifi-demos/demo4-lifi-widget`。

## Evidence on Hand

- 主应用：`lifi-demos/demo4-lifi-widget/`
- 工作流定义：`lifi-demos/demo4-lifi-widget/src/workflows/eth-usdc-eth.js`
- Paper Trading 证据：`lifi-demos/demo4-lifi-widget/public/evidence/20260818-lifi-paper-trade.json`
- Supabase schema：`lifi-demos/demo4-lifi-widget/supabase/schema.sql`
- Binance 服务端代理：`lifi-demos/demo4-lifi-widget/api/binance.js`
- 现有测试：`lifi-demos/demo4-lifi-widget/test/`
- 当前没有真实交易记录；不得在产品内容中虚构真实交易、收益、客户、评级或背书。

## Product Principles

1. 先解释和验证，再讨论执行。
2. 证据类型必须可见，模拟数据不能冒充实时或真实交易。
3. 每个机会都要同时展示成立条件和否定条件。
4. 安全边界优先于自动化便利，用户始终手动确认钱包交易。
5. 公开访客应能在最少上下文切换下理解研究流程和结论。

## Accessibility & Inclusion

- 这是 Web 产品，交互必须支持键盘焦点、可读标签、清晰错误恢复和移动端触控。
- 研究数据和风险状态不能只依赖颜色表达；需要同时使用文字或结构表达。
