#!/usr/bin/env bash
set -euo pipefail

HARNESS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$HARNESS_ROOT"
UNITY_VERSION="${UNITY_VERSION:-6000.5.4f1}"
UNITY_BIN="${UNITY_BIN:-/Applications/Unity/Hub/Editor/${UNITY_VERSION}/Unity.app/Contents/MacOS/Unity}"
ARTIFACT_ROOT="${UNITY_VERIFY_ARTIFACT_ROOT:-${PROJECT_ROOT}/Logs}"
LOG_DIR="${ARTIFACT_ROOT}/Verification"
RESULTS_DIR="${ARTIFACT_ROOT}/TestResults"
RESULT_READER="${HARNESS_ROOT}/scripts/lib/unity-test-results.mjs"
UNITY_TIMEOUT_SECONDS="${UNITY_TIMEOUT_SECONDS:-600}"
UNITY_POLL_INTERVAL_SECONDS="${UNITY_POLL_INTERVAL_SECONDS:-2}"

mkdir -p "$LOG_DIR" "$RESULTS_DIR"

if [[ ! -x "$UNITY_BIN" ]]; then
  echo "Unity editor not found or not executable: $UNITY_BIN" >&2
  echo "Install Unity ${UNITY_VERSION} or set UNITY_BIN to the editor executable." >&2
  exit 127
fi

run_unity() {
  local name="$1"
  shift
  local log_file="${LOG_DIR}/${name}.log"
  local output_file="${LOG_DIR}/${name}.output.log"

  echo "==> ${name}"
  : > "$log_file"
  : > "$output_file"
  "$UNITY_BIN" \
    -batchmode \
    -projectPath "$PROJECT_ROOT" \
    -logFile "$log_file" \
    "$@" > "$output_file" 2>&1 &
  local unity_pid=$!
  local deadline=$((SECONDS + UNITY_TIMEOUT_SECONDS))

  while kill -0 "$unity_pid" 2>/dev/null; do
    if grep -Eqs "Licensing initialization failed|Failed to connect to LicenseClient" "$log_file" "$output_file"; then
      kill "$unity_pid" 2>/dev/null || true
      wait "$unity_pid" 2>/dev/null || true
      echo "Unity licensing is not ready for batchmode." >&2
      echo "Open Unity Hub or this project in the Unity Editor once, then rerun scripts/verify-unity.sh." >&2
      echo "Log: $log_file" >&2
      echo "Output: $output_file" >&2
      exit 70
    fi

    if (( SECONDS >= deadline )); then
      kill "$unity_pid" 2>/dev/null || true
      wait "$unity_pid" 2>/dev/null || true
      echo "Unity command timed out after ${UNITY_TIMEOUT_SECONDS}s: ${name}" >&2
      echo "Log: $log_file" >&2
      echo "Output: $output_file" >&2
      exit 124
    fi

    sleep "$UNITY_POLL_INTERVAL_SECONDS"
  done

  set +e
  wait "$unity_pid"
  local status=$?
  set -e

  if grep -Eqs "Licensing initialization failed|Failed to connect to LicenseClient" "$log_file" "$output_file"; then
    echo "Unity licensing is not ready for batchmode." >&2
    echo "Open Unity Hub or this project in the Unity Editor once, then rerun scripts/verify-unity.sh." >&2
    echo "Log: $log_file" >&2
    echo "Output: $output_file" >&2
    exit 70
  fi

  if grep -Eqs "Scripts have compiler errors|Compilation failed|error CS[0-9]{4}" "$log_file" "$output_file"; then
    echo "Unity compile errors detected. Tail of log:" >&2
    tail -n 80 "$log_file" >&2
    echo "Output: $output_file" >&2
    exit 1
  fi

  if grep -Eqs "another Unity instance is running with this project open|Multiple Unity instances cannot open the same project" "$log_file" "$output_file"; then
    echo "Unity Editor already has this project open." >&2
    echo "Close ${PROJECT_ROOT} in the Unity Editor, then rerun scripts/verify-unity.sh." >&2
    echo "Log: $log_file" >&2
    echo "Output: $output_file" >&2
    exit 71
  fi

  if [[ $status -ne 0 ]]; then
    echo "Unity command failed with exit code ${status}. Tail of log:" >&2
    if [[ -s "$output_file" ]]; then
      echo "Tail of output:" >&2
      tail -n 80 "$output_file" >&2
    fi
    if [[ -f "$log_file" ]]; then
      tail -n 80 "$log_file" >&2
    fi
    exit "$status"
  fi

  echo "    log: $log_file"
  echo "    output: $output_file"
}

require_test_results() {
  local name="$1"
  local result_file="$2"

  if [[ ! -s "$result_file" ]]; then
    echo "Unity ${name} test results were not written: $result_file" >&2
    exit 72
  fi

  node "$RESULT_READER" "$name" "$result_file"
}

EDITMODE_RESULTS="${RESULTS_DIR}/editmode-results.xml"
PLAYMODE_RESULTS="${RESULTS_DIR}/playmode-results.xml"

run_unity compile -quit
: > "$EDITMODE_RESULTS"
run_unity editmode-tests -runTests -testPlatform EditMode -testResults "$EDITMODE_RESULTS"
require_test_results EditMode "$EDITMODE_RESULTS"
: > "$PLAYMODE_RESULTS"
run_unity playmode-tests -runTests -testPlatform PlayMode -testResults "$PLAYMODE_RESULTS"
require_test_results PlayMode "$PLAYMODE_RESULTS"

echo "Unity verification passed."
