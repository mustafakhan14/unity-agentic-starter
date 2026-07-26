# Unity Agentic Starter Context

## Project Identity

- Game name: `UNSET - replace before feature work`
- Premise: `UNSET - summarize the player fantasy and core loop`
- Target platform: `UNSET`
- Unity version: `6000.5.4f1`

## Current Baseline

- Scene: `Assets/Scenes/StarterScene.unity`
- Runtime assembly: `Starter.Runtime`
- Bootstrap: `Assets/Scripts/StarterBootstrap.cs`
- Runtime readiness marker: `__StarterReady`
- Visual content: one camera, directional light, and primitive cube
- Input, UI, game rules, persistence, and production assets: intentionally unset

## Accepted Technology

- Unity primitives and built-in 3D physics
- Legacy uGUI when a story requires UI
- Unity Test Framework
- Capability-routed MCP using `config/unity-bridge-registry.json`
- GladeKit as the broad typed-tool baseline
- Official Unity MCP as an opt-in provider for native capabilities it wins

Add packages only when a concrete story requires them. Record architectural
choices in `docs/game-architecture.md`.

## Naming

- PascalCase C# types and public methods
- camelCase fields and locals
- Clear, stable GameObject names for hierarchy inspection
- Feature-specific IDs and constants only after the game design defines them

## Done Criteria

An agent task is done only when:

- the requested behavior exists without unrelated rewrites;
- compile, relevant EditMode tests, and relevant PlayMode tests pass;
- the target scene has been checked in Play Mode for runtime/visual changes;
- Unity console errors introduced by the change are resolved;
- scene and asset changes are intentional and `.meta` files are preserved;
- docs and current story state match the implementation;
- no secrets, local account state, or machine-specific paths are committed.
