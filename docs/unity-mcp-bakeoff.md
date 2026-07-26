# Unity MCP Versus GladeKit Bakeoff

Date: 2026-07-25

## Decision

Keep GladeKit MCP as the default bridge.

Unity MCP is a useful opt-in secondary bridge for native captures, exact
project/PID targeting, signed client approvals, Play Mode control, and
project-local custom MCP tools. It does not win the repo-wide 80/20 decision
because the tested package is a large pre-release AI Assistant dependency,
exposes only 7 of 54 tools by default, and routes most general Editor work
through a free-form C# command tool instead of GladeKit's 267 typed tools.

Do not add `com.unity.ai.assistant` to the default package manifest solely for
MCP access. Install it only for a task that needs one of the official bridge's
specific advantages.

## Tested State

- Unity: `6000.5.4f1`
- GladeKit Unity bridge: pinned commit
  `57f7e1930726079e3c44475877a514758ea2545f`
- Unity AI Assistant: `2.16.0-pre.1`
- Unity relay: `unity-ai-relay v1.0.12-build.97`
- Target: the Unity project at the repository root
- Current harness scene: `Assets/Scenes/StarterScene.unity`
- Unity Cloud project: not linked
- Unity Services: disabled
- Paid AI/trial/generation: not enabled or invoked

The official package occupied about 593 MB unpacked in `Library/PackageCache`.
The persistent macOS relay occupied about 63 MB under `~/.unity/relay`.

## Results

| Criterion | GladeKit | Official Unity MCP | Result |
| --- | --- | --- | --- |
| Exact project/PID targeting | Partial: validates the connected project, but the Unity bridge is a fixed local endpoint without a per-client PID selector | Pass: `--project-path` was exercised; `--instance-id`/PID is supported by the installed relay | Unity MCP |
| Hierarchy and components | Pass: dedicated typed hierarchy and component tools | Pass: verified through `Unity_RunCommand`, but not through a default dedicated hierarchy tool | GladeKit ergonomics |
| Console access | Pass: dedicated console tool | Pass: `Unity_GetConsoleLogs` | Tie |
| Screenshot/capture | Fail natively in pinned `0.7.16`; manual Editor capture required | Pass: 1920x1080 camera capture and 1024x1024 framed multi-angle capture | Unity MCP |
| Undo-aware mutations | Pass: live create then Editor Undo returned hierarchy count to baseline | Pass: `ExecutionResult.RegisterObjectCreation` plus live `Undo.PerformUndo` removed the test object | Tie |
| Compilation/domain reload | Pass: bridge restarted after script reload | Pass with recovery gap: two transient `Unity not detected` retries, then the same relay session returned `reloadRecovered=True` | Tie |
| Play Mode operations | Partial: state, observation, and playability probes; entering/exiting required Editor input in the tested tool set | Pass through `Unity_RunCommand`; relay reconnected after the Play Mode transition | Unity MCP |
| Custom MCP extensibility | Partial: requires modifying/adding bridge or server packages | Partial: strong project-local typed tools through `[McpTool]`, schemas, `IUnityMcpTool<T>`, `TypeCache`, and runtime registration; no project-local resource registration was advertised and prompts were empty | Unity MCP for custom tools only |
| Connection approvals | No per-client signed approval in the tested bridge | Pass: displayed signed Unity relay and OpenAI Codex identities, then remembered the accepted identity | Unity MCP |
| Account/subscription gating | Pass: local core bridge does not require a Unity AI account or subscription | MCP calls passed with no Cloud link or AI entitlement, but package emitted repeated entitlement 404 and Account API warnings | GladeKit |
| Reliability | 70 sampled calls, 70 successes, including reload recovery | 20 console samples, 20 successes; complete smoke suite passed, with short rediscovery gaps during Play/reload | GladeKit |
| Latency | Sample medians about 179-182 ms | Console median 201 ms, mean 193 ms; captures 105-120 ms in the final run | GladeKit, narrowly |
| Default tool coverage | 267 typed Unity tools | 7 enabled of 54 reported by the Editor; 2 enabled tools were paid/generative and were not called | GladeKit |

## Live Evidence

The official smoke harness `scripts/official-unity-mcp-smoke.mjs`:

- refuses every tool whose name starts with `Unity_AssetGeneration_`;
- requires the exact target scene and `StarterBootstrap`;
- confirms `__StarterReady` and the `Starter Object` renderer/collider;
- reads console logs and records 20 latency/reliability samples;
- creates an Undo-registered temporary object, performs Undo, and verifies the
  object is gone;
- enters and exits Play Mode;
- saves camera and multi-angle captures under ignored `Logs/`;
- requests a script-domain reload and requires post-reload tool execution.

The pre-template bakeoff run passed all checks. The generalized harness keeps
the same safety checks with neutral starter assertions and should be rerun after
the official package is deliberately installed. Reports remain ignored under
`Logs/official-unity-mcp-smoke.json`.

The equivalent live GladeKit checks passed:

- `scripts/mcp-smoke-check.sh --static`
- `scripts/mcp-smoke-check.sh`
- 267 tools returned by `/api/tools/list`
- scene hierarchy and expected bootstrap objects were returned
- console retrieval succeeded after scene and domain transitions

## Account And Safety Boundary

Direct MCP worked after accepting only the Unity MCP Server disclaimer and
approving the signed Codex connection. The project remained unlinked:
`cloudProjectId`, `projectName`, and `organizationId` were empty, and
`ProjectSettings/UnityConnectSettings.asset` remained disabled.

This proves that the tested direct MCP operations were not blocked by a paid AI
entitlement. It does not authorize or validate Unity Assistant chat, AI Gateway,
asset generation, trials, credits, or other cloud-backed features.

The official tool list exposed `Unity_AssetGeneration_GenerateAsset` and
`Unity_AssetGeneration_GetModels`. Do not call either without separate explicit
user approval for terms, cost, and the exact generation task.

## Opt-In Setup

1. Add `"com.unity.ai.assistant": "2.16.0-pre.1"` to
   `Packages/manifest.json`.
2. Open the project and let Unity resolve `Packages/packages-lock.json`.
3. In `Edit > Project Settings > AI > Unity MCP Server`, review the MCP
   disclaimer. The user must personally decide whether to accept it.
4. Confirm the relay exists under `~/.unity/relay/`.
5. Configure the client with an absolute relay path and exact project path:

```toml
[mcp_servers.unity_mcp]
command = "/Users/you/.unity/relay/relay_mac_arm64.app/Contents/MacOS/relay_mac_arm64"
args = ["--mcp", "--project-path", "/absolute/path/to/unity-project"]
enabled = true
startup_timeout_sec = 120
```

6. Review and approve the signed client identity in Unity.
7. Run:

```bash
node scripts/official-unity-mcp-smoke.mjs
```

Do not link Unity Cloud, start a trial, enable paid AI, consume credits, or
accept additional terms as part of this MCP-only setup.

## Rollback

1. Remove `com.unity.ai.assistant` from `Packages/manifest.json` and reopen
   Unity so Package Manager removes its resolved dependencies from
   `Packages/packages-lock.json`.
2. Disable or remove `[mcp_servers.unity_mcp]` from the local Codex config.
3. Revoke the client in `Edit > Project Settings > AI > Unity MCP Server` if
   the package is still installed.
4. Remove `~/.unity/relay` only when no Unity project needs the official relay.

Connection decisions are stored under ignored `Library/AI.MCP/` and must not be
committed.
