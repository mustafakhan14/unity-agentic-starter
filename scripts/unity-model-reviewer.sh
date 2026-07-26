#!/usr/bin/env bash
set -euo pipefail

MODEL="${UNITY_REVIEW_MODEL:-hf.co/parashm/Qwen2.5-Coder-7B-Instruct-Unity-Q6_K-GGUF:Q6_K}"
PROMPT_FILE="${UNITY_REVIEW_PROMPT:-prompts/unity-finetuned-reviewer.md}"
MAX_INPUT_CHARS="${UNITY_REVIEW_MAX_INPUT_CHARS:-24000}"

if ! command -v ollama >/dev/null 2>&1; then
  echo "ollama is not on PATH. Install Ollama or set up another GGUF runtime." >&2
  exit 127
fi

model_is_available() {
  ollama list | awk 'NR > 1 { print $1 }' | grep -Fx "$MODEL" >/dev/null
}

if [[ "${1:-}" == "--pull" ]]; then
  ollama pull "$MODEL"
  exit 0
fi

if [[ "${1:-}" == "--check" ]]; then
  model_is_available || {
    echo "model is not available locally: $MODEL" >&2
    echo "Run: scripts/unity-model-reviewer.sh --pull" >&2
    exit 2
  }
  echo "Unity reviewer model is available: $MODEL"
  exit 0
fi

if ! model_is_available; then
  echo "model is not available locally: $MODEL" >&2
  echo "Run explicitly to download it: scripts/unity-model-reviewer.sh --pull" >&2
  exit 2
fi

if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "missing reviewer prompt: $PROMPT_FILE" >&2
  exit 1
fi

if [[ "${1:-}" == "--smoke" ]]; then
  input="Smoke test: identify one Unity API risk in a minimal scene-bootstrap project and state why compile/tests remain authoritative."
else
  input="$(cat)"
fi

if [[ ! "$input" =~ [^[:space:]] ]]; then
  echo "no review input provided on stdin" >&2
  exit 1
fi

if [[ ! "$MAX_INPUT_CHARS" =~ ^[0-9]+$ ]] || (( MAX_INPUT_CHARS < 2000 )); then
  echo "UNITY_REVIEW_MAX_INPUT_CHARS must be an integer of at least 2000" >&2
  exit 1
fi

if (( ${#input} > MAX_INPUT_CHARS )); then
  half=$((MAX_INPUT_CHARS / 2))
  omitted=$((${#input} - MAX_INPUT_CHARS))
  input="${input:0:half}

[review input truncated: ${omitted} characters omitted]

${input: -half}"
fi

prompt="$(printf '%s\n\nReview input:\n%s\n' "$(cat "$PROMPT_FILE")" "$input")"
ollama run "$MODEL" "$prompt"
