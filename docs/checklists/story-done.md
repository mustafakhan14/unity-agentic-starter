# Story Done Checklist

Use this checklist before marking a story done.

- Story acceptance criteria are explicit.
- `AGENTS.md` and `GLADE.md` constraints were followed.
- No manual scene or prefab YAML edit was made unless explicitly requested.
- `.meta` files are present for new Unity assets.
- Runtime code compiles in Unity 6000.5.4f1.
- EditMode tests pass.
- PlayMode tests pass.
- `Logs/TestResults/editmode-results.xml` and
  `Logs/TestResults/playmode-results.xml` were freshly written by the current
  verification run and fully passed.
- Unity-tuned local reviewer was run for Unity C# or package changes, or the story explains why it was skipped.
- The capability route and single mutation owner were recorded for MCP Editor work.
- MCP smoke was run for scene/editor work, or the story explains why it was skipped.
- Remaining risks are documented in the story.
