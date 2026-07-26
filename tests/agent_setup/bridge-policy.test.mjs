import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  chooseProvider,
  isToolForbidden,
  validateRegistry,
} from "../../scripts/lib/bridge-policy.mjs";

const registry = JSON.parse(
  await readFile(new URL("../../config/unity-bridge-registry.json", import.meta.url)),
);

const allAvailable = Object.fromEntries(
  Object.keys(registry.providers).map((providerName) => [
    providerName,
    { available: true, reason: "test fixture" },
  ]),
);

test("registry routes reference declared provider capabilities", () => {
  assert.equal(validateRegistry(registry), registry);
});

test("routine hierarchy inspection selects GladeKit", () => {
  const route = chooseProvider(registry, "hierarchy_inspection", allAvailable);
  assert.equal(route.selected, "gladekit");
  assert.equal(route.verifier, "unity_official");
  assert.equal(route.mode, "read");
});

test("official Unity MCP owns native capture when available", () => {
  const route = chooseProvider(registry, "screenshot_capture", allAvailable);
  assert.equal(route.selected, "unity_official");
  assert.equal(route.verifier, null);
});

test("manual Editor capture is the fallback without official Unity MCP", () => {
  const status = {
    ...allAvailable,
    unity_official: { available: false, reason: "not installed" },
  };
  const route = chooseProvider(registry, "screenshot_capture", status);
  assert.equal(route.selected, "manual_editor");
});

test("mutation routes have one owner and no cross-bridge verifier", () => {
  const route = chooseProvider(registry, "scene_mutation", allAvailable);
  assert.equal(route.selected, "gladekit");
  assert.equal(route.verifier, null);
  assert.equal(route.mode, "mutation");
});

test("unavailable providers are preserved in recommendation evidence", () => {
  const status = {
    ...allAvailable,
    gladekit: { available: false, reason: "Editor closed" },
  };
  const route = chooseProvider(registry, "console_access", status);
  assert.equal(route.selected, "unity_official");
  assert.equal(route.candidates[0].reason, "Editor closed");
});

test("unknown capabilities fail closed", () => {
  assert.throws(
    () => chooseProvider(registry, "telepathy", allAvailable),
    /Unknown bridge capability/,
  );
});

test("asset generation tools remain forbidden", () => {
  assert.equal(
    isToolForbidden(registry, "Unity_AssetGeneration_GenerateAsset"),
    true,
  );
  assert.equal(isToolForbidden(registry, "Unity_GetConsoleLogs"), false);
});

test("promotion gate remains conservative", () => {
  assert.ok(registry.promotionPolicy.minimumReadSamples >= 50);
  assert.ok(registry.promotionPolicy.minimumUndoMutationSamples >= 10);
  assert.equal(registry.promotionPolicy.requireHumanApprovalForDefaultChange, true);
});

test("mutation ownership is mandatory", () => {
  const invalid = structuredClone(registry);
  invalid.safety.singleMutationOwner = false;
  assert.throws(() => validateRegistry(invalid), /one mutation owner/);
});

test("read verifier must declare the routed capability", () => {
  const invalid = structuredClone(registry);
  invalid.routes.hierarchy_inspection.verifyWith = ["filesystem"];
  assert.throws(
    () => validateRegistry(invalid),
    /filesystem cannot verify capability hierarchy_inspection/,
  );
});
