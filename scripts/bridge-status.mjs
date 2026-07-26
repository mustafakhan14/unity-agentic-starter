#!/usr/bin/env node

import { access, readFile, realpath } from "node:fs/promises";
import { accessSync, constants as fsConstants } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  chooseProvider,
  validateRegistry,
} from "./lib/bridge-policy.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultProjectRoot = path.resolve(scriptDirectory, "..");

function parseArguments(argv) {
  const options = {
    json: false,
    staticOnly: false,
    capability: null,
    projectRoot: process.env.BRIDGE_PROJECT_ROOT ?? defaultProjectRoot,
  };

  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (argument === "--json") {
      options.json = true;
    } else if (argument === "--static") {
      options.staticOnly = true;
    } else if (argument === "--recommend") {
      options.capability = argv[++index];
      if (!options.capability) {
        throw new Error("--recommend requires a capability name");
      }
    } else if (argument === "--project-root") {
      options.projectRoot = argv[++index];
      if (!options.projectRoot) {
        throw new Error("--project-root requires a path");
      }
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return options;
}

async function exists(target, mode = fsConstants.F_OK) {
  try {
    await access(target, mode);
    return true;
  } catch {
    return false;
  }
}

function findOnPath(command) {
  for (const directory of (process.env.PATH ?? "").split(path.delimiter)) {
    if (!directory) continue;
    const candidate = path.join(directory, command);
    try {
      accessSync(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      // Continue looking through PATH.
    }
  }
  return null;
}

async function inspectGladeKit(provider, manifest, projectRoot, staticOnly) {
  const packageName = provider.detection.manifestPackage;
  const packageVersion = manifest.dependencies?.[packageName] ?? null;
  const clientPath = findOnPath(provider.detection.clientCommand);
  const base = {
    installed: Boolean(packageVersion && clientPath),
    packageVersion,
    clientPath,
    live: false,
    available: false,
  };

  if (!packageVersion) {
    return { ...base, reason: `${packageName} is not in Packages/manifest.json` };
  }
  if (!clientPath) {
    return { ...base, reason: `${provider.detection.clientCommand} is not on PATH` };
  }
  if (staticOnly) {
    return { ...base, available: true, reason: "package and MCP client are installed" };
  }

  const healthUrl = process.env.GLADEKIT_BRIDGE_HEALTH_URL ?? provider.detection.healthUrl;
  try {
    const response = await fetch(healthUrl, { signal: AbortSignal.timeout(2500) });
    if (!response.ok) {
      return { ...base, reason: `health endpoint returned HTTP ${response.status}` };
    }
    const health = await response.json();
    const expectedRoot = await realpath(projectRoot);
    const actualRoot = await realpath(path.resolve(health.projectPath));
    if (actualRoot !== expectedRoot) {
      return {
        ...base,
        live: true,
        reason: `bridge targets ${actualRoot}, expected ${expectedRoot}`,
        health,
      };
    }
    if (health.status !== "ok" || health.isCompiling) {
      return {
        ...base,
        live: true,
        reason: `bridge is not ready: status=${health.status} compiling=${health.isCompiling}`,
        health,
      };
    }
    return {
      ...base,
      live: true,
      available: true,
      reason: `live on ${healthUrl}`,
      health,
    };
  } catch (error) {
    return { ...base, reason: `bridge health unavailable: ${error.message}` };
  }
}

async function inspectOfficialUnity(provider, manifest, officialReady) {
  const packageName = provider.detection.manifestPackage;
  const packageVersion = manifest.dependencies?.[packageName] ?? null;
  const relayPath =
    process.env[provider.detection.relayEnvironmentVariable] ??
    path.join(homedir(), provider.detection.relayPathFromHome);
  const relayPresent = await exists(relayPath, fsConstants.X_OK);
  const available = Boolean(packageVersion && relayPresent && officialReady);

  let reason;
  if (!packageVersion) {
    reason = `${packageName} is not installed; official MCP remains opt-in`;
  } else if (!relayPresent) {
    reason = `relay is missing or not executable at ${relayPath}`;
  } else if (!officialReady) {
    reason = "package and relay are present; set UNITY_MCP_READY=1 only after connection approval and live smoke";
  } else {
    reason = "package, relay, approval, and live-smoke assertion are present";
  }

  return {
    installed: Boolean(packageVersion),
    packageVersion,
    relayPath,
    relayPresent,
    readyAssertion: officialReady,
    live: null,
    available,
    reason,
  };
}

function formatHumanReport(report) {
  const lines = [
    `Unity bridge policy ${report.policyVersion}`,
    `Project: ${report.projectRoot}`,
    "",
    "Providers:",
  ];

  for (const [providerName, status] of Object.entries(report.providers)) {
    lines.push(
      `- ${providerName}: ${status.available ? "available" : "unavailable"} (${status.reason})`,
    );
  }

  if (report.recommendation) {
    const recommendation = report.recommendation;
    lines.push("", `Route: ${recommendation.capability} [${recommendation.mode}]`);
    lines.push(`- owner: ${recommendation.selected ?? "none"}`);
    if (recommendation.verifier) {
      lines.push(`- read-only verifier: ${recommendation.verifier}`);
    }
  } else {
    lines.push("", "Use --recommend <capability> to select a route.");
  }

  return lines.join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const projectRoot = await realpath(path.resolve(options.projectRoot));
  const registryPath = path.join(projectRoot, "config/unity-bridge-registry.json");
  const manifestPath = path.join(projectRoot, "Packages/manifest.json");
  const registry = validateRegistry(JSON.parse(await readFile(registryPath, "utf8")));
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

  const providers = {
    gladekit: await inspectGladeKit(
      registry.providers.gladekit,
      manifest,
      projectRoot,
      options.staticOnly,
    ),
    unity_official: await inspectOfficialUnity(
      registry.providers.unity_official,
      manifest,
      process.env[registry.providers.unity_official.detection.readinessEnvironmentVariable] === "1",
    ),
    filesystem: {
      available: true,
      installed: true,
      live: true,
      reason: "repository root is readable",
    },
    manual_editor: {
      available: true,
      installed: true,
      live: null,
      reason: "manual fallback is always permitted",
    },
  };

  const report = {
    schemaVersion: registry.schemaVersion,
    policyVersion: registry.policyVersion,
    projectRoot,
    staticOnly: options.staticOnly,
    safety: registry.safety,
    providers,
    recommendation: options.capability
      ? chooseProvider(registry, options.capability, providers)
      : null,
  };

  if (options.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`${formatHumanReport(report)}\n`);
  }
}

main().catch((error) => {
  console.error(`bridge status failed: ${error.message}`);
  process.exitCode = 1;
});
