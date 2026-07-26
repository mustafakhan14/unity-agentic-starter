#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATIC_ONLY=0
BRIDGE_HOST="${BRIDGE_HOST:-localhost}"
BRIDGE_PORT="${BRIDGE_PORT:-8765}"

if [[ "${1:-}" == "--static" ]]; then
  STATIC_ONLY=1
fi

require_file() {
  local path="$1"
  if [[ ! -f "$PROJECT_ROOT/$path" ]]; then
    echo "Missing required file: $path" >&2
    exit 1
  fi
}

require_contains() {
  local path="$1"
  local pattern="$2"
  if ! grep -Eq -- "$pattern" "$PROJECT_ROOT/$path"; then
    echo "Required pattern not found in $path: $pattern" >&2
    exit 1
  fi
}

require_file "GLADE.md"
require_file "config/unity-bridge-registry.json"
require_file "docs/hybrid-bridge-strategy.md"
require_file "scripts/bridge-status.mjs"
require_file ".mcp.example.json"
require_file "docs/mcp-operating-loop.md"
require_file "docs/unity-agent-bridge.md"
require_file "docs/mcp-smoke.md"
require_file "docs/unity-mcp-bakeoff.md"
require_file "scripts/official-unity-mcp-smoke.mjs"

node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$PROJECT_ROOT/.mcp.example.json"
node --check "$PROJECT_ROOT/scripts/official-unity-mcp-smoke.mjs"
node --check "$PROJECT_ROOT/scripts/bridge-status.mjs"
node "$PROJECT_ROOT/scripts/bridge-status.mjs" --static --json >/dev/null
require_contains ".mcp.example.json" '"command"[[:space:]]*:[[:space:]]*"uvx"'
require_contains ".mcp.example.json" '"gladekit-mcp"'
require_contains "GLADE.md" "__StarterReady"
require_contains "config/unity-bridge-registry.json" '"singleMutationOwner"[[:space:]]*:[[:space:]]*true'
require_contains "config/unity-bridge-registry.json" '"Unity_AssetGeneration_"'
require_contains "docs/unity-mcp-bakeoff.md" "Keep GladeKit MCP as the default bridge"
require_contains "scripts/official-unity-mcp-smoke.mjs" 'startsWith\("Unity_AssetGeneration_"\)'

if [[ "$STATIC_ONLY" -eq 1 ]]; then
  echo "MCP static smoke prerequisites passed."
  exit 0
fi

if ! command -v uvx >/dev/null 2>&1; then
  echo "uvx is not on PATH. Install uv as documented in docs/unity-agent-bridge.md." >&2
  exit 2
fi

if ! nc -z "$BRIDGE_HOST" "$BRIDGE_PORT" >/dev/null 2>&1; then
  if ! nc -z ::1 "$BRIDGE_PORT" >/dev/null 2>&1 && ! nc -z 127.0.0.1 "$BRIDGE_PORT" >/dev/null 2>&1; then
    echo "GladeKit Unity bridge is not reachable at ${BRIDGE_HOST}:${BRIDGE_PORT}." >&2
    echo "Open Unity, install the bridge package, and verify the editor bridge is listening." >&2
    exit 3
  fi
fi

if ! HEALTH_JSON="$(curl -fsS --max-time 5 "http://localhost:${BRIDGE_PORT}/api/health")"; then
  echo "GladeKit Unity bridge port is reachable, but the health endpoint did not respond." >&2
  exit 4
fi

if ! TOOLS_JSON="$(curl -fsS --max-time 5 "http://localhost:${BRIDGE_PORT}/api/tools/list")"; then
  echo "GladeKit Unity bridge port is reachable, but the tools endpoint did not respond." >&2
  echo "Open Unity, install the bridge package, and verify the editor bridge is listening." >&2
  exit 4
fi

node -e '
  const fs = require("fs");
  const path = require("path");
  const [healthJson, toolsJson, root] = process.argv.slice(1);
  const health = JSON.parse(healthJson);
  const tools = JSON.parse(toolsJson);
  if (health.status !== "ok" || health.isCompiling) {
    console.error(`Bridge is not ready: status=${health.status} isCompiling=${health.isCompiling}`);
    process.exit(5);
  }
  const expectedRoot = fs.realpathSync(root);
  const actualRoot = fs.realpathSync(path.resolve(health.projectPath));
  if (actualRoot !== expectedRoot) {
    console.error(`Bridge belongs to the wrong project: ${actualRoot}`);
    console.error(`Expected: ${expectedRoot}`);
    process.exit(5);
  }
  const names = new Set(tools.toolNames || []);
  for (const required of ["open_scene", "get_scene_hierarchy", "get_unity_console_logs"]) {
    if (!names.has(required)) {
      console.error(`Bridge is missing required tool: ${required}`);
      process.exit(5);
    }
  }
' "$HEALTH_JSON" "$TOOLS_JSON" "$PROJECT_ROOT"

echo "MCP live smoke prerequisites passed."
