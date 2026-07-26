# MCP Operating Loop

Adapted from the MIT-licensed GladeKit MCP, CoplayDev Unity MCP, CoderGamester MCP Unity, and akiojin unity-cli workflows.

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

- If bridge calls fail, check editor state and console before retrying.
- If Unity batchmode fails with licensing errors, open Unity Hub or the project once, then rerun verification.
- If a tool schema is unclear, inspect schema/resources instead of guessing payload shape.
- If server and plugin versions differ, verify the bridge's documented version pin before debugging project code.
