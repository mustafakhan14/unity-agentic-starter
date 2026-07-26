# MCP Operating Loop

Adapted from the MIT-licensed GladeKit MCP, CoplayDev Unity MCP, CoderGamester MCP Unity, and akiojin unity-cli workflows.

## Route Before Tool Use

1. Name the required capability from `config/unity-bridge-registry.json`.
2. Run `scripts/bridge-status.mjs --recommend <capability>`.
3. Confirm the selected provider is live and targets this exact project.
4. For mutations, keep one provider as owner through Undo, save, compile, and console verification.
5. Use a second provider only for a read-only cross-check after the owner completes.

See `docs/hybrid-bridge-strategy.md` for capability routes, opt-in profiles, and
the provider promotion gate.

## Resource-First Loop

1. Check editor state before mutating anything.
2. Read project context (`GLADE.md`) and scene hierarchy.
3. Find exact objects/components before issuing tool calls.
4. Use the smallest tool that performs the change.
5. Wait for script compilation after code edits.
6. Read console errors and warnings.
7. Capture a scene or game view screenshot for visual changes when the bridge supports it; otherwise use a manual Editor screenshot.
8. Run EditMode/PlayMode tests for behavior changes.

## Unity Readiness Checks

- Editor is open and connected to the bridge.
- The active Unity project is the current repository root.
- Active scene matches `GLADE.md`; the uncustomized baseline uses
  `Assets/Scenes/StarterScene.unity`.
- Unity is not compiling.
- Domain reload is not pending.
- Play Mode is stopped unless the task explicitly needs it.

## Change Discipline

- Batch independent scene queries when the bridge supports batching.
- Do not attach a newly created script until compilation succeeds.
- Treat tool names, payload fields, and enum values as project/version-specific.
- Use automated or manual Editor screenshots to verify visual changes; do not rely only on hierarchy output.
- Check console after every script, package, scene, or material change.
- Prefer MCP resources for read-only state and MCP tools for validated mutations.
- Keep custom tool parameters typed and narrow.

## Asset Import Rule

If using GladeKit asset tools, never set `licenseAcknowledged: true` without explicit user approval for that exact asset/license result.

## Failure Handling

- If bridge calls fail before mutation, check state and select the next available route.
- If a bridge fails during mutation, do not switch providers mid-operation. Inspect, Undo or restore, then restart with one owner.
- If Unity batchmode fails with licensing errors, open Unity Hub or the project once, then rerun verification.
- If a tool schema is unclear, inspect schema/resources instead of guessing payload shape.
- If server and plugin versions differ, verify the bridge's documented version pin before debugging project code.
- Treat a disagreement between bridges as evidence to investigate, not permission for either bridge to auto-repair state.
