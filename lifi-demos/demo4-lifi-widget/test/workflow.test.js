import assert from "node:assert/strict";
import test from "node:test";
import { ETH_USDC_ETH_WORKFLOW as workflow } from "../src/workflows/eth-usdc-eth.js";

test("workflow is a deterministic, read-only connected graph", () => {
  assert.equal(workflow.mode, "read-only");
  assert.equal(new Set(workflow.nodes.map((node) => node.id)).size, workflow.nodes.length);
  const ids = new Set(workflow.nodes.map((node) => node.id));
  for (const [from, to] of workflow.edges) {
    assert.ok(ids.has(from));
    assert.ok(ids.has(to));
  }
  assert.equal(workflow.nodes.at(-1).id, "archive");
  assert.equal(workflow.nodes.find((node) => node.id === "decision").status, "rejected");
});

test("both second-leg inputs preserve first-leg continuity", () => {
  const first = workflow.nodes.find((node) => node.id === "leg-1");
  const continuity = workflow.nodes.find((node) => node.id === "continuity");
  const theoretical = workflow.nodes.find((node) => node.id === "leg-2-theoretical");
  const conservative = workflow.nodes.find((node) => node.id === "leg-2-conservative");

  assert.equal(theoretical.inputs.from, continuity.inputs.firstLegOutput);
  assert.equal(conservative.inputs.from, continuity.inputs.conservativeOutput);
  assert.equal(first.outputs.toAmount, continuity.inputs.firstLegOutput);
  assert.equal(first.outputs.toAmountMin, continuity.inputs.conservativeOutput);
});

test("the workflow preserves the negative conservative conclusion", () => {
  const result = workflow.nodes.find((node) => node.id === "result");
  const decision = workflow.nodes.find((node) => node.id === "decision");

  assert.match(result.outputs.theoretical, /^-/);
  assert.match(result.outputs.conservative, /^-/);
  assert.equal(decision.outputs.conclusion, "明确否定信号，不执行");
});
