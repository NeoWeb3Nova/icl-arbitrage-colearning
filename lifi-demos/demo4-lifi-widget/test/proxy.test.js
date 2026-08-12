import assert from "node:assert/strict";
import test from "node:test";
import handler, { buildUpstreamUrl, requestQuery } from "../api/proxy.js";

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

test("builds only a fixed LI.FI upstream URL", () => {
  assert.equal(
    buildUpstreamUrl({ path: ["advanced", "routes"], fromChainId: "1" }).href,
    "https://li.quest/v1/advanced/routes?fromChainId=1",
  );
  assert.throws(() => buildUpstreamUrl({ path: ["..", "secrets"] }), /Invalid/);
  assert.deepEqual(
    requestQuery({ url: "/api/lifi/advanced/routes?fromChainId=1" }),
    { path: ["advanced", "routes"], fromChainId: "1" },
  );
  assert.deepEqual(
    requestQuery({ query: { path: "advanced/routes", fromChainId: "1" } }),
    { path: ["advanced", "routes"], fromChainId: "1" },
  );
});

test("rejects unsupported methods", async () => {
  const res = response();
  await handler({ method: "DELETE", url: "/api/lifi/chains", headers: { host: "localhost" }, query: {} }, res);
  assert.equal(res.code, 405);
});

test("allows the Widget SDK CORS preflight", async () => {
  const res = response();
  await handler({ method: "OPTIONS", url: "/api/lifi/chains", headers: { host: "localhost", origin: "https://widget.li.fi" }, query: {} }, res);
  assert.equal(res.code, 204);
  assert.equal(res.headers["Access-Control-Allow-Headers"], "Content-Type, X-Lifi-Sdk, X-Lifi-Integrator, X-Lifi-Widget");
});

test("injects the secret header without returning it", async (t) => {
  t.after(() => { delete process.env.LIFI_API_KEY; delete globalThis.fetch; });
  process.env.LIFI_API_KEY = "test-secret";
  globalThis.fetch = async (url, options) => {
    assert.equal(url.href, "https://li.quest/v1/chains");
    assert.equal(options.headers["x-lifi-api-key"], "test-secret");
    return new Response('{"chains":[]}', { status: 200, headers: { "content-type": "application/json" } });
  };
  const res = response();
  await handler({ method: "GET", url: "/api/lifi/chains", headers: { host: "localhost", "x-lifi-sdk": "widget/4", "x-lifi-integrator": "arbitrage-research", "x-lifi-widget": "4" }, query: {} }, res);
  assert.equal(res.code, 200);
  assert.equal(res.body.toString(), '{"chains":[]}');
  assert.equal(res.body.toString().includes("test-secret"), false);
});