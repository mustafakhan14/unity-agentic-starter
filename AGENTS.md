# Agent Instructions

This is a reusable Unity `6000.5.4f1` starter project for agent-assisted game
development. Customize project context before adding game-specific behavior.

## Project Shape

- Treat the repository root containing this file as the only Unity project root.
- The starter scene is `Assets/Scenes/StarterScene.unity`.
- Runtime scripts live in `Assets/Scripts/` and compile through
  `Starter.Runtime.asmdef`.
- `StarterBootstrap` creates the runtime-only `__StarterReady` marker.
- The project accepts legacy uGUI, built-in 3D physics, and Unity primitives.
- Replace starter assumptions deliberately when the game architecture requires it.

## Guardrails

- Do not invent Unity APIs. Verify unfamiliar APIs against installed Unity docs,
  local package code, or compile output.
- Do not manually edit Unity scene YAML, prefab YAML, or `.meta` GUIDs unless
  explicitly requested.
- Preserve `.meta` files for every asset under `Assets/`.
- Keep generated folders ignored: `Library/`, `Temp/`, `Obj/`, `Logs/`,
  `Build/`, `Builds/`, and `UserSettings/`.
- Do not add cloud services, analytics, telemetry, paid APIs, or remote model
  calls as required runtime dependencies.
- Do not create nested Unity projects or a `Projects/` monorepo.
- Prefer small Unity-facing changes with compile/test feedback over speculative
  rewrites.

## Verification

- Run `scripts/verify-unity.sh` before calling code changes complete.
- If Unity reports a licensing IPC failure, open Unity Hub or the Editor once,
  then rerun the script.
- For runtime or scene changes, also do a manual Play check in the active game
  scene. Until customized, use `Assets/Scenes/StarterScene.unity`.
- For C# or package changes, run the local Unity-tuned reviewer when available:
  `git diff -- Assets Packages ProjectSettings | scripts/unity-model-reviewer.sh`.
- For MCP work, verify hierarchy and console access and capture a scene/game view
  when the selected bridge supports it.
- Run `tests/agent_setup/validate-agent-setup.sh` after changing repository
  instructions, docs, prompts, skills, scripts, packages, or test layout.

## 80/20 Story Workflow

- Use `docs/agent-workflow-80-20.md` for feature workflow.
- Track current work in `docs/sprint-status.yaml`.
- Start slices from `docs/stories/000-template.md`.
- Use `docs/checklists/story-done.md` before marking a story done.

## Coding Conventions

- Keep MonoBehaviours in the global namespace unless the project deliberately
  adopts a namespace.
- Use PascalCase for C# types and public methods, camelCase for fields and locals.
- Keep serialized fields simple and Inspector-friendly.
- Use clear Unity object names because agents and smoke tests inspect hierarchy
  by name.
- Add abstractions only when they reduce real duplication or complexity.

## MCP And Editor Pitfalls

- Read Editor state and scene resources before using mutating MCP tools.
- Wait for compilation and domain reload after script edits before attaching
  components or running tests.
- Check console logs after script, scene, package, material, or UI changes.
- Treat MCP tool schemas as version-specific and case-sensitive contracts.
- Do not assume bridge state survives a Unity domain reload.
- Use `Undo.RecordObject`, `Undo.RegisterCreatedObjectUndo`, or bridge-equivalent
  undo-aware operations for Editor mutations.
- Keep synchronous Unity main thread work short; long operations need polling.
- Check for port conflicts before diagnosing bridge code or tool schemas.
- Follow `docs/unity-editor-mutation-policy.md` before mutating Unity state.

## Bridge Selection

- Default to GladeKit MCP for this project.
- Use `docs/bridge-selection.md` before changing bridge strategy.
- Treat official Unity MCP as an opt-in secondary bridge; read
  `docs/unity-mcp-bakeoff.md` before installing or enabling it.
- Never call official `Unity_AssetGeneration_*` tools without separate explicit
  approval for the exact generation, terms, and possible cost.
- Keep `.mcp.example.json` as an example only; do not commit personal MCP client
  config or secrets.
- Run `scripts/mcp-smoke-check.sh --static` for config readiness and
  `scripts/mcp-smoke-check.sh` for live bridge readiness.

## Custom MCP Extensions

- Follow `docs/custom-mcp-extension-policy.md` before adding project-specific
  tools, resources, or prompts.
- Prefer resources for read-only state and tools for validated mutations.
- Runtime-in-game AI hooks are optional gameplay features, not required repo
  infrastructure.
- Extensions need tests, typed parameters, structured returns, and explicit
  main-thread boundaries.
