# Story: Trust Fresh Unity Verification Evidence

Status: Done

## Goal

Ensure `scripts/verify-unity.sh` cannot report success from stale or malformed
test-result XML, and give the verifier deterministic regression coverage that
does not require launching the real Unity Editor.

## Context

- Relevant docs: `AGENTS.md`, `docs/agent-workflow-80-20.md`, and
  `docs/checklists/story-done.md`
- Relevant scripts: `scripts/verify-unity.sh` and
  `tests/agent_setup/validate-agent-setup.sh`
- Relevant scene objects: none; this is repository infrastructure only

## Acceptance Criteria

- [x] EditMode and PlayMode result files are invalidated before each Unity test
  invocation, so a successful exit without new XML cannot reuse old evidence.
- [x] Result validation rejects missing, malformed, failed, warning,
  inconclusive, skipped, empty, or internally inconsistent test runs.
- [x] Deterministic tests cover the verifier's success, stale-result,
  failed-test, licensing, and concurrent-Editor paths with a fake Unity binary.
- [x] Existing hybrid MCP routing, model-reviewer behavior, packages, scenes,
  runtime code, and template-neutral naming remain unchanged.

## Implementation Notes

- Keep result parsing dependency-free and reusable from Node tests.
- Keep real Unity compile, EditMode, and PlayMode execution authoritative.
- Do not turn the fake-Unity regression suite into a substitute for Unity.

## Validation Evidence

- [x] `node --test tests/agent_setup/verify-unity.test.mjs` - 8/8 passed
- [x] `tests/agent_setup/validate-agent-setup.sh`
- [x] `scripts/verify-unity.sh` - compile passed, EditMode 2/2, PlayMode 1/1
- [x] Unity-tuned reviewer skipped because no Unity C# or package changed
- [x] MCP smoke skipped because no scene or Editor state changed

## Reviewer Notes

The first real Unity invocation correctly reported exit 70 because the sandbox
could not access Unity's host licensing IPC service. Unity Hub showed an active
Personal license. The same repository command passed with approved host access;
no account, Cloud, package, scene, or Editor setting was changed.
