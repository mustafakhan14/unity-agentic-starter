# MCP Smoke Checklist

Use this after installing the GladeKit bridge and opening the Unity project.

## Static Readiness

Run:

```bash
scripts/bridge-status.mjs --static --recommend hierarchy_inspection
scripts/mcp-smoke-check.sh --static
```

Expected:

- `config/unity-bridge-registry.json` is valid and the router can recommend a provider.
- `GLADE.md` exists in the Unity project root.
- `.mcp.example.json` is valid JSON and uses `uvx gladekit-mcp`.
- `docs/mcp-operating-loop.md` and `docs/unity-agent-bridge.md` exist.
- The script does not require Unity or a bridge connection in static mode.

## Live Bridge Readiness

Run:

```bash
scripts/mcp-smoke-check.sh
```

Expected:

- `uvx` is on PATH.
- Port `8765` is reachable on localhost after the Unity editor bridge starts.
- If the port is closed, open Unity and confirm the GladeKit bridge package is installed.

## Agent Smoke Tasks

Ask the MCP-enabled agent to perform these in order:

1. Select the capability route and record the mutation owner when applicable.
2. Read bridge/editor health.
3. Confirm the active project path is the current repository root.
4. Read `GLADE.md` context.
5. Read the active scene hierarchy.
6. Confirm `StarterBootstrap` and `__StarterReady` in the starter baseline.
7. Read Unity console errors and warnings.
8. Inspect the advertised tool list for a scene/game-view capture tool.
9. Capture through the bridge when available; otherwise record a manual Editor screenshot for visual changes.
10. Report whether the scene is ready for a PlayMode verification.

The pinned GladeKit bridge `0.7.16` currently advertises hierarchy and console
tools but no screenshot/capture tool through `/api/tools/list`. Screenshot
automation is therefore an optional capability check, not a base smoke-test
failure.

## Pass Criteria

- The active project and scene are correct.
- The expected scene bootstrap and runtime readiness marker are present.
- No new console errors are reported.
- Visual tasks have either an automated capture or a documented manual Editor screenshot.
- The agent does not mutate the scene during smoke testing.

## Optional Official Bridge Smoke

When `com.unity.ai.assistant` and the official relay are deliberately installed,
run:

```bash
node scripts/official-unity-mcp-smoke.mjs
```

This is not part of the default GladeKit setup. It validates exact target-scene
inspection, console access, 20 read samples, native captures, Undo, Play Mode,
and domain-reload recovery. It refuses official asset-generation tools. See
`docs/unity-mcp-bakeoff.md` for prerequisites and the tested decision.
