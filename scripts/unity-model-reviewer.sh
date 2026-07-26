#!/usr/bin/env bash
set -euo pipefail

SPECIALIST_MODEL="${UNITY_SPECIALIST_REVIEW_MODEL:-hf.co/parashm/Qwen2.5-Coder-7B-Instruct-Unity-Q6_K-GGUF:Q6_K}"
DEEP_MODEL="${UNITY_DEEP_REVIEW_MODEL:-qwen3.6:latest}"
MODEL="${UNITY_REVIEW_MODEL:-$SPECIALIST_MODEL}"
PROMPT_FILE="${UNITY_REVIEW_PROMPT:-prompts/unity-finetuned-reviewer.md}"
MAX_INPUT_CHARS="${UNITY_REVIEW_MAX_INPUT_CHARS:-24000}"
MODE_ARGS=()

if [[ "${1:-}" == "--deep" ]]; then
  MODEL="$DEEP_MODEL"
  MODE_ARGS=(--deep)
  shift
fi

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
    echo "Run: scripts/unity-model-reviewer.sh ${MODE_ARGS[*]} --pull" >&2
    exit 2
  }
  echo "Unity reviewer model is available: $MODEL"
  exit 0
fi

if ! model_is_available; then
  echo "model is not available locally: $MODEL" >&2
  echo "Run explicitly to download it: scripts/unity-model-reviewer.sh ${MODE_ARGS[*]} --pull" >&2
  exit 2
fi

if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "missing reviewer prompt: $PROMPT_FILE" >&2
  exit 1
fi

if [[ "${1:-}" == "--smoke" ]]; then
  input="$(cat <<'EOF'
Synthetic review smoke test. This is test input, not repository code:

diff --git a/Assets/Scripts/BadUnityChange.cs b/Assets/Scripts/BadUnityChange.cs
new file mode 100644
--- /dev/null
+++ b/Assets/Scripts/BadUnityChange.cs
@@
+using UnityEditor;
+using UnityEngine;
+
+public class BadUnityChange : MonoBehaviour
+{
+    private void Update()
+    {
+        AssetDatabase.Refresh();
+        Physics.RaycastAsync(transform.position, Vector3.forward);
+    }
+}

Identify the editor/runtime boundary violation and invented API, then return a block verdict. State that Unity compile/tests remain authoritative.
EOF
)"
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
ollama run "$MODEL" "$prompt" --hidethinking
