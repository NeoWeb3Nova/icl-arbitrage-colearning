# LI.FI Widget Vercel Design

## Goal

Upgrade the existing `lifi-demos/demo4-lifi-widget/` demo into a public EVM-only LI.FI Widget that shows live routes and lets the connected wallet manually approve, sign, and broadcast swaps or bridges without a local backend.

## Architecture

- Reuse the existing Vite/React demo directory; do not create another app tree.
- Use `@lifi/widget-light` for the hosted Widget UI and its EVM Wagmi handler for wallet access.
- Set Widget `sdkConfig.apiUrl` to this deployment's `/api/lifi` endpoint.
- Use one Vercel catch-all Function to proxy only LI.FI API requests to `https://li.quest/v1`, adding `LIFI_API_KEY` from the server environment.
- Keep the API key out of Vite variables, HTML, JavaScript bundles, logs, and responses.
- Wallet approval, chain switching, signing, and broadcasting remain explicit user-wallet actions. The app never stores wallet keys or signs automatically.

## Scope

- EVM chains supported by LI.FI, including Ethereum, Arbitrum, Base, Optimism, and Polygon.
- Default route: Ethereum native ETH to Arbitrum USDC.
- Chinese-first, light, compact page with a clear execution-risk notice.
- Buildable locally and deployable as its own Vercel project rooted at `lifi-demos/demo4-lifi-widget/`.

## Security boundary

- The proxy has a fixed upstream host and cannot proxy arbitrary URLs.
- Only `GET` and `POST` are accepted; request bodies are size-limited.
- Browser-facing CORS is restricted to the deployed site and LI.FI's hosted Widget origin where required.
- `.env.local`, `.vercel/`, and secrets remain untracked.
- The public proxy protects the key from disclosure but cannot fully prevent public visitors from consuming its quota. Add stronger rate limiting only if real abuse appears.

## Verification

- Build succeeds.
- One minimal proxy test proves method rejection, upstream path construction, and secret-header injection without printing the secret.
- Production bundle does not contain the API key.
- Local browser renders the Widget without application console errors.
- Online deployment returns the app and the proxied LI.FI chains endpoint successfully.
- Verification does not approve, sign, or broadcast a transaction.

## Non-goals

No database, custom swap engine, arbitrage signal panel, automatic execution, custodial wallet, non-EVM wallet support, or platform fee.
