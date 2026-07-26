# Agent Runbook

## Before Changing Code

1. Read `AGENTS.md`, `GLADE.md`, and the relevant script files.
2. Check `git status --short` and do not overwrite user changes.
3. Confirm the project customization checklist and current story are up to date.
4. Identify whether the task changes runtime behavior, tests, docs, or tooling.
5. Prefer small edits that can be verified by Unity compile and focused tests.

## During Implementation

- Keep existing runtime behavior unchanged unless explicitly requested.
- Preserve `.meta` files and avoid asset GUID churn.
- Use Unity APIs for scene, prefab, and asset changes.
- Do not add required online services or secrets.
- Use exact Unity object/script names in docs and tests.

## Verification Loop

Run:

```bash
scripts/verify-unity.sh
```

If licensing fails, open Unity Hub or the editor once, then rerun.

For runtime or scene changes, also manually verify:

1. Open the scene named by the current story and `GLADE.md`.
   Until customized, use `Assets/Scenes/StarterScene.unity`.
2. Press Play.
3. Exercise the changed behavior.
4. Confirm expected visual and interaction feedback.
5. Confirm the Console has no new errors.

## MCP Smoke Test

After GladeKit MCP is configured, verify:

- Read scene hierarchy.
- Confirm `StarterBootstrap` and `__StarterReady` in the starter baseline.
- Read console logs.
- Capture through the bridge when supported, or use a manual Editor screenshot for visual changes.
