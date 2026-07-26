# Unity Agentic Starter

Reusable Unity `6000.5.4f1` starter project for agent-assisted game development.

Repository: https://github.com/mustafakhan14/unity-agentic-starter

## Open The Project

1. Install Unity Editor `6000.5.4f1` through Unity Hub.
2. Add this repository as a Unity project. The repository root is the project root.
3. Open `Assets/Scenes/StarterScene.unity`.
4. Press Play. The neutral bootstrap creates `__StarterReady` beneath
   `StarterBootstrap`.

## Included Baseline

- One neutral scene with a camera, light, cube, and minimal runtime bootstrap.
- EditMode and PlayMode smoke tests.
- `AGENTS.md` and `GLADE.md` project context.
- Guardrails for scene, prefab, package, and Editor mutations.
- An 80/20 story workflow, checklists, prompts, and project-local agent skills.
- GladeKit MCP as the default local Editor bridge.
- Official Unity MCP as a guarded, disabled-by-default opt-in alternative.
- Batchmode compile, EditMode, PlayMode, MCP, and static setup validators.
- Optional Unity-tuned local model review.

## First Customization

Follow `docs/template-customization-checklist.md` before implementing a game.
At minimum, set the game name and premise in `GLADE.md`, replace the starter
GDD and architecture placeholders, rename the scene/bootstrap if appropriate,
and create the first story from `docs/stories/000-template.md`.

## Validation

```bash
tests/agent_setup/validate-agent-setup.sh
scripts/mcp-smoke-check.sh --static
scripts/verify-unity.sh
```

With Unity open and GladeKit listening:

```bash
scripts/mcp-smoke-check.sh
```

For C#, package, or ProjectSettings changes, run the optional reviewer when its
local model is installed:

```bash
git diff -- Assets Packages ProjectSettings | scripts/unity-model-reviewer.sh
```

## License And Attribution

Repository-authored code and documentation are MIT licensed. See `LICENSE` and
`THIRD_PARTY_NOTICES.md`. Referenced third-party projects retain their own
licenses; do not copy code without checking the applicable license first.
