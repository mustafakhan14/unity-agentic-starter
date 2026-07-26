#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const relayPath =
  process.env.UNITY_MCP_RELAY ??
  path.join(
    homedir(),
    ".unity/relay/relay_mac_arm64.app/Contents/MacOS/relay_mac_arm64",
  );
const outputDirectory = path.join(projectRoot, "Logs");
const reportPath = path.join(outputDirectory, "official-unity-mcp-smoke.json");
const capturePath = path.join(outputDirectory, "official-unity-mcp-capture.png");
const multiAngleCapturePath = path.join(
  outputDirectory,
  "official-unity-mcp-multi-angle.png",
);
const requestTimeoutMs = Number(process.env.UNITY_MCP_REQUEST_TIMEOUT_MS ?? 45_000);

const relay = spawn(
  relayPath,
  ["--mcp", "--project-path", projectRoot],
  {
    cwd: projectRoot,
    stdio: ["pipe", "pipe", "pipe"],
  },
);

let nextRequestId = 1;
const pendingRequests = new Map();
const relayLogs = [];
const notifications = [];

function failPendingRequests(error) {
  for (const pending of pendingRequests.values()) {
    clearTimeout(pending.timeout);
    pending.reject(error);
  }
  pendingRequests.clear();
}

function handleJsonRpcLine(line) {
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    relayLogs.push(line);
    return;
  }

  if (message.id !== undefined && pendingRequests.has(message.id)) {
    const pending = pendingRequests.get(message.id);
    pendingRequests.delete(message.id);
    clearTimeout(pending.timeout);

    if (message.error) {
      pending.reject(new Error(JSON.stringify(message.error)));
    } else {
      pending.resolve(message.result);
    }
    return;
  }

  if (message.method) {
    notifications.push(message);
  }
}

readline.createInterface({ input: relay.stdout }).on("line", handleJsonRpcLine);
readline.createInterface({ input: relay.stderr }).on("line", (line) => {
  relayLogs.push(line);
});

relay.on("error", (error) => failPendingRequests(error));
relay.on("exit", (code, signal) => {
  failPendingRequests(
    new Error(`Unity MCP relay exited with code ${code} and signal ${signal}`),
  );
});

function request(method, params = {}, timeoutMs = requestTimeoutMs) {
  const id = nextRequestId++;
  const startedAt = performance.now();

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error(`${method} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    pendingRequests.set(id, {
      resolve: (result) =>
        resolve({
          elapsedMs: performance.now() - startedAt,
          result,
        }),
      reject,
      timeout,
    });

    relay.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
  });
}

function notify(method, params = {}) {
  relay.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`);
}

function parseTextPayload(callResult) {
  const text = callResult?.content?.find((item) => item.type === "text")?.text;
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { rawText: text };
  }
}

function assertToolSucceeded(name, response) {
  const payload = parseTextPayload(response.result);
  if (response.result?.isError || payload?.success === false) {
    throw new Error(`${name} failed: ${JSON.stringify(payload)}`);
  }
  return payload;
}

async function callTool(name, args = {}, timeoutMs = requestTimeoutMs) {
  if (name.startsWith("Unity_AssetGeneration_")) {
    throw new Error(`Refusing disallowed generation tool: ${name}`);
  }

  return request(
    "tools/call",
    {
      name,
      arguments: args,
    },
    timeoutMs,
  );
}

async function runCommand(title, code, timeoutMs = requestTimeoutMs) {
  const response = await callTool(
    "Unity_RunCommand",
    {
      Title: title,
      Code: code,
    },
    timeoutMs,
  );
  return {
    elapsedMs: response.elapsedMs,
    payload: assertToolSucceeded("Unity_RunCommand", response),
  };
}

function executionText(commandResult) {
  const data = commandResult?.payload?.data;
  return (
    data?.executionLogs ??
    data?.executionLog ??
    data?.logs ??
    commandResult?.payload?.rawText ??
    JSON.stringify(data ?? commandResult?.payload)
  );
}

