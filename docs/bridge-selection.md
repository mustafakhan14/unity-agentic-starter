# Unity Agent Bridge Selection

Bridge choice is capability-based. The versioned source of truth is
`config/unity-bridge-registry.json`; `docs/hybrid-bridge-strategy.md` explains
the operating and promotion policy.

## Current Baseline

- GladeKit is required by the starter and handles broad typed Unity operations,
  `GLADE.md` context, hierarchy, components, scripts, console, and ordinary
  scene or asset work.
- Official Unity MCP is opt-in and becomes primary for native capture, exact
  Editor targeting, Play Mode control, and project-local typed custom tools.
- Filesystem and manual Editor routes remain explicit local fallbacks.
- Exactly one bridge owns each mutation sequence. A second bridge can only
  cross-check read-only state after completion.

Inspect the current machine and select a route with:

```bash
scripts/bridge-status.mjs --static
scripts/bridge-status.mjs --recommend hierarchy_inspection
scripts/bridge-status.mjs --recommend screenshot_capture
```

## Provider Matrix

| Provider | Best use | Main limitation |
| --- | --- | --- |
| GladeKit MCP | Default typed Unity operations, project context, script search, hierarchy, components, console | No native capture in pinned `0.7.16`; fixed local bridge endpoint |
| Official Unity MCP | Native capture, project/PID targeting, Play Mode, signed approvals, project-local custom tools | Pre-release Assistant package, narrower default tools, account warnings, broad `Unity_RunCommand` escape hatch |
| CoplayDev Unity MCP | Candidate for mature resource-first operation and harness patterns | Requires a separate Python/FastMCP stack and a new bakeoff |
| CoderGamester MCP Unity | Candidate for a compact Node/WebSocket bridge | Narrower surface than the current baseline |
| IvanMurzak Unity-MCP | Candidate for generated skills, broad tools, and runtime/custom extension patterns | Requires a clean install, license audit, and controlled bakeoff |
| akiojin unity-cli | Typed CLI fallback when MCP is unavailable | Not an MCP-native Editor connection |

## Tracked Implementations

- `Glade-tool/glade-mcp`
- `CoplayDev/unity-mcp`
- `CoderGamester/mcp-unity`
- `IvanMurzak/Unity-MCP`
- `akiojin/unity-cli`

These are candidates or evidence sources, not automatically enabled providers.

## Admission Rules

1. Add a candidate to the registry in read-only shadow mode.
2. Pin source and version; record license, transport, ports, machine state,
   accounts, terms, cloud calls, package size, and rollback.
3. Run the sample and recovery thresholds in
   `docs/hybrid-bridge-strategy.md`.
4. Require Undo-aware mutation evidence before mutation eligibility.
5. Change a primary route or default provider only through human review.

Package presence never proves readiness. Verify live health, exact project,
console access, domain reload, and provider-specific smoke behavior.

## Configuration

- GladeKit client example: `.mcp.example.json`
- Hybrid Codex example: `config/mcp-hybrid.example.toml`
- GladeKit smoke: `scripts/mcp-smoke-check.sh`
- Official smoke: `scripts/official-unity-mcp-smoke.mjs`
- Controlled comparison: `docs/unity-mcp-bakeoff.md`

Do not commit credentials or personal client configuration. Do not call
`Unity_AssetGeneration_*` tools without separate explicit approval for the
exact operation, terms, and possible cost.
