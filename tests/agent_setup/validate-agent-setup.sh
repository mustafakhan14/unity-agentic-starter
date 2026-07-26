#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() {
  echo "agent setup validation failed: $*" >&2
  exit 1
}

require_file() {
  [[ -f "$1" ]] || fail "missing file: $1"
}

require_executable() {
  [[ -x "$1" ]] || fail "not executable: $1"
}

require_contains() {
  local path="$1"
  local pattern="$2"
  grep -Eq -- "$pattern" "$path" || fail "missing pattern in $path: $pattern"
}

required_files=(
  AGENTS.md
  GLADE.md
  LICENSE
  README.md
  THIRD_PARTY_NOTICES.md
  .mcp.example.json
  config/mcp-hybrid.example.toml
  config/unity-bridge-registry.json
  Assets/Scenes/StarterScene.unity
  Assets/Scenes/StarterScene.unity.meta
  Assets/Scripts/Starter.Runtime.asmdef
  Assets/Scripts/StarterBootstrap.cs
  Assets/Tests/EditMode/Starter.EditModeTests.asmdef
  Assets/Tests/EditMode/StarterSceneTests.cs
  Assets/Tests/PlayMode/Starter.PlayModeTests.asmdef
  Assets/Tests/PlayMode/StarterBootstrapPlayModeTests.cs
  docs/agent-workflow-80-20.md
  docs/bridge-selection.md
  docs/checklists/story-done.md
  docs/custom-mcp-extension-policy.md
  docs/game-architecture.md
  docs/game-design-doc.md
  docs/hybrid-bridge-strategy.md
  docs/mcp-operating-loop.md
  docs/mcp-smoke.md
  docs/prior-art.md
  docs/prior-art-audit.md
  docs/sprint-status.yaml
  docs/stories/000-template.md
  docs/template-customization-checklist.md
  docs/unity-agent-bridge.md
  docs/unity-editor-mutation-policy.md
  docs/unity-mcp-bakeoff.md
  prompts/unity-finetuned-reviewer.md
  scripts/bridge-status.mjs
  scripts/clone-prior-art.sh
  scripts/mcp-smoke-check.sh
  scripts/official-unity-mcp-smoke.mjs
  scripts/unity-model-reviewer.sh
  scripts/lib/bridge-policy.mjs
  scripts/lib/unity-test-results.mjs
  tests/agent_setup/bridge-policy.test.mjs
  tests/agent_setup/verify-unity.test.mjs
  scripts/verify-unity.sh
)

for file in "${required_files[@]}"; do
  require_file "$file"
done

shell_scripts=(
  scripts/clone-prior-art.sh
  scripts/mcp-smoke-check.sh
  scripts/unity-model-reviewer.sh
  scripts/verify-unity.sh
)

for script in "${shell_scripts[@]}"; do
  require_executable "$script"
  bash -n "$script"
done

require_executable scripts/official-unity-mcp-smoke.mjs
require_executable scripts/bridge-status.mjs
node --check scripts/official-unity-mcp-smoke.mjs
node --check scripts/bridge-status.mjs
node --check scripts/lib/bridge-policy.mjs
node --check scripts/lib/unity-test-results.mjs
node --test \
  tests/agent_setup/bridge-policy.test.mjs \
  tests/agent_setup/verify-unity.test.mjs

for generated_dir in Library Temp Obj Logs Build Builds UserSettings; do
  git check-ignore -q --no-index "${generated_dir}/.agent-setup-probe" ||
    fail "Unity generated directory is not ignored: ${generated_dir}/"
done

while IFS= read -r -d '' asset; do
  [[ -e "${asset}.meta" ]] || fail "missing Unity meta file: ${asset}.meta"
done < <(find Assets -mindepth 1 ! -name '*.meta' -print0)

node -e "for (const f of process.argv.slice(1)) JSON.parse(require('fs').readFileSync(f, 'utf8'));" \
  .mcp.example.json \
  config/unity-bridge-registry.json \
  Packages/manifest.json \
  Packages/packages-lock.json \
  Assets/Scripts/Starter.Runtime.asmdef \
  Assets/Tests/EditMode/Starter.EditModeTests.asmdef \
  Assets/Tests/PlayMode/Starter.PlayModeTests.asmdef

skills=(
  unity-csharp-change
  unity-custom-mcp-extension
  unity-mcp-operating-loop
  unity-playmode-testing
  unity-scene-inspect
)

for skill in "${skills[@]}"; do
  require_file "docs/agent-skills/${skill}/SKILL.md"
  require_file ".agents/skills/${skill}/SKILL.md"
  cmp "docs/agent-skills/${skill}/SKILL.md" ".agents/skills/${skill}/SKILL.md" >/dev/null ||
    fail "skill mirror differs: ${skill}"
done

require_contains README.md "github\.com/mustafakhan14/unity-agentic-starter"
require_contains README.md "template-customization-checklist\.md"
require_contains README.md "Capability-routed hybrid MCP"
require_contains README.md "THIRD_PARTY_NOTICES\.md"
require_contains AGENTS.md "Assets/Scenes/StarterScene\.unity"
require_contains AGENTS.md "one mutation owner"
require_contains AGENTS.md "bridge-status\.mjs"
require_contains AGENTS.md "Undo\.RecordObject"
require_contains AGENTS.md "domain reload"
require_contains AGENTS.md "port conflicts"
require_contains AGENTS.md "main thread"
require_contains AGENTS.md "tool schemas"
require_contains GLADE.md "__StarterReady"
require_contains GLADE.md "UNSET"
require_contains GLADE.md "unity-bridge-registry\.json"
require_contains Packages/manifest.json "com\.gladekit\.mcp-bridge"
require_contains Packages/manifest.json "57f7e1930726079e3c44475877a514758ea2545f"
require_contains ProjectSettings/ProjectVersion.txt "6000\.5\.4f1"
require_contains ProjectSettings/EditorBuildSettings.asset "Assets/Scenes/StarterScene\.unity"
require_contains docs/bridge-selection.md "Bridge choice is capability-based"
require_contains docs/hybrid-bridge-strategy.md "Exactly one bridge owns a mutation sequence"
require_contains docs/hybrid-bridge-strategy.md "Candidate Shadow Mode"
require_contains docs/template-customization-checklist.md "PlayerSettings\.productName"
require_contains docs/unity-editor-mutation-policy.md "Undo\.RecordObject"
require_contains docs/unity-editor-mutation-policy.md "licenseAcknowledged"
require_contains docs/custom-mcp-extension-policy.md "MCP Tool"
require_contains docs/custom-mcp-extension-policy.md "MCP Resource"
require_contains docs/custom-mcp-extension-policy.md "MCP Prompt"
require_contains docs/custom-mcp-extension-policy.md "Runtime-In-Game"
require_contains docs/mcp-smoke.md "__StarterReady"
require_contains docs/mcp-smoke.md "0\.7\.16"
require_contains docs/mcp-smoke.md "manual Editor screenshot"
require_contains docs/mcp-operating-loop.md "Resource-First Loop"
require_contains docs/agent-workflow-80-20.md "Story Size"
require_contains docs/checklists/story-done.md "Unity-tuned local reviewer"
require_contains docs/sprint-status.yaml "template-ready"
require_contains docs/local-models.md "parashm/Qwen2\.5-Coder-7B-Instruct-Unity-Q6_K-GGUF"
require_contains prompts/unity-finetuned-reviewer.md "6000\.5\.4f1"
require_contains scripts/unity-model-reviewer.sh "UNITY_REVIEW_MODEL"
require_contains scripts/unity-model-reviewer.sh "UNITY_DEEP_REVIEW_MODEL"
require_contains scripts/verify-unity.sh "require_test_results"
require_contains scripts/verify-unity.sh "unity-test-results\.mjs"
require_contains scripts/verify-unity.sh "UNITY_VERIFY_ARTIFACT_ROOT"
require_contains scripts/verify-unity.sh "EDITMODE_RESULTS"
require_contains scripts/lib/unity-test-results.mjs "warnings"
require_contains scripts/lib/unity-test-results.mjs "categorized"
require_contains scripts/verify-unity.sh "another Unity instance is running with this project open"
require_contains scripts/mcp-smoke-check.sh "get_scene_hierarchy"
require_contains scripts/mcp-smoke-check.sh "get_unity_console_logs"
require_contains scripts/mcp-smoke-check.sh "wrong project"
require_contains scripts/bridge-status.mjs "--recommend"
require_contains scripts/lib/bridge-policy.mjs "chooseProvider"
require_contains config/unity-bridge-registry.json "singleMutationOwner"
require_contains config/unity-bridge-registry.json "Unity_AssetGeneration_"
require_contains scripts/official-unity-mcp-smoke.mjs "Assets/Scenes/StarterScene\.unity"
require_contains scripts/official-unity-mcp-smoke.mjs 'startsWith\("Unity_AssetGeneration_"\)'
require_contains THIRD_PARTY_NOTICES.md "GladeKit MCP"
require_contains THIRD_PARTY_NOTICES.md "CoplayDev MCP for Unity"
require_contains THIRD_PARTY_NOTICES.md "CoderGamester MCP Unity"
require_contains THIRD_PARTY_NOTICES.md "akiojin unity-cli"
require_contains THIRD_PARTY_NOTICES.md "IvanMurzak Unity-MCP"
require_contains LICENSE "MIT License"
require_contains docs/prior-art-audit.md "Apache-2\.0"

for repo in \
  "Glade-tool/glade-mcp" \
  "CoplayDev/unity-mcp" \
  "CoderGamester/mcp-unity" \
  "akiojin/unity-cli" \
  "IvanMurzak/Unity-MCP"; do
  require_contains docs/bridge-selection.md "$repo"
done

if grep -R -q "/Users/mukhan" README.md AGENTS.md GLADE.md config docs prompts scripts .mcp.example.json; then
  fail "shareable guidance contains a machine-specific absolute path"
fi

if grep -R -Eqi \
  'DetectiveRoom|__DetectiveRoomGenerated|Broken Glass|Radio Dispatcher|locked_door|broken_glass|Saad' \
  README.md AGENTS.md GLADE.md Assets docs prompts scripts ProjectSettings; then
  fail "template tip still contains extracted game or old repository identifiers"
fi

if grep -q 'com\.unity\.ai\.assistant' Packages/manifest.json; then
  fail "official Unity AI package must remain opt-in"
fi

if find . -mindepth 3 -path '*/ProjectSettings/ProjectVersion.txt' -print -quit | grep -q .; then
  fail "nested Unity project detected"
fi

if git ls-files | grep -Eq '^(Library|Temp|Obj|Logs|Build|Builds|UserSettings)/'; then
  fail "generated or personal Unity state is tracked"
fi

node scripts/bridge-status.mjs --static --recommend hierarchy_inspection --json >/dev/null
scripts/mcp-smoke-check.sh --static

echo "Agent setup validation passed."