function summarizeLatencies(latencies) {
  const sorted = [...latencies].sort((left, right) => left - right);
  const total = sorted.reduce((sum, value) => sum + value, 0);
  return {
    count: sorted.length,
    minMs: sorted[0],
    medianMs: sorted[Math.floor(sorted.length / 2)],
    meanMs: total / sorted.length,
    maxMs: sorted.at(-1),
  };
}

async function waitForRunCommand(title, code, expectedText) {
  const deadline = Date.now() + 60_000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const result = await runCommand(title, code, 10_000);
      if (!expectedText || executionText(result).includes(expectedText)) {
        return result;
      }
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw lastError ?? new Error(`${title} did not reach the expected state`);
}

async function main() {
  await mkdir(outputDirectory, { recursive: true });

  const initialized = await request("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: {
      name: "Codex Unity Bakeoff",
      version: "1.0.0",
      title: "Codex Unity Bakeoff",
    },
  });
  notify("notifications/initialized");

  const listedTools = await request("tools/list");
  const toolNames = listedTools.result.tools.map((tool) => tool.name);
  const expectedSafeTools = [
    "Unity_Camera_Capture",
    "Unity_GetConsoleLogs",
    "Unity_RunCommand",
    "Unity_SceneView_Capture2DScene",
    "Unity_SceneView_CaptureMultiAngleSceneView",
  ];
  const missingSafeTools = expectedSafeTools.filter(
    (toolName) => !toolNames.includes(toolName),
  );
  if (missingSafeTools.length > 0) {
    throw new Error(`Missing expected tools: ${missingSafeTools.join(", ")}`);
  }

  const hierarchy = await runCommand(
    "Bakeoff hierarchy inspection",
    `
using UnityEngine;
using UnityEditor.SceneManagement;
using System.Linq;
internal class CommandScript : IRunCommand
{
    public void Execute(ExecutionResult result)
    {
        var scene = EditorSceneManager.OpenScene(
            "Assets/Scenes/StarterScene.unity",
            OpenSceneMode.Single);
        var roots = scene.GetRootGameObjects();
        var transforms = roots.SelectMany(root => root.GetComponentsInChildren<Transform>(true)).ToArray();
        var bootstrap = transforms.FirstOrDefault(item => item.name == "StarterBootstrap");
        var components = bootstrap == null
            ? "missing"
            : string.Join(",", bootstrap.GetComponents<Component>().Select(component => component.GetType().Name));
        result.Log(
            "scene=" + scene.path +
            "; roots=" + roots.Length +
            "; transforms=" + transforms.Length +
            "; bootstrapComponents=" + components);
    }
}`,
  );

  if (
    !executionText(hierarchy).includes("scene=Assets/Scenes/StarterScene.unity") ||
    !executionText(hierarchy).includes("StarterBootstrap")
  ) {
    throw new Error(`Target scene inspection failed: ${executionText(hierarchy)}`);
  }

  const consoleRead = await callTool("Unity_GetConsoleLogs", {
    maxEntries: 20,
    includeStackTrace: true,
  });
  const consolePayload = assertToolSucceeded(
    "Unity_GetConsoleLogs",
    consoleRead,
  );

  const latencySamples = [];
  let latencyFailures = 0;
  for (let sample = 0; sample < 20; sample++) {
    try {
      const read = await callTool("Unity_GetConsoleLogs", {
        maxEntries: 1,
        includeStackTrace: false,
      });
      assertToolSucceeded("Unity_GetConsoleLogs", read);
      latencySamples.push(read.elapsedMs);
    } catch {
      latencyFailures++;
    }
  }

  const createUndoObject = await runCommand(
    "Bakeoff Undo creation",
    `
using UnityEngine;
internal class CommandScript : IRunCommand
{
    public void Execute(ExecutionResult result)
    {
        var temporary = new GameObject("__UNITY_MCP_BAKEOFF_UNDO_TEMP");
        result.RegisterObjectCreation(temporary);
        result.Log("created=True");
    }
}`,
  );
  const beforeUndo = await runCommand(
    "Bakeoff Undo precondition",
    `
using UnityEngine;
internal class CommandScript : IRunCommand
{
    public void Execute(ExecutionResult result)
    {
        result.Log("exists=" + (GameObject.Find("__UNITY_MCP_BAKEOFF_UNDO_TEMP") != null));
    }
}`,
  );
  const performUndo = await runCommand(
    "Bakeoff perform Undo",
    `
using UnityEditor;
internal class CommandScript : IRunCommand
{
    public void Execute(ExecutionResult result)
    {
        Undo.PerformUndo();
        result.Log("undo=performed");
    }
}`,
  );
  const afterUndo = await runCommand(
    "Bakeoff Undo verification",
    `
using UnityEngine;
internal class CommandScript : IRunCommand
{
    public void Execute(ExecutionResult result)
    {
        var temporary = GameObject.Find("__UNITY_MCP_BAKEOFF_UNDO_TEMP");
        result.Log("exists=" + (temporary != null));
        if (temporary != null)
            result.DestroyObject(temporary);
    }
}`,
  );

  if (
    !executionText(beforeUndo).includes("exists=True") ||
    !executionText(afterUndo).includes("exists=False")
  ) {
    throw new Error(
      `Undo verification failed: before=${executionText(beforeUndo)} after=${executionText(afterUndo)}`,
    );
  }

  const enterPlayMode = await runCommand(
    "Bakeoff enter Play Mode",
    `
using UnityEditor;
internal class CommandScript : IRunCommand
{
    public void Execute(ExecutionResult result)
    {
        EditorApplication.isPlaying = true;
        result.Log("playRequested=True");
    }
}`,
  );
  const inPlayMode = await waitForRunCommand(
    "Bakeoff Play Mode state",
    `
using UnityEditor;
internal class CommandScript : IRunCommand
{
    public void Execute(ExecutionResult result)
    {
        result.Log("isPlaying=" + EditorApplication.isPlaying);
    }
}`,
    "isPlaying=True",
  );

  const runtimeHierarchy = await waitForRunCommand(
    "Bakeoff runtime hierarchy inspection",
    `
using UnityEngine;
using UnityEngine.SceneManagement;
using System.Linq;
internal class CommandScript : IRunCommand
{
    public void Execute(ExecutionResult result)
    {
        var scene = SceneManager.GetActiveScene();
        var transforms = scene.GetRootGameObjects()
            .SelectMany(root => root.GetComponentsInChildren<Transform>(true))
            .ToArray();
        var starterObject = transforms.FirstOrDefault(item => item.name == "Starter Object");
        var components = starterObject == null
            ? "missing"
            : string.Join(",", starterObject.GetComponents<Component>().Select(component => component.GetType().Name));
        result.Log(
            "scene=" + scene.path +
            "; transforms=" + transforms.Length +
            "; ready=" + transforms.Any(item => item.name == "__StarterReady") +
            "; starterObjectComponents=" + components);
    }
}`,
    "ready=True",
  );

  if (!executionText(runtimeHierarchy).includes("MeshRenderer")) {
    throw new Error(
      `Runtime component inspection failed: ${executionText(runtimeHierarchy)}`,
    );
  }

  const capture = await callTool("Unity_Camera_Capture", {}, 90_000);
  const captureImage = capture.result?.content?.find(
    (item) => item.type === "image",
  );
  if (capture.result?.isError || !captureImage?.data) {
    throw new Error("Unity_Camera_Capture did not return image data");
  }
  await writeFile(capturePath, Buffer.from(captureImage.data, "base64"));

  const multiAngleCapture = await callTool(
    "Unity_SceneView_CaptureMultiAngleSceneView",
    {},
    90_000,
  );
  const multiAngleImage = multiAngleCapture.result?.content?.find(
    (item) => item.type === "image",
  );
  if (multiAngleCapture.result?.isError || !multiAngleImage?.data) {
    throw new Error(
      "Unity_SceneView_CaptureMultiAngleSceneView did not return image data",
    );
  }
  await writeFile(
    multiAngleCapturePath,
    Buffer.from(multiAngleImage.data, "base64"),
  );

  const exitPlayMode = await runCommand(
    "Bakeoff exit Play Mode",
    `
using UnityEditor;
internal class CommandScript : IRunCommand
{
    public void Execute(ExecutionResult result)
    {
        EditorApplication.isPlaying = false;
        result.Log("stopRequested=True");
    }
}`,
  );
  const outOfPlayMode = await waitForRunCommand(
    "Bakeoff Edit Mode state",
    `
using UnityEditor;
internal class CommandScript : IRunCommand
{
    public void Execute(ExecutionResult result)
    {
        result.Log("isPlaying=" + EditorApplication.isPlaying);
    }
}`,
    "isPlaying=False",
  );

  let reloadRequestOutcome;
  try {
    const reloadRequest = await runCommand(
      "Bakeoff request script reload",
      `
using UnityEditor;
internal class CommandScript : IRunCommand
{
    public void Execute(ExecutionResult result)
    {
        result.Log("reloadRequested=True");
        EditorUtility.RequestScriptReload();
    }
}`,
      10_000,
    );
    reloadRequestOutcome = executionText(reloadRequest);
  } catch (error) {
    reloadRequestOutcome = `disconnectedDuringReload=${error.message}`;
  }

  const afterReload = await waitForRunCommand(
    "Bakeoff domain reload recovery",
    `
internal class CommandScript : IRunCommand
{
    public void Execute(ExecutionResult result)
    {
        result.Log("reloadRecovered=True");
    }
}`,
    "reloadRecovered=True",
  );

  const report = {
    generatedAt: new Date().toISOString(),
    projectRoot,
    relayPath,
    protocolVersion: initialized.result.protocolVersion,
    serverInfo: initialized.result.serverInfo,
    enabledToolCount: toolNames.length,
    enabledTools: toolNames,
    hierarchy: {
      elapsedMs: hierarchy.elapsedMs,
      output: executionText(hierarchy),
    },
    console: {
      elapsedMs: consoleRead.elapsedMs,
      success: consolePayload?.success !== false,
    },
    capture: {
      elapsedMs: capture.elapsedMs,
      path: capturePath,
      mimeType: captureImage.mimeType,
      bytes: Buffer.byteLength(captureImage.data, "base64"),
    },
    multiAngleCapture: {
      elapsedMs: multiAngleCapture.elapsedMs,
      path: multiAngleCapturePath,
      mimeType: multiAngleImage.mimeType,
      bytes: Buffer.byteLength(multiAngleImage.data, "base64"),
    },
    undo: {
      createOutput: executionText(createUndoObject),
      beforeOutput: executionText(beforeUndo),
      performOutput: executionText(performUndo),
      afterOutput: executionText(afterUndo),
    },
    playMode: {
      enterOutput: executionText(enterPlayMode),
      activeOutput: executionText(inPlayMode),
      runtimeHierarchyOutput: executionText(runtimeHierarchy),
      exitOutput: executionText(exitPlayMode),
      inactiveOutput: executionText(outOfPlayMode),
    },
    domainReload: {
      requestOutcome: reloadRequestOutcome,
      recoveryOutput: executionText(afterReload),
    },
    reliability: {
      attempts: latencySamples.length + latencyFailures,
      successes: latencySamples.length,
      failures: latencyFailures,
      latency: summarizeLatencies(latencySamples),
    },
    notifications: notifications.map((notification) => notification.method),
    relayLogTail: relayLogs.slice(-100),
  };

  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

try {
  await main();
} finally {
  relay.stdin.end();
  relay.kill("SIGINT");
}
