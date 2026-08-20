import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import binanceHandler, { nodeToVercel } from "./api/binance.js";

function applyEnv(mode, directory) {
  const env = loadEnv(mode, directory, "");
  for (const key of ["BINANCE_KEY", "BINANCE_SECRET", "BINANCE_API_KEY", "BINANCE_API_SECRET"]) {
    if (env[key] && !process.env[key]) process.env[key] = env[key];
  }
  if (!process.env.VITE_SUPABASE_URL) {
    process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "";
  }
  if (!process.env.VITE_SUPABASE_ANON_KEY) {
    process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_PUBLISHABLE_KEY || "";
  }
}

function binanceDevApi() {
  return {
    name: "binance-dev-api",
    config(_, { mode }) {
      applyEnv(mode, process.cwd());
      applyEnv(mode, resolve(process.cwd(), "../.."));
    },
    configureServer(server) {
      server.middlewares.use("/api/binance", async (req, res) => {
        req.url = req.originalUrl || req.url;
        try {
          await binanceHandler(req, nodeToVercel(req, res));
        } catch {
          res.statusCode = 502;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Binance Market API unavailable" }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), binanceDevApi()],
  server: {
    port: 5173,
    open: false,
  },
});
