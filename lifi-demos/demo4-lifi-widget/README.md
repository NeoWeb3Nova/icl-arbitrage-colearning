# 套利共学实验室 · LI.FI Widget

这是一个工作流优先的链上套利学习实验室。实验页面展示每一步的背景、输入、输出、证据、失败条件和最终判断；LI.FI Widget 作为独立工具保留。

当前首个案例：Arbitrum `ETH → USDC → ETH` Paper Trading。它是只读报价模拟，不是成交记录；理论和保守往返结果均为负，因此结论是明确否定信号，不执行。

在线地址：https://icl-arbitrage-lifi-widget.vercel.app

## 本地前端

```bash
npm install
npm run dev
```

## 工作流数据

- 工作流定义：`src/workflows/eth-usdc-eth.js`
- 首个证据快照：`public/evidence/20260818-lifi-paper-trade.json`
- 测试：`test/workflow.test.js`

新增案例时，添加一个工作流定义和对应的证据快照。不要把 Paper Trading、实时只读报价或真实交易混写；页面必须明确标注证据类型。

普通 Vite 开发服务器不运行 `/api/lifi`。完整本地联调需要 Vercel CLI：

```bash
npx vercel dev
```

## 验证

```bash
npm test
npm run build
```

## Vercel

从本目录创建独立 Vercel Project，并在 Vercel 环境变量中设置：

```text
LIFI_API_KEY=<LI.FI Partner Portal key>
```

不要创建 `VITE_LIFI_API_KEY`，也不要把 Key 传入 Widget 配置；`VITE_*` 会进入公开浏览器 bundle。

## 安全边界

- Key 只由 `/api/lifi/*` 服务端函数读取，不返回浏览器。
- 代理固定转发到 `https://li.quest/v1`，仅允许 GET/POST。
- 所有授权、切链、签名和广播都需要用户钱包确认。
- 实时报价不是成交保证；执行前核对资产、链、最低到账、Gas、滑点与失败风险。
- 公开代理仍可能被访客消耗额度；出现真实滥用后再增加平台级限流。