# Guardrails

## Hard Rules

- Do not manually edit scene YAML, prefab YAML, or `.meta` GUIDs unless explicitly requested.
- Do not invent Unity API names. Compile or verify locally.
- Do not require cloud APIs, paid services, telemetry, or secrets for core repo operation.
- Do not modify generated Unity folders or commit ignored cache/build output.
- Do not erase or reset untracked user files.

## Unity-Specific Risks

- Unity version drift can break APIs. The pinned editor is `6000.5.4f1`.
- Test runs may fail if Unity licensing is not warmed up.
- `StarterBootstrap` creates `__StarterReady` only in Play Mode.
- Scene/object names referenced by tests and agents are contracts; rename them
  together through Unity-safe operations.

## Agent Review Checklist

- Did the change preserve runtime behavior unless changes were requested?
- Did it keep required package dependencies minimal?
- Did it avoid scene YAML edits?
- Did it preserve `.meta` files for `Assets/` content?
- Did Unity compile and relevant tests run?
- Were console logs checked?
