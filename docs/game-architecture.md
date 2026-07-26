# Game Architecture

This document records project-specific technical decisions. Replace the starter
baseline as real game systems are introduced.

## Current Baseline

- Unity `6000.5.4f1`
- One root Unity project
- Scene: `Assets/Scenes/StarterScene.unity`
- Runtime assembly: `Starter.Runtime`
- Test assemblies: `Starter.EditModeTests` and `Starter.PlayModeTests`
- Bootstrap behavior: create `__StarterReady` during Play Mode

## Boundaries To Define

- Scene ownership and loading
- Input backend and action mapping
- Player/controller architecture
- UI framework and presentation boundaries
- Persistence and save data
- Audio, animation, physics, and rendering requirements
- Asset naming, import, and addressability strategy

## Dependency Rules

- Keep Editor-only APIs out of runtime assemblies.
- Add packages only for a concrete feature requirement.
- Prefer Unity serialization and Inspector-visible references for early slices.
- Add shared abstractions only after repeated behavior demonstrates the need.
- Record every cross-assembly dependency here.

## Verification Strategy

- EditMode tests cover deterministic logic and scene structure.
- PlayMode tests cover runtime wiring and the smallest critical game loop.
- Batchmode compile catches assembly and API errors.
- Manual Play checks cover visuals, interaction, timing, and console behavior.
