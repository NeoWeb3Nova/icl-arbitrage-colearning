const UPSTREAM = "https://li.quest/v1";
const ALLOWED_METHODS = new Set(["GET", "POST"]);
const FORWARDED_HEADERS = ["x-lifi-sdk", "x-lifi-integrator", "x-lifi-widget"];
const MAX_BODY_BYTES = 100_000;

function allowedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return "*";
  if (origin === "https://widget.li.fi") return origin;
  try {
    return new URL(origin).host === req.headers.host ? origin : "";
  } catch {
    return "";
  }
}

export function buildUpstreamUrl(query = {}) {
  const parts = Array.isArray(query.path) ? query.path : [query.path];
  if (
    !parts.length ||
    parts.some((part) =>
      !part || part === "." || part === ".." || !/^[A-Za-z0-9](?:[A-Za-z0-9._~-]*[A-Za-z0-9])?$/.test(part)
    )
  ) {
    throw new Error("Invalid LI.FI API path");
  }
  const url = new URL(`${UPSTREAM}/${parts.join("/")}`);
  for (const [key, value] of Object.entries(query)) {
    if (key === "path" || value == null) continue;
    for (const item of Array.isArray(value) ? value : [value]) url.searchParams.append(key, item);
  }
  return url;
}

export function requestQuery(req) {
  if (req.query?.path) {
    return {
      ...req.query,
      path: Array.isArray(req.query.path) ? req.query.path : req.query.path.split("/"),
    };
  }
  const url = new URL(req.url, "http://localhost");
  return {
    ...Object.fromEntries(url.searchParams),
    path: url.pathname.replace(/^\/api\/lifi\//, "").split("/"),
  };
}

export default async function handler(req, res) {
  const origin = allowedOrigin(req);
  if (!origin) return res.status(403).json({ error: "Origin not allowed" });
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Lifi-Sdk, X-Lifi-Integrator, X-Lifi-Widget");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (!ALLOWED_METHODS.has(req.method)) return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.LIFI_API_KEY) return res.status(503).json({ error: "LI.FI API is not configured" });

  let url;
  try {
    url = buildUpstreamUrl(requestQuery(req));
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  const body = req.method === "POST" ? JSON.stringify(req.body ?? {}) : undefined;
  if (body && Buffer.byteLength(body) > MAX_BODY_BYTES) {
    return res.status(413).json({ error: "Request body too large" });
  }

  try {
    const forwardedHeaders = Object.fromEntries(
      FORWARDED_HEADERS.flatMap((name) => req.headers[name] ? [[name, req.headers[name]]] : [])
    );
    const upstream = await fetch(url, {
      method: req.method,
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        ...forwardedHeaders,
        "x-lifi-api-key": process.env.LIFI_API_KEY,
      },
      body,
    });
    const payload = Buffer.from(await upstream.arrayBuffer());
    res.status(upstream.status);
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    res.setHeader("Cache-Control", "no-store");
    return res.send(payload);
  } catch {
    return res.status(502).json({ error: "LI.FI API unavailable" });
  }
}