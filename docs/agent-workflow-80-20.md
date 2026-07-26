# Agent Workflow 80/20

This repo uses a compact version of the BMAD-style game workflow: enough structure to keep agents aligned, not enough ceremony to slow the prototype.

## Sources Adapted

- BMad Game Dev Studio Unity setup: project context, GDD, architecture, sprint/status, stories, and testing structure.
- Existing repo guardrails: `AGENTS.md`, `GLADE.md`, `docs/game-design-doc.md`, `docs/game-architecture.md`, and `scripts/verify-unity.sh`.

## Default Flow

1. Read `AGENTS.md` and `GLADE.md`.
2. Check `docs/sprint-status.yaml` for the active story.
3. Copy `docs/stories/000-template.md` for new work.
4. Define acceptance criteria before editing.
5. Implement the smallest change that satisfies the story.
6. Run `scripts/verify-unity.sh`.
7. For Unity C# or package changes, run the Unity-tuned local reviewer:

```bash
git diff -- Assets/Scripts Assets/Tests Packages ProjectSettings | scripts/unity-model-reviewer.sh
```

8. For scene/editor work, run MCP smoke, capture console evidence, and use an automated or manual Editor screenshot for visual changes.
9. Update the story status only after validation evidence is written down.

## Story Size

A good story for this prototype should fit in one focused agent pass:

- one mechanic
- one scene object group
- one UI flow
- one test/eval improvement
- one docs or bridge setup improvement

Split the story when a task touches runtime code, scene generation, package dependencies, and MCP setup at the same time.

## Done Criteria

- Acceptance criteria are checked off in the story.
- Unity compile passes.
- EditMode and PlayMode tests pass.
- Fresh result XML from the current run exists in `Logs/TestResults/` and its
  top-level counts are internally consistent.
- No console compile errors are present.
- Any model-reviewer finding is either fixed or explicitly rejected with reason.
- MCP smoke is run for editor/scene tasks once the bridge is available.

## What We Are Not Adopting

- Full BMAD roleplay or multi-agent ceremony.
- Sharded docs unless files become too large to navigate.
- Sprint process beyond `docs/sprint-status.yaml` and story files.
- Repo-specific fine-tuning before an evaluation set exists.
