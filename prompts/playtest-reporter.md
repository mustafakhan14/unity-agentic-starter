# Playtest Reporter Prompt

Run or observe the active story's target scene and report only actionable
results.

Always check:

- the scene named by `GLADE.md` and the story opens;
- the changed behavior can be completed from its entry state;
- input, camera, UI, audio, and feedback match the story acceptance criteria;
- success, failure, and retry states behave as specified;
- Unity Console has no new errors.

For the uncustomized starter baseline, check:

- `Assets/Scenes/StarterScene.unity` opens;
- `StarterBootstrap`, `Starter Object`, and `Main Camera` exist;
- Play Mode creates `__StarterReady`;
- the cube is visible in the Game view.

Return failures with reproduction steps and expected versus actual behavior.
