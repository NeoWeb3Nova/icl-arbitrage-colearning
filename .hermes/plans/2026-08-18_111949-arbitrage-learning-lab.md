# Arbitrage Learning Lab Website Implementation Plan

> **For Hermes:** Implement this plan task-by-task from GitHub Issue #1. Do not expand scope without updating the Spec issue.

**Goal:** Extend the existing Vite + React LI.FI Widget into a workflow-first arbitrage learning lab that replays the first read-only Paper Trading case with a desktop canvas + Inspector and a mobile Stepper.

**Architecture:** Keep the existing Vite/React app, LI.FI Widget, Wagmi/Viem wallet boundary, and server-private proxy. Add a data-driven workflow definition and an evidence snapshot adapter. Render one fixed workflow with CSS/SVG; keep the rendering seam independent from live LI.FI requests. On mobile, render the same workflow as a vertical Stepper.

**Tech Stack:** Vite, React 19, existing LI.FI Widget Light, Wagmi/Viem, Node built-in test runner, CSS/SVG, JSON evidence snapshots.

**Spec:** GitHub Issue #1 — https://github.com/NeoWeb3Nova/icl-arbitrage-colearning/issues/1

---

## Task 1: Establish the deterministic workflow data seam

**Objective:** Create a pure JavaScript workflow definition that contains the experiment steps, statuses, explanations, prerequisites, failure conditions, and evidence reference without importing React.

**Files:**
- Create: `lifi-demos/demo4-lifi-widget/src/workflows/eth-usdc-eth.js`
- Create: `lifi-demos/demo4-lifi-widget/test/workflow.test.js`

**Implementation:**

- Export one `ETH_USDC_ETH_WORKFLOW` object.
- Use canonical node kinds: `context`, `input`, `quote`, `check`, `compute`, `decision`, `evidence`.
- Include the ordered nodes:
  1. experiment goal
  2. prerequisites
  3. initial input
  4. first-leg quote
  5. continuity check
  6. theoretical second-leg quote
  7. conservative second-leg quote
  8. fee/Gas interpretation
  9. result calculation
  10. execution decision
  11. evidence archive
- Include canonical statuses: `completed`, `rejected`, and `read-only`.
- Keep raw integer-unit values and human display values separate.
- Encode the known conclusion: theoretical and conservative round trips are negative; execution decision is `rejected`.
- Include the evidence path `outputs/20260818-lifi-paper-trade.json` as provenance metadata.

**Verification:**

Run from `lifi-demos/demo4-lifi-widget/`:

```bash
node --test test/workflow.test.js
```

The test must verify:

- node IDs are unique;
- edge endpoints exist;
- node order is deterministic;
- the second-leg theoretical input equals the first-leg theoretical output;
- the second-leg conservative input equals the first-leg conservative minimum output;
- the final decision is rejected;
- the workflow is explicitly read-only.

---

## Task 2: Make the evidence snapshot available to the static app

**Objective:** Serve the existing verified Paper Trading evidence as a public, read-only static artifact without exposing any API key.

**Files:**
- Create: `lifi-demos/demo4-lifi-widget/public/evidence/20260818-lifi-paper-trade.json`
- Modify: `lifi-demos/demo4-lifi-widget/src/workflows/eth-usdc-eth.js` only if the browser-facing evidence URL needs a separate field.

**Implementation:**

- Copy the verified JSON evidence snapshot from the repository output into the app's public evidence directory.
- Do not alter raw provider responses.
- Do not copy `.env` files, API keys, wallet credentials, or transaction signing data.
- Keep the evidence label explicit: read-only quote simulation, no signing, no broadcast.

**Verification:**

```bash
python3 -m json.tool public/evidence/20260818-lifi-paper-trade.json >/dev/null
```

Confirm the file contains no `LIFI_API_KEY` value and that the raw responses remain parseable.

---

## Task 3: Add the workflow canvas and Inspector UI

**Objective:** Render the workflow as a selectable desktop canvas with a truthful node Inspector.

**Files:**
- Modify: `lifi-demos/demo4-lifi-widget/src/main.jsx`
- Modify: `lifi-demos/demo4-lifi-widget/src/styles.css`

**Implementation:**

- Preserve the existing wallet connection and LI.FI Widget behavior.
- Add a simple app shell with two accessible sections: `实验工作流` and `LI.FI 工具`.
- Make `实验工作流` the default view.
- Render the workflow nodes in order with CSS/SVG connectors; do not add React Flow or n8n.
- Use a selected-node state initialized to the first meaningful experiment node.
- Clicking a node updates the Inspector without re-running the experiment.
- The Inspector must show:
  - node title and status;
  - why this step exists;
  - prerequisites/context;
  - inputs;
  - outputs;
  - evidence reference;
  - failure conditions;
  - next step.
- Show a prominent top-level result banner: `保守往返结果为负 · 明确否定信号 · 不执行`.
- Show a read-only notice: no signing, no broadcast, no custody, and no realized-profit claim.
- Keep the LI.FI Widget under the separate tools view and preserve its manual wallet boundary.

**Accessibility:**

- Use semantic headings and buttons for selectable nodes.
- Use `aria-current` or `aria-pressed` for the selected node.
- Keep visible status text; do not rely on color alone.
- Provide an `aria-live="polite"` region for Inspector selection changes.
- Make all nodes reachable by keyboard.

**Verification:**

```bash
npm run build
npm test
```

Expected: build succeeds and existing proxy tests plus workflow tests pass.

---

## Task 4: Add the mobile Stepper representation

**Objective:** Make the same workflow readable on small screens without requiring horizontal canvas interaction.

**Files:**
- Modify: `lifi-demos/demo4-lifi-widget/src/main.jsx`
- Modify: `lifi-demos/demo4-lifi-widget/src/styles.css`

**Implementation:**

- Use CSS media queries to switch the desktop canvas into a vertical ordered Stepper.
- Keep the same node data, statuses, selection behavior, and Inspector content.
- Do not create a second mobile-specific workflow definition.
- Preserve keyboard focus and visible selected state.
- Ensure long hashes, evidence paths, and API values wrap rather than clipping.

**Verification:**

- Run the production build.
- Use a browser smoke check at a desktop viewport and a narrow mobile viewport.
- Verify all workflow nodes remain reachable and the final decision remains visible.

---

## Task 5: Add content/evidence documentation

**Objective:** Document the new workflow-first lab and its evidence boundary for future contributors.

**Files:**
- Modify: `lifi-demos/demo4-lifi-widget/README.md` (create only if absent)
- Modify: repository `README.md` only to add a concise link if the existing structure has an appropriate location.

**Implementation:**

- Explain the difference between knowledge content, Paper Trading, live read-only quotes, and real transactions.
- Explain how to add a future workflow case by adding a definition plus an evidence snapshot.
- State that LI.FI quotes are not arbitrage opportunities and that a negative result is a valid experiment outcome.
- Document local run, build, test, and Vercel deployment commands.
- Do not claim deployment or publication unless a verifiable URL is produced.

**Verification:**

```bash
git diff --check
npm test
npm run build
```

---

## Task 6: End-to-end verification and scope review

**Objective:** Verify the delivered artifact against GitHub Issue #1 and record exact results.

**Verification checklist:**

- [ ] Workflow definition and evidence snapshot parse.
- [ ] Continuity assertions pass for both theoretical and conservative legs.
- [ ] Existing proxy tests pass.
- [ ] Production build passes.
- [ ] Production bundle does not contain `LIFI_API_KEY`.
- [ ] Desktop browser shows canvas + Inspector.
- [ ] Mobile browser shows vertical Stepper.
- [ ] Node selection updates Inspector content.
- [ ] Final state is visibly a negative signal and not a realized trade.
- [ ] LI.FI Widget remains available in the tools view.
- [ ] No signing or broadcast occurs during verification.
- [ ] `git diff --check` passes.
- [ ] No unrelated modified or untracked files are rewritten.

Do not commit, push, or deploy unless separately requested.
