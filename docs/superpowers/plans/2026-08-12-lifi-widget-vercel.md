# LI.FI Widget Vercel Implementation Plan

> **For agentic workers:** Execute inline and keep the diff minimal. Do not touch unrelated uncommitted article files.

**Goal:** Deploy the existing LI.FI Widget demo as an EVM-only public Vercel app with a server-private LI.FI API key.

**Architecture:** Vite renders `@lifi/widget-light`; its API traffic targets one same-project Vercel Function, which adds `LIFI_API_KEY` and forwards to the fixed LI.FI API host. Wallet operations stay in the user's injected wallet.

**Tech Stack:** React 19, Vite, LI.FI Widget Light, Wagmi/Viem, Vercel Functions.

---

### Task 1: Upgrade the existing demo

- [ ] Replace the existing full Widget entry with the official Widget Light EVM handler pattern.
- [ ] Add only the dependencies required by the official EVM-only example.
- [ ] Add minimal responsive styling and truthful transaction-risk copy.

### Task 2: Add the server-private proxy

- [ ] Add a catch-all Vercel Function with fixed upstream, method checks, body limit, CORS, and secret-header injection.
- [ ] Add one Node standard-library test for proxy boundaries.
- [ ] Configure Vercel rewrites/function routing without affecting `/api`.

### Task 3: Verify locally

- [ ] Install dependencies and run the proxy test.
- [ ] Run the Vite production build.
- [ ] Assert `LIFI_API_KEY` does not occur in `dist/`.
- [ ] Run a local preview and inspect the rendered Widget plus browser console.

### Task 4: Deploy and verify

- [ ] Authenticate Vercel if needed.
- [ ] Link a dedicated Vercel project from `lifi-demos/demo4-lifi-widget/`.
- [ ] Copy only `LIFI_API_KEY` into Vercel Production and Preview environments.
- [ ] Deploy production and verify the app and `/api/lifi/chains` over HTTPS.
- [ ] Browser-check the stable production URL without signing or broadcasting.

### Task 5: Document

- [ ] Add concise run/deploy/security instructions in the subproject README.
- [ ] Link the deployed Widget from the repository README without altering unrelated article edits.
- [ ] Run `git diff --check` and report exact changed paths; do not commit or push unless requested.
