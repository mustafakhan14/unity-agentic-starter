# Local Models

Codex is the primary implementation agent. A local model is an optional,
offline second-pass reviewer for Unity API risk; it is not the implementation
authority. Unity compile, tests, MCP/editor state, and local package code remain
the source of truth.

## 80/20 Recommendation

Do not download another model just to satisfy the workflow. First use a capable
coder model that is already installed, for example:

```bash
UNITY_REVIEW_MODEL=qwen2.5-coder:14b scripts/unity-model-reviewer.sh --smoke
```

Run `scripts/unity-model-reviewer.sh --check` before a normal review. The script
fails fast rather than implicitly downloading its configured model.

Treat a Unity-tuned model as an evaluation candidate, not a required dependency.
The current candidate is
`parashm/Qwen2.5-Coder-7B-Instruct-Unity-Q6_K-GGUF:Q6_K`. Pull it explicitly only
after deciding the local review benefit is worth the disk and download cost:

```bash
ollama pull hf.co/parashm/Qwen2.5-Coder-7B-Instruct-Unity-Q6_K-GGUF:Q6_K
```

Then smoke-test it:

```bash
scripts/unity-model-reviewer.sh --smoke
```

Recommended review command after Unity C# or package changes:

```bash
git diff -- Assets/Scripts Assets/Tests Packages ProjectSettings | scripts/unity-model-reviewer.sh
```

An installed general coder model is sufficient for advisory review unless a
repo-specific evaluation shows that the Unity-tuned candidate catches more real
issues without adding excessive false positives.

## Role In This Repo

Ask the model to find:

- invented Unity APIs
- editor-only APIs used at runtime
- missing package dependencies
- Unity 6000.5.4f1 compatibility risks
- missing `.meta` files or asset GUID churn
- tests that do not exercise the changed behavior

Do not ask it to:

- rewrite the whole feature
- make final merge decisions
- replace `scripts/verify-unity.sh`
- mutate scenes, packages, or assets

## Larger Candidate

`wrayy/Qwenity3.6-27B-msv2` is a later evaluation candidate when local hardware
and serving are proven. It should not block normal work because it is materially
heavier and less convenient than either an already-installed coder model or the
Q6_K GGUF candidate.

## Repo-Specific Fine-Tuning Policy

Do not start a repo-specific fine-tune until this project has:

- 20 to 50 representative failed and successful Unity-agent tasks
- expected findings for each task
- Unity compile/test outcomes for each task
- MCP screenshot or console evidence for scene tasks
- a repeatable evaluator script that compares reviewer output against expected findings

Until then, the high-leverage path is Codex plus deterministic verification,
with an installed local coder model used only as a cheap second opinion.

## Source Notes

- `neph1/Qwen2.5-Coder-7B-Instruct-Unity` is Apache-2.0 and based on Unity-related datasets.
- `parashm/Qwen2.5-Coder-7B-Instruct-Unity-Q6_K-GGUF` is an Apache-2.0 GGUF packaging path with Ollama/llama.cpp examples.
- `vishnuOI/unity-coder-7b` is a Qwen2.5-Coder-7B Unity C# fine-tune on `vishnuOI/unity-dev-instructions`, but its model card lists CC-BY-4.0, so treat attribution carefully.
- `vishnuOI/unity-dev-instructions` and `Hypersniper/unity_api_2022_3` are useful evaluation-set references, not datasets to copy wholesale into this repo.
