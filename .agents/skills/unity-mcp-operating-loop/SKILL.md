---
name: unity-mcp-operating-loop
description: Operate Unity through capability-routed MCP safely. Use when inspecting, mutating, testing, or capturing Editor state through one or more bridges.
---

# Unity MCP Operating Loop

Adapted from MIT-licensed GladeKit MCP, CoplayDev Unity MCP, CoderGamester MCP
Unity, and akiojin unity-cli workflow material.

## Use When

- A task uses Unity Editor state, MCP tools, screenshots, or Play Mode.
- A capability could be served by more than one configured bridge.
- A second bridge would provide useful read-only verification.

## Preferred Flow

1. Name the capability from `config/unity-bridge-registry.json`.
2. Run `scripts/bridge-status.mjs --recommend <capability>`.
3. Verify the selected bridge is live and targets this exact project.
4. Read `GLADE.md`, editor state, hierarchy, and console before mutation.
5. Assign one mutation owner and use the smallest typed operation available.
6. Keep that owner through Undo, save, compile, reload, and console checks.
7. Use another bridge only for a read-only cross-check after completion.
8. Capture visual evidence and run relevant Unity tests.

## Failure Boundary

- Before mutation, an unavailable provider can fall back to the next route.
- During mutation, never switch providers blindly. Inspect, Undo or restore,
  then restart with one explicit owner.
- A cross-bridge disagreement is evidence to investigate, not permission for
  automatic repair.
- Cloud intelligence is optional. Never require `GLADEKIT_API_KEY`, Unity Cloud,
  trials, paid features, or asset-generation tools.

## References

- `config/unity-bridge-registry.json`
- `docs/hybrid-bridge-strategy.md`
- `docs/mcp-operating-loop.md`
- `docs/unity-agent-bridge.md`
- `GLADE.md`
