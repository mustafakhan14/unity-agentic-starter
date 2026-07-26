---
name: unity-scene-inspect
description: Inspect the active Unity scene without mutating it. Use when analyzing hierarchy, components, or scene wiring before a safe edit. Do not use for mutations; use unity-mcp-operating-loop instead.
---

# Unity Scene Inspect

Adapted from the MIT-licensed `akiojin/unity-cli` inspection skill and
CoderGamester MCP Unity bridge guidance.

## Use When

- The task needs current scene hierarchy or component state.
- The user asks where an object, UI panel, or script is wired.
- A planned change needs a pre-edit inventory.

## Preferred Flow

1. Read `GLADE.md`, the current story, and `docs/game-architecture.md`.
2. Confirm the active project and story target scene.
3. With MCP available, read hierarchy and console resources first.
4. Inspect exact GameObject and component names before suggesting edits.
5. If MCP is unavailable, inspect the scene owner/bootstrap source without
   editing scene YAML.

## Starter Baseline

- Scene: `Assets/Scenes/StarterScene.unity`
- Bootstrap: `StarterBootstrap`
- Runtime marker: `__StarterReady`
- Visual object: `Starter Object`
- Camera: `Main Camera`

## References

- `docs/mcp-operating-loop.md`
- `GLADE.md`
- `Assets/Scripts/StarterBootstrap.cs`
