import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  UnityTestResultsError,
  assertUnityTestResultsPassed,
  parseUnityTestResults,
} from "../../scripts/lib/unity-test-results.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const verifier = path.join(repoRoot, "scripts/verify-unity.sh");

function resultXml({
  result = "Passed",
  total = 1,
  passed = 1,
  failed = 0,
  warnings,
  inconclusive = 0,
  skipped = 0,
} = {}) {
  const warningAttribute = warnings === undefined ? "" : ` warnings="${warnings}"`;
  return `<?xml version="1.0" encoding="utf-8"?>
<test-run result="${result}" total="${total}" passed="${passed}" failed="${failed}"${warningAttribute} inconclusive="${inconclusive}" skipped="${skipped}"></test-run>
`;
}

function expectResultError(xml, exitCode) {
  let summary;
  let error;

  try {
    summary = parseUnityTestResults(xml, "fixture.xml");
    assertUnityTestResultsPassed(summary, "fixture.xml");
  } catch (caught) {
    error = caught;
  }

  assert.ok(error instanceof UnityTestResultsError);
  assert.equal(error.exitCode, exitCode);
}

test("accepts a fresh, fully passing Unity test run", () => {
  const summary = parseUnityTestResults(resultXml(), "fixture.xml");
  assertUnityTestResultsPassed(summary, "fixture.xml");
  assert.deepEqual(summary, {
    result: "Passed",
    total: 1,
    passed: 1,
    failed: 0,
    warnings: 0,
    inconclusive: 0,
    skipped: 0,
  });
});

test("rejects empty, malformed, and inconsistent Unity result evidence", () => {
  expectResultError("", 72);
  expectResultError("<not-test-run />", 72);
  expectResultError(resultXml({ total: 2, passed: 1 }), 72);
});

test("rejects failed, warning, inconclusive, skipped, and zero-test runs", () => {
  expectResultError(resultXml({ result: "Failed", passed: 0, failed: 1 }), 1);
  expectResultError(resultXml({ warnings: 1 }), 1);
  expectResultError(resultXml({ result: "Inconclusive", passed: 0, inconclusive: 1 }), 1);
  expectResultError(resultXml({ result: "Skipped", passed: 0, skipped: 1 }), 1);
  expectResultError(resultXml({ total: 0, passed: 0 }), 1);
});

const fakeUnitySource = `#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const args = process.argv.slice(2);
function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

const logFile = valueAfter("-logFile");
const resultFile = valueAfter("-testResults");
const scenario = process.env.FAKE_UNITY_SCENARIO || "pass";

if (logFile) {
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.writeFileSync(logFile, "fake Unity invocation\\n");
}

if (scenario === "license") {
  fs.appendFileSync(logFile, "Failed to connect to LicenseClient\\n");
  process.exit(0);
}

if (scenario === "editor-open") {
  fs.appendFileSync(logFile, "another Unity instance is running with this project open\\n");
  process.exit(0);
}

if (!resultFile || scenario === "no-results") {
  process.exit(0);
}

fs.mkdirSync(path.dirname(resultFile), { recursive: true });
if (scenario === "failed-results") {
  fs.writeFileSync(resultFile, '<test-run result="Failed" total="1" passed="0" failed="1" inconclusive="0" skipped="0"></test-run>\\n');
} else {
  fs.writeFileSync(resultFile, '<test-run result="Passed" total="1" passed="1" failed="0" inconclusive="0" skipped="0"></test-run>\\n');
}
`;

function runVerifier(t, scenario, { seedStaleResults = false } = {}) {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "unity-verifier-test-"));
  t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));

  const artifactRoot = path.join(fixtureRoot, "Logs");
  const fakeUnity = path.join(fixtureRoot, "fake-unity");
  fs.writeFileSync(fakeUnity, fakeUnitySource);
  fs.chmodSync(fakeUnity, 0o755);

  if (seedStaleResults) {
    const resultsDir = path.join(artifactRoot, "TestResults");
    fs.mkdirSync(resultsDir, { recursive: true });
    fs.writeFileSync(path.join(resultsDir, "editmode-results.xml"), resultXml());
    fs.writeFileSync(path.join(resultsDir, "playmode-results.xml"), resultXml());
  }

  return spawnSync(verifier, [], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      FAKE_UNITY_SCENARIO: scenario,
      UNITY_BIN: fakeUnity,
      UNITY_VERIFY_ARTIFACT_ROOT: artifactRoot,
      UNITY_POLL_INTERVAL_SECONDS: "0.02",
      UNITY_TIMEOUT_SECONDS: "5",
    },
    timeout: 20_000,
  });
}

test("verifier accepts fresh EditMode and PlayMode evidence from Unity", (t) => {
  const run = runVerifier(t, "pass");
  assert.equal(run.status, 0, run.stderr || run.stdout);
  assert.match(run.stdout, /Unity verification passed\./);
  assert.match(run.stdout, /EditMode: result=Passed total=1 passed=1/);
  assert.match(run.stdout, /PlayMode: result=Passed total=1 passed=1/);
});

test("verifier rejects seeded stale XML when Unity writes no new result", (t) => {
  const run = runVerifier(t, "no-results", { seedStaleResults: true });
  assert.equal(run.status, 72, run.stderr || run.stdout);
  assert.match(run.stderr, /test results were not written/);
});

test("verifier propagates a genuine Unity test failure", (t) => {
  const run = runVerifier(t, "failed-results");
  assert.equal(run.status, 1, run.stderr || run.stdout);
  assert.match(run.stderr, /Unity tests did not fully pass/);
});

test("verifier reports licensing initialization failures distinctly", (t) => {
  const run = runVerifier(t, "license");
  assert.equal(run.status, 70, run.stderr || run.stdout);
  assert.match(run.stderr, /Unity licensing is not ready for batchmode/);
});

test("verifier reports a concurrently open Unity project distinctly", (t) => {
  const run = runVerifier(t, "editor-open");
  assert.equal(run.status, 71, run.stderr || run.stdout);
  assert.match(run.stderr, /Unity Editor already has this project open/);
});
