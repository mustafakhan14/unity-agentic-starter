---
name: unity-playmode-testing
description: Verify Unity runtime behavior with automated tests, Play Mode, console logs, and visual evidence. Do not use for static-only documentation tasks.
---

# Unity PlayMode Testing

Adapted from the MIT-licensed `akiojin/unity-cli` PlayMode skill and CoplayDev
Unity-MCP verification flow.

## Use When

- Runtime, input, UI, scene, or presentation behavior changed.
- The user asks for Play Mode confidence.
- Tests, screenshots, or console logs are required.

## Preferred Flow

1. Run `scripts/verify-unity.sh`.
2. If licensing fails, open Unity Hub or this project once and rerun.
3. Open the current story's target scene and exercise its acceptance criteria.
4. Capture a scene/game view for visual changes when automation supports it.
5. Read console errors and warnings before reporting success.

## Starter Coverage

- `StarterSceneTests` checks baseline scene objects and components.
- `StarterBootstrapPlayModeTests` checks runtime creation of `__StarterReady`.
- Replace or extend these tests as the customized game's core loop emerges.

## References

- `scripts/verify-unity.sh`
- `docs/mcp-operating-loop.md`
- `prompts/playtest-reporter.md`
