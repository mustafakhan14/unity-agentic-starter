#!/usr/bin/env node

import fs from "node:fs";
import { pathToFileURL } from "node:url";

export class UnityTestResultsError extends Error {
  constructor(message, { exitCode = 72, summary = null } = {}) {
    super(message);
    this.name = "UnityTestResultsError";
    this.exitCode = exitCode;
    this.summary = summary;
  }
}

function parseAttributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/\s([A-Za-z-]+)="([^"]*)"/g)].map((match) => [
      match[1],
      match[2],
    ]),
  );
}

function requiredCount(attributes, name, sourceLabel) {
  const raw = attributes[name];
  if (raw === undefined || !/^(0|[1-9][0-9]*)$/.test(raw)) {
    throw new UnityTestResultsError(
      `Unity test results have an invalid ${name} count in ${sourceLabel}`,
    );
  }

  return Number(raw);
}

function optionalCount(attributes, name, sourceLabel) {
  if (attributes[name] === undefined) {
    return 0;
  }

  return requiredCount(attributes, name, sourceLabel);
}

export function parseUnityTestResults(xml, sourceLabel = "Unity test results") {
  if (typeof xml !== "string" || xml.trim().length === 0) {
    throw new UnityTestResultsError(
      `Unity test results are empty: ${sourceLabel}`,
    );
  }

  const run = xml.match(/<test-run\b[^>]*>/);
  if (!run) {
    throw new UnityTestResultsError(
      `Unity test results are missing <test-run>: ${sourceLabel}`,
    );
  }

  const attributes = parseAttributes(run[0]);
  if (!attributes.result) {
    throw new UnityTestResultsError(
      `Unity test results are missing the result attribute: ${sourceLabel}`,
    );
  }

  const summary = {
    result: attributes.result,
    total: requiredCount(attributes, "total", sourceLabel),
    passed: requiredCount(attributes, "passed", sourceLabel),
    failed: requiredCount(attributes, "failed", sourceLabel),
    warnings: optionalCount(attributes, "warnings", sourceLabel),
    inconclusive: requiredCount(attributes, "inconclusive", sourceLabel),
    skipped: requiredCount(attributes, "skipped", sourceLabel),
  };

  const categorized =
    summary.passed + summary.failed + summary.inconclusive + summary.skipped;
  if (categorized !== summary.total) {
    throw new UnityTestResultsError(
      `Unity test-result counts are inconsistent in ${sourceLabel}: total=${summary.total} categorized=${categorized}`,
      { summary },
    );
  }

  return summary;
}

export function assertUnityTestResultsPassed(summary, sourceLabel) {
  const fullyPassed =
    summary.result === "Passed" &&
    summary.total > 0 &&
    summary.passed === summary.total &&
    summary.failed === 0 &&
    summary.warnings === 0 &&
    summary.inconclusive === 0 &&
    summary.skipped === 0;

  if (!fullyPassed) {
    throw new UnityTestResultsError(
      `Unity tests did not fully pass: ${sourceLabel}`,
      { exitCode: 1, summary },
    );
  }
}

export function formatUnityTestSummary(name, summary) {
  return `${name}: result=${summary.result} total=${summary.total} passed=${summary.passed} failed=${summary.failed} warnings=${summary.warnings} inconclusive=${summary.inconclusive} skipped=${summary.skipped}`;
}

export function validateUnityTestResultsFile(name, file) {
  let xml;
  try {
    xml = fs.readFileSync(file, "utf8");
  } catch (error) {
    throw new UnityTestResultsError(
      `Unity ${name} test results could not be read: ${file}: ${error.message}`,
    );
  }

  const summary = parseUnityTestResults(xml, file);
  assertUnityTestResultsPassed(summary, file);
  return summary;
}

function runCli() {
  const [name, file] = process.argv.slice(2);
  if (!name || !file || process.argv.length !== 4) {
    console.error("Usage: unity-test-results.mjs <name> <result-file>");
    process.exitCode = 64;
    return;
  }

  try {
    const summary = validateUnityTestResultsFile(name, file);
    console.log(formatUnityTestSummary(name, summary));
  } catch (error) {
    if (error instanceof UnityTestResultsError) {
      if (error.summary) {
        console.error(formatUnityTestSummary(name, error.summary));
      }
      console.error(error.message);
      process.exitCode = error.exitCode;
      return;
    }

    throw error;
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
if (invokedPath === import.meta.url) {
  runCli();
}
