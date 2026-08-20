import { createHmac } from "node:crypto";
import { ProxyAgent, fetch as signedFetch } from "undici";

const UPSTREAM = "https://web3.binance.com/build";
const ALLOWED_METHODS = new Set(["GET", "OPTIONS"]);
const DEFAULT_RECV_WINDOW = "15000";

const ROUTES = {
  chains: { path: "/api/v1/dex/market/supported/chain", params: [] },
  "hot-tokens": {
    path: "/api/v1/dex/market/token/hot-token",
    params: ["binanceChainId", "rankBy", "rankingTimeFrame", "pageId", "size"],
    required: ["binanceChainId"],
  },
  search: {
    path: "/api/v1/dex/market/token/search",
    params: ["chains", "search"],
    required: ["chains", "search"],
  },
  candles: {
    path: "/api/v1/dex/market/candles",
    params: ["binanceChainId", "tokenContractAddress", "bar", "after", "before", "limit"],
    required: ["binanceChainId", "tokenContractAddress"],
  },
};

const PARAM_LIMITS = {
  binanceChainId: /^[A-Za-z0-9_]{1,32}$/,
  tokenContractAddress: /^[A-Za-z0-9]{1,80}$/,
  chains: /^[A-Za-z0-9_,]{1,120}$/,
  search: /^[\s\S]{1,80}$/,
  rankBy: /^([1-9]|10)$/,
  rankingTimeFrame: /^[1-5]$/,
  pageId: /^\d{1,6}$/,
  size: /^\d{1,2}$/,
  bar: /^(1s|5s|30s|1m|3m|5m|15m|30m|1h|2h|4h|6h|8h|12h|1d|3d|1w|1M)$/,
  after: /^\d{10,16}$/,
  before: /^\d{10,16}$/,
  limit: /^\d{1,3}$/,
};

function credentials() {
  const apiKey = process.env.BINANCE_KEY || process.env.BINANCE_API_KEY;
  const apiSecret = process.env.BINANCE_SECRET || process.env.BINANCE_API_SECRET;
  return { apiKey, apiSecret };
}

export function isoTimestamp(date = new Date()) {
  const ms = String(date.getUTCMilliseconds()).padStart(3, "0");
  return date.toISOString().replace(/\.\d{3}Z$/, `.${ms}Z`);
}

export function snakeToCamel(key) {
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function encodeQuery(params = {}) {
  const pairs = [];
  for (const [rawKey, rawValue] of Object.entries(params)) {
    if (rawValue == null || rawValue === "") continue;
    const key = snakeToCamel(rawKey);
    pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(rawValue))}`);
  }
  return pairs.join("&");
}

export function buildSignature({ secret, timestamp, method, path, query = "", body = "" }) {
  const preHash = query
    ? `${timestamp}${method.toUpperCase()}/build${path}?${query}${body}`
    : `${timestamp}${method.toUpperCase()}/build${path}${body}`;
  return createHmac("sha256", secret).update(preHash, "utf8").digest("base64");
}

export function requestRoute(req) {
  if (req.query?.route) {
    return Array.isArray(req.query.route) ? req.query.route.join("/") : String(req.query.route);
  }
  const url = new URL(req.url, "http://localhost");
  return url.pathname.replace(/^\/api\/binance\/?/, "") || url.searchParams.get("route") || "";
}

export function requestQuery(req) {
  if (req.query && Object.keys(req.query).length) {
    const query = { ...req.query };
    delete query.route;
    delete query.path;
    return query;
  }
  return Object.fromEntries(new URL(req.url, "http://localhost").searchParams);
}

function sanitizeParams(route, query) {
  const allowed = new Set(route.params);
  const out = {};
  for (const [rawKey, rawValue] of Object.entries(query || {})) {
    const key = snakeToCamel(rawKey);
    if (!allowed.has(key)) continue;
    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    if (value == null || value === "") continue;
    const text = String(value);
    if (!PARAM_LIMITS[key].test(text)) {
      throw new Error(`Invalid ${key}`);
    }
    out[key] = text;
  }
  for (const key of route.required || []) {
    if (!out[key]) throw new Error(`Missing ${key}`);
  }
  if (out.size && Number(out.size) > 50) out.size = "50";
  if (out.limit && Number(out.limit) > 300) out.limit = "300";
  return out;
}

function proxyDispatcher() {
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
  return proxy ? new ProxyAgent(proxy) : undefined;
}

export function marketFetch(url, options) {
  const dispatcher = proxyDispatcher();
  if (dispatcher) return signedFetch(url, { ...options, dispatcher });
  return fetch(url, options);
}

function allowedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return "*";
  try {
    return new URL(origin).host === req.headers.host ? origin : "";
  } catch {
    return "";
  }
}

export function nodeToVercel(req, res) {
  const wrapper = {
    status(code) {
      res.statusCode = code;
      return wrapper;
    },
    setHeader(key, value) {
      res.setHeader(key, value);
      return wrapper;
    },
    json(value) {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(value));
      return wrapper;
    },
    send(value) {
      res.end(value);
      return wrapper;
    },
    end() {
      res.end();
      return wrapper;
    },
  };
  return wrapper;
}

export default async function handler(req, res) {
  const origin = allowedOrigin(req);
  if (!origin) return res.status(403).json({ error: "Origin not allowed" });
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (!ALLOWED_METHODS.has(req.method)) return res.status(405).json({ error: "Method not allowed" });

  const { apiKey, apiSecret } = credentials();
  if (!apiKey || !apiSecret) {
    const missing = [!apiKey && "BINANCE_KEY", !apiSecret && "BINANCE_SECRET"].filter(Boolean).join(" 和 ");
    return res.status(503).json({
      error: "Binance Web3 API is not configured",
      detail: `缺少 ${missing}。按 Binance Web3 Authentication 文档，每个请求都要用 Secret Key 做 HMAC-SHA256 签名（X-OC-APIKEY / X-OC-TIMESTAMP / X-OC-SIGN）。把密钥写进 lifi-demos/demo4-lifi-widget/.env.local，不要加 VITE_ 前缀。`,
    });
  }

  const name = requestRoute(req);
  const route = ROUTES[name];
  if (!route) return res.status(404).json({ error: "Unknown Binance market route" });

  let params;
  try {
    params = sanitizeParams(route, requestQuery(req));
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  const query = encodeQuery(params);
  const timestamp = isoTimestamp();
  const signature = buildSignature({
    secret: apiSecret,
    timestamp,
    method: "GET",
    path: route.path,
    query,
  });
  const url = `${UPSTREAM}${route.path}${query ? `?${query}` : ""}`;

  try {
    const upstream = await marketFetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        "X-OC-APIKEY": apiKey,
        "X-OC-TIMESTAMP": timestamp,
        "X-OC-SIGN": signature,
        "X-OC-RECV-WINDOW": DEFAULT_RECV_WINDOW,
      },
    });
    const payload = Buffer.from(await upstream.arrayBuffer());
    res.status(upstream.status);
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    res.setHeader("Cache-Control", "no-store");
    return res.send(payload);
  } catch {
    return res.status(502).json({ error: "Binance Market API unavailable" });
  }
}
