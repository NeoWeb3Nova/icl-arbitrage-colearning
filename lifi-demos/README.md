# LI.FI 快速上手教程（新手向）

> 配套 4 个可直接运行的 demo，10 分钟跑通 LI.FI 全部常用姿势。
> 关联研究：[LI.FI 全面研究文档](../research/lifi-comprehensive-guide.md) · [SDK 使用建议](../research/lifi-sdk-decision.md) · [工具配置](../tools/lifi-setup.md)

---

## 一、LI.FI 是什么（30 秒理解）

**LI.FI = 跨链流动性的"路由与编排层"。** 一个 API / SDK / Widget，把分散在 **69 条链、35 个桥、35 个 DEX** 背后的流动性统一起来，让你用一行代码完成：

- 同链 Swap（DEX 聚合）
- 跨链 Swap 与桥接（桥聚合 + 路径优化）
- 一键进入收益机会（Earn / Composer）

> 💡 对套利研究最重要的能力：**同一笔跨链转账，它会返回所有可行路径 + 费用拆解** —— 这就是路径差异与净收益模型的输入。

---

## 二、4 个 Demo 速览

| Demo | 目录 | 技术栈 | 学什么 |
|---|---|---|---|
| **Demo 1** | `demo1-basic-api/` | Python 标准库 | REST API 五大端点（chains / tokens / tools / quote / routes） |
| **Demo 2** | `demo2-quote-routes/` | Python 标准库 | Quote vs Routes 对比 + 费用拆解（套利研究核心） |
| **Demo 3** | `demo3-lifi-sdk/` | Node.js + `@lifi/sdk` v4 | SDK 路由生命周期：getRoutes / getQuote / executeRoute |
| **Demo 4** | `demo4-lifi-widget/` | React + `@lifi/widget` v4 | 零代码嵌入完整 Swap / 跨链 UI |

---

## 三、Demo 1：REST API 五大端点入门

> 目标：搞清"LI.FI 支持哪些链 / 币 / 桥"。**零依赖**，Python 3.8+ 直接跑。

```bash
cd lifi-demos/demo1-basic-api
python3 demo1_hello_lifi.py
# 可选：python3 demo1_hello_lifi.py --chain arb --top 10
```

**输出要点**（2026-08-05 实测）：

```
① 支持的链：共 69 条
② 链 [eth] 上的代币：共 5321 个
③ 支持的桥：共 35 个
④ 支持的 DEX / 聚合器：共 35 个
⑤ 代币覆盖 Top 链：chainId=1 5321 个代币 ...
```

**五大端点速查**（Base URL `https://li.quest/v1`）：

| 端点 | 用途 |
|---|---|
| `GET /chains` | 支持的链 |
| `GET /tokens` | 支持的代币（`?chains=eth` 按链过滤） |
| `GET /tools` | 桥（`bridges`）+ DEX（`exchanges`） |
| `GET /quote` | 单条最优报价（含可签名交易） |
| `POST /advanced/routes` | 全部候选路由 |

> ⚠️ 新手容易踩的坑：
> - `/tools` 返回的 DEX 字段名是 **`exchanges`**，不是 `dexes`
> - `/tokens?chains=` 传的是链 **key**（如 `eth`），但响应字典的键是链 **ID**（如 `1`）

---

## 四、Demo 2：报价与路由对比（套利研究核心）

> 目标：同一笔跨链转账，有多少条路？到账差多少？费用花在哪？

```bash
cd lifi-demos/demo2-quote-routes
python3 demo2_quote_vs_routes.py
# 可选：python3 demo2_quote_vs_routes.py --amount 1 --save routes.json
```

**实测输出**（0.1 ETH → Arbitrum USDC）：

```
① 最优报价（单条）:
   工具:     across (AcrossV4)
   预计到手: 186557807 USDC ≈ $186.5717
   最低到手: 185625019 USDC（滑点保护线）
   费用拆解: LIFI Fixed Fee=$0.4677 + Relayer fee=$0.0186 + Relayer gas fee=$0.0053 + gas(SEND)=$0.1833

② 候选路由：共 8 条（按 toAmount 从高到低排序）
   #1  squid       toAmount=186568239
   #2  across      toAmount=186557820
   ...

③ 对比结论：最优路由到账 186568239，最差 185409214，差距 ≈ 1.159 USDC
```

**读法**：同样的 0.1 ETH，不同桥到账最多差 **$1.16** —— 这就是"路由漂移"和"路径优化"的价值所在，也是跨链套利的起点。

**费用拆解框架**（喂给净收益模型）：

```
预期净收益 = 到手价值(toAmount × 目标价)
           - 源资产投入(fromAmount × 源价)
           - LIFI Fee（默认 0.25%）
           - 桥费 / Relayer fee / Relayer gas
           - DEX 费（swap 步骤）
           - Gas（源链 + 目标链）
           - 滑点（默认 0.5%，toAmountMin 是保护线）
           - 延迟损失（报价过期 / 跨链确认期间价格变动）
```

---

## 五、Demo 3：@lifi/sdk v4 路由生命周期

> 目标：SDK 是未来前端 Swap / 钱包 / 执行模块的标准姿势。本次只跑**只读**部分。

```bash
cd lifi-demos/demo3-lifi-sdk
npm install
npm run routes     # getRoutes：全部候选路由
npm run quote      # getQuote：单条最优报价 + 费用拆解
npm run execute    # executeRoute：执行链路骨架（默认不广播）
```

**三个脚本对应 SDK 的完整生命周期**：

```
request → getRoutes / getQuote → executeRoute → updateRouteHook → getStatus
（请求）      （报价/路由）        （执行）        （进度回调）       （最终状态）
```

**实测输出**（`npm run quote`）：

```
最优方案工具: across (AcrossV4)
预计到手:     186539322 (≈$186.5532)
最低到手:     185606626（滑点保护线）
费用拆解:
  - LIFI Fixed Fee  250000000000000 ETH  (≈$0.4675, 0.25%)
  - Relayer fee     18563 USDC           (≈$0.0186, 0.01%)
  - Relayer gas fee 5355 USDC            (≈$0.0054, 0.00%)
  - gas(SEND)       94503367942903 ETH   (≈$0.1767)
```

> ⚠️ 新手容易踩的坑：
> - **`getQuote` 和 `getRoutes` 参数名不同**：
>   - `getQuote` → `fromChain / toChain / fromToken / toToken`（链 ID）
>   - `getRoutes` → `fromChainId / toChainId / fromTokenAddress / toTokenAddress`
> - 金额一律用**最小单位字符串**（`"100000000000000000"` = 0.1 ETH），不要用 float
> - `executeRoute` 需要钱包签名，**先装 `@lifi/sdk-provider-ethereum` 并配置钱包**才会真正执行

---

## 六、Demo 4：Widget 快速嵌入

> 目标：零代码嵌入一个完整的换币 / 跨链 UI，5 分钟出界面。

```bash
cd lifi-demos/demo4-lifi-widget
npm install
npm run dev        # 打开 http://localhost:5173
```

核心代码就一块（`src/main.jsx`）：

```jsx
import { LiFiWidget } from "@lifi/widget";

const widgetConfig = {
  integrator: "arbitrage-research",   // 你的集成方标识
  fromChain: 1,                        // Ethereum
  toChain: 42161,                      // Arbitrum
  fromToken: "0x0000...0000",          // ETH
  toToken: "0xaf88...5831",            // USDC (Arbitrum)
  theme: { palette: { primary: { main: "#5C86FF" } } },
};

<LiFiWidget config={widgetConfig} />
```

---

## 七、常见问题（FAQ）

### 1. 需要 API Key 吗？
- 演示/学习：**不需要**，无 Key 限流 200 请求 / 2 小时。
- 生产环境：申请 Key（https://li.fi/），限流提升到 200 请求 / 分钟。
- 服务端 Demo 会自动读取 `LIFI_API_KEY`；浏览器 Widget 不使用 Key，避免泄露。
- ⚠️ **Key 只放环境变量，永远不要提交进仓库。**

### 2. 报价里的 `fromAddress` 填什么？
- 填你自己的钱包地址即可（报价阶段**不会**发生任何交易）。
- Demo 里用的 `0x5520...f8f8` 是演示地址，仅用于让 API 返回合法报价。

### 3. 会不会不小心发起交易？
- Demo 1 / 2 / 3a / 3b：纯只读，不会。
- Demo 3c（`execute-route.js`）：默认 `DEMO_EXECUTE = false`，只打印流程，**不会广播**。

### 4. 我想真正执行一笔交易怎么办？
1. 安装 `@lifi/sdk-provider-ethereum`
2. 配置钱包（viem `walletClient` / 私钥 / EIP-1193 provider）
3. 把 `execute-route.js` 的 `DEMO_EXECUTE` 改为 `true`
4. 全程监听 `updateRouteHook` 获取进度

### 5. 路由为什么会变？
同一笔转账的路由和报价受**金额、网络状态、流动性、市场价**影响，会随时间漂移。这正是 `research/lifi-comprehensive-guide.md` 里建议"定时采集"的原因。

---

## 八、下一步

- 用 [tools/lifi-quote-collector.py](../tools/lifi-quote-collector.py) 做定时采集（固定资产对 × 多链 × 多金额）
- 对照 [modules/02-lifi-routing.md](../modules/02-lifi-routing.md) 记录路由漂移观测
- 把费用拆解字段喂给净收益模型（见 [modules/01-arbitrage-map.md](../modules/01-arbitrage-map.md)）

---

**参考文档**：https://docs.li.fi/ · API 参考：https://docs.li.fi/api-reference/introduction · SDK：https://docs.li.fi/sdk/overview · Widget：https://docs.li.fi/widget/overview · Builders 社区：https://t.me/lifibuilders
