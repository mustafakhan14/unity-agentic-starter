# Unity Editor Mutation Policy

Use this policy for any agent or script that mutates Unity editor state.

Adapted from audited MIT-licensed Unity MCP and unity-cli prior art.

## Before Mutating

- Confirm the active Unity project is the current repository root.
- Confirm the active scene matches `GLADE.md` and the current story. Until the
  template is customized, use `Assets/Scenes/StarterScene.unity`.
- Read editor state and wait if Unity is compiling or a domain reload is pending.
- Inspect the target GameObject/component/resource before issuing the mutation.
- Prefer Unity APIs and bridge tools over manual YAML edits.

## Scene And Object Changes

- Use `Undo.RecordObject`, `Undo.RegisterCreatedObjectUndo`, or the bridge's equivalent undo-aware operation for editor mutations.
- Mark changed scene objects dirty through Unity APIs when needed.
- Save scenes only when the task explicitly asks for persistent scene changes.
- Do not mutate scene hierarchy by editing scene YAML.
- Keep tested object names stable unless the task explicitly updates the object
  model and matching tests/docs.

## Prefab And Asset Changes

- Preserve `.meta` files and GUIDs.
- Use `AssetDatabase`/Package Manager operations rather than filesystem-only asset edits where Unity import state matters.
- For prefabs, use Unity prefab APIs and record overrides intentionally.
- Do not import external assets without license review.
- For GladeKit asset imports, do not set `licenseAcknowledged: true` without explicit user approval.

## Script Changes

- After creating or editing C# scripts, wait for compilation to finish.
- Read console errors before attaching new components or running PlayMode.
- Do not assume editor bridge state survives domain reload.
- Avoid long synchronous work on Unity's main thread. Use async/polling bridge patterns for long tasks.

## Bridge Tool Contracts

- Tool/resource names must match the bridge schema exactly.
- Treat payload shapes as bridge-version-specific.
- Inspect schema/resources instead of guessing field names or enum values.
- Watch for port conflicts before diagnosing code problems.

## Verification

- Run `scripts/verify-unity.sh` for code or test changes.
- Run `scripts/mcp-smoke-check.sh` after bridge setup.
- Capture screenshots for visual changes.
- Read console logs before reporting success.
