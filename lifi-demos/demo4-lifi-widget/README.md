# LI.FI 实时换币与跨链 Widget

EVM-only LI.FI Widget。浏览器负责连接钱包和请求签名；Vercel Function 代理 LI.FI API，并在服务端添加 `LIFI_API_KEY`。

在线地址：https://icl-arbitrage-lifi-widget.vercel.app

## 本地前端

```bash
npm install
npm run dev
```

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