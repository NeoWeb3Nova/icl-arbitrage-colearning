import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import handler, {
  buildSignature,
  encodeQuery,
  isoTimestamp,
  requestQuery,
  requestRoute,
  snakeToCamel,
} from "../api/binance.js";

function response() {
  return {
    code: 200,
    headers: {},
    status(code) { this.code = code; return this; },
    setHeader(key, value) { this.headers[key] = value; },
    json(value) { this.body = value; return this; },
    send(value) { this.body = value; return this; },
    end() { return this; },
  };
}

test("encodes query params as camelCase with percent-encoding", () => {
  assert.equal(snakeToCamel("binance_chain_id"), "binanceChainId");
  assert.equal(
    encodeQuery({ binance_chain_id: "1", token_contract_address: "0xabc" }),
    "binanceChainId=1&tokenContractAddress=0xabc",
  );
  assert.equal(encodeQuery({ search: "ETH USDT" }), "search=ETH%20USDT");
});

test("builds HMAC-SHA256 signatures per Binance Web3 auth docs", () => {
  const timestamp = "2026-05-11T10:08:57.715Z";
  const signature = buildSignature({
    secret: "test-secret",
    timestamp,
    method: "GET",
    path: "/api/v1/dex/market/price",
    query: "chainId=1&symbol=ETH%20USDT",
  });
  const preHash = "2026-05-11T10:08:57.715ZGET/build/api/v1/dex/market/price?chainId=1&symbol=ETH%20USDT";
  assert.equal(
    signature,
    createHmac("sha256", "test-secret").update(preHash, "utf8").digest("base64"),
  );
});

test("omits the question mark when the query string is empty", () => {
  const timestamp = "2026-06-03T10:20:30.123Z";
  const signature = buildSignature({
    secret: "test-secret",
    timestamp,
    method: "GET",
    path: "/api/v1/dex/market/supported/chain",
  });
  const preHash = "2026-06-03T10:20:30.123ZGET/build/api/v1/dex/market/supported/chain";
  assert.equal(
    signature,
    createHmac("sha256", "test-secret").update(preHash, "utf8").digest("base64"),
  );
});

test("parses rewritten and raw /api/binance routes", () => {
  assert.equal(requestRoute({ query: { route: "hot-tokens" }, url: "/api/binance?route=hot-tokens" }), "hot-tokens");
  assert.equal(
    requestRoute({ query: {}, url: "/api/binance/candles?binanceChainId=1" }),
    "candles",
  );
  assert.deepEqual(
    requestQuery({ url: "/api/binance/search?chains=1,56&search=USDT" }),
    { chains: "1,56", search: "USDT" },
  );
});

test("formats timestamps with milliseconds", () => {
  assert.match(isoTimestamp(new Date("2026-05-11T10:08:57.715Z")), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
});

test("rejects unsupported methods and unknown routes", async () => {
  const denied = response();
  await handler({ method: "POST", url: "/api/binance/chains", headers: { host: "localhost" }, query: {} }, denied);
  assert.equal(denied.code, 405);

  process.env.BINANCE_KEY = "test-key";
  process.env.BINANCE_SECRET = "test-secret";
  const missing = response();
  await handler({ method: "GET", url: "/api/binance/swap", headers: { host: "localhost" }, query: { route: "swap" } }, missing);
  assert.equal(missing.code, 404);
  delete process.env.BINANCE_KEY;
  delete process.env.BINANCE_SECRET;
});

test("requires both API key and secret without leaking them", async () => {
  delete process.env.BINANCE_KEY;
  delete process.env.BINANCE_SECRET;
  const res = response();
  await handler({ method: "GET", url: "/api/binance/chains", headers: { host: "localhost" }, query: {} }, res);
  assert.equal(res.code, 503);
  assert.match(res.body.detail, /BINANCE_KEY 和 BINANCE_SECRET/);
  assert.equal(JSON.stringify(res.body).includes("test-secret"), false);
});

test("injects signed headers and does not return the secret", async (t) => {
  const proxyVars = ["HTTPS_PROXY", "https_proxy", "HTTP_PROXY", "http_proxy"];
  const savedProxy = Object.fromEntries(proxyVars.map((key) => [key, process.env[key]]));
  for (const key of proxyVars) delete process.env[key];
  t.after(() => {
    delete process.env.BINANCE_KEY;
    delete process.env.BINANCE_SECRET;
    delete globalThis.fetch;
    for (const [key, value] of Object.entries(savedProxy)) {
      if (value == null) delete process.env[key];
      else process.env[key] = value;
    }
  });
  process.env.BINANCE_KEY = "test-key";
  process.env.BINANCE_SECRET = "test-secret";
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), "https://web3.binance.com/build/api/v1/dex/market/token/hot-token?binanceChainId=1&rankBy=4&rankingTimeFrame=3&size=20");
    assert.equal(options.headers["X-OC-APIKEY"], "test-key");
    assert.match(options.headers["X-OC-TIMESTAMP"], /^\d{4}-\d{2}-\d{2}T/);
    assert.equal(options.headers["X-OC-RECV-WINDOW"], "15000");
    const expected = buildSignature({
      secret: "test-secret",
      timestamp: options.headers["X-OC-TIMESTAMP"],
      method: "GET",
      path: "/api/v1/dex/market/token/hot-token",
      query: "binanceChainId=1&rankBy=4&rankingTimeFrame=3&size=20",
    });
    assert.equal(options.headers["X-OC-SIGN"], expected);
    return new Response('{"code":0,"msg":"success","data":{"items":[]}}', {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  const res = response();
  await handler({
    method: "GET",
    url: "/api/binance/hot-tokens?binanceChainId=1&rankBy=4&rankingTimeFrame=3&size=20",
    headers: { host: "localhost" },
    query: { route: "hot-tokens", binanceChainId: "1", rankBy: "4", rankingTimeFrame: "3", size: "20" },
  }, res);
  assert.equal(res.code, 200);
  assert.equal(res.body.toString(), '{"code":0,"msg":"success","data":{"items":[]}}');
  assert.equal(res.body.toString().includes("test-secret"), false);
});
