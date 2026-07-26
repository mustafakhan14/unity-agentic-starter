# Template Customization Checklist

Complete these items before the first game feature slice.

- [ ] Set the game name, premise, platform, and core loop in `GLADE.md`.
- [ ] Replace placeholders in `docs/game-design-doc.md`.
- [ ] Record initial system boundaries in `docs/game-architecture.md`.
- [ ] Update `PlayerSettings.productName` and application identifiers.
- [ ] Decide whether `StarterScene`, `StarterBootstrap`, and `Starter.Runtime`
      should keep their neutral names or be renamed through Unity-safe moves.
- [ ] Choose and document the input, UI, render, physics, and persistence approach.
- [ ] Replace the neutral cube with the smallest playable vertical slice.
- [ ] Create the first story from `docs/stories/000-template.md` and update
      `docs/sprint-status.yaml`.
- [ ] Update PlayMode smoke coverage to exercise the real core loop.
- [ ] Run static setup, MCP static, compile, EditMode, PlayMode, and manual Play
      validation before publishing the customized repository.
