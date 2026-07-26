# Local Models

Codex is the primary implementation agent. Local models are optional, offline
second-pass reviewers for Unity API risk; they are not implementation
authorities. Unity compile, tests, MCP/editor state, and local package code
remain the source of truth.

## 80/20 Recommendation

Do not download another model just to satisfy the workflow. Start with Codex and
deterministic Unity validation. Add the local reviewers below only when they are
already installed or their review value justifies the disk and download cost.

## Unity Specialist

The default specialist is
`parashm/Qwen2.5-Coder-7B-Instruct-Unity-Q6_K-GGUF:Q6_K`:

```bash
ollama pull hf.co/parashm/Qwen2.5-Coder-7B-Instruct-Unity-Q6_K-GGUF:Q6_K
scripts/unity-model-reviewer.sh --check
scripts/unity-model-reviewer.sh --smoke
```

Run it after Unity C# or package changes:

```bash
git diff -- Assets/Scripts Assets/Tests Packages ProjectSettings | scripts/unity-model-reviewer.sh
```

The Unity-tuned 7B model is a fast API skeptic. Its output can still contain
false positives or understate cross-cutting runtime/editor failures.

## Deep Reviewer

When `qwen3.6:latest` is installed, use it for high-risk changes, ambiguous
specialist findings, runtime/editor assembly boundaries, package changes, or
release checkpoints:

```bash
scripts/unity-model-reviewer.sh --deep --check
git diff -- Assets/Scripts Assets/Tests Packages ProjectSettings | scripts/unity-model-reviewer.sh --deep
```

The deep reviewer is slower and not Unity-fine-tuned. It complements the
specialist and does not replace deterministic Unity validation.

To use a different installed model without changing repository defaults:

```bash
UNITY_REVIEW_MODEL=qwen2.5-coder:14b scripts/unity-model-reviewer.sh --smoke
```

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

`wrayy/Qwenity3.6-27B-msv2` is a later evaluation candidate when local
hardware and serving are proven. It should not block normal work without a
repo-specific evaluation showing a meaningful gain.

## Repo-Specific Fine-Tuning Policy

Do not start a repo-specific fine-tune until this project has:

- 20 to 50 representative failed and successful Unity-agent tasks
- expected findings for each task
- Unity compile/test outcomes for each task
- MCP screenshot or console evidence for scene tasks
- a repeatable evaluator script that compares reviewer output against expected findings

## Current 80/20 Model Policy

1. Codex remains the main planner and implementation agent.
2. Use the Unity-tuned 7B reviewer as an optional fast specialist.
3. Add `--deep` for risky, cross-cutting, or disputed changes.
4. Resolve model findings with compile, EditMode, PlayMode, console, MCP state,
   and screenshots where relevant.
5. Do not download a larger Unity model until an evaluation set shows a likely
   gain.

## Source Notes

- `neph1/Qwen2.5-Coder-7B-Instruct-Unity` is Apache-2.0 and based on Unity-related datasets.
- `parashm/Qwen2.5-Coder-7B-Instruct-Unity-Q6_K-GGUF` is an Apache-2.0 GGUF packaging path with Ollama/llama.cpp examples.
- `vishnuOI/unity-coder-7b` is a Qwen2.5-Coder-7B Unity C# fine-tune on `vishnuOI/unity-dev-instructions`, but its model card lists CC-BY-4.0, so treat attribution carefully.
- `vishnuOI/unity-dev-instructions` and `Hypersniper/unity_api_2022_3` are useful evaluation-set references, not datasets to copy wholesale into this repo.
