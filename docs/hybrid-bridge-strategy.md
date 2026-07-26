# Hybrid Unity Bridge Strategy

Use bridges by capability, not brand. GladeKit is the starter's baseline because
it provides broad typed Unity tools and durable `GLADE.md` context. Official
Unity MCP becomes the preferred route for the capabilities it demonstrated
better in the controlled bakeoff. Future providers enter through the same
registry and promotion process.

The machine-readable policy is `config/unity-bridge-registry.json`. Inspect the
current machine and project with:

```bash
scripts/bridge-status.mjs --static
scripts/bridge-status.mjs --recommend hierarchy_inspection
scripts/bridge-status.mjs --recommend screenshot_capture
```

Omit `--static` while Unity is open to require a live GladeKit health check. Use
`--json` when another script or agent needs structured output.

## Capability Routes

| Work | Primary | Fallback | Notes |
| --- | --- | --- | --- |
| Project context and script search | GladeKit | Filesystem | Keep `GLADE.md` authoritative. |
| Hierarchy and component inspection | GladeKit | Official, manual Editor | Official may read-only cross-check high-risk findings. |
| Console | GladeKit | Official, manual Editor | Read-only cross-check is allowed. |
| Asset and ordinary scene operations | GladeKit | Official for scene operations | Asset imports still require explicit license approval. |
| Native camera or multi-angle capture | Official | Manual Editor | The pinned GladeKit bridge has no native capture tool. |
| Exact project/PID targeting | Official | Manual Editor | Verify the exact project before every mutation. |
| Play Mode control | Official | Manual Editor | Automated tests remain authoritative. |
| Project-local typed MCP tools | Official | None | Add only for repeated, tested workflows. |
| Domain reload recovery | GladeKit | Official | Re-read state after reconnection. |

The JSON registry is authoritative when this table and the policy disagree.

## Mutation Ownership

Exactly one bridge owns a mutation sequence. Select it before the first write and
keep it as owner through Undo, save, compile, and console verification. Do not
have two bridges mutate the same scene, prefab, asset, or package in one sequence.

A second bridge may verify read-only state after the owner finishes. It must not
"repair" a discrepancy automatically. Stop, report the mismatch, re-read the
active project and scene, and choose a new mutation owner explicitly.

## Profiles

### Baseline

- GladeKit package and `uvx gladekit-mcp` enabled.
- Official package absent.
- Manual Editor fills native-capture and Play Mode control gaps.

This profile is the reusable starter default.

### Full Hybrid

- GladeKit remains available for broad typed operations.
- `com.unity.ai.assistant` and the official relay are deliberately installed.
- The user has accepted only the required MCP disclaimer and approved the exact
  client connection.
- Official asset-generation tools remain forbidden.

Run `scripts/official-unity-mcp-smoke.mjs` before routing work to the official
bridge. After it passes, set `UNITY_MCP_READY=1` only for the session that
will use the verified official connection. Do not link Unity Cloud, start a trial, consume credits, or enable paid
features as part of bridge setup.

### Candidate Shadow Mode

New native or open-source bridges start read-only. Compare hierarchy, component,
console, and timing results against an accepted provider without allowing the
candidate to mutate project state. Promotion to mutation work requires the gate
below.

## Evolution Gate

Add a provider or update a pinned bridge in a dedicated story. Update the
registry with its declared capabilities and record:

1. License, package source, version pin, transport, ports, and account needs.
2. Exact project targeting and connection approval behavior.
3. At least 50 successful read samples across hierarchy, components, and console.
4. At least 10 Undo-verified mutation samples before mutation eligibility.
5. Compile/domain-reload and Play Mode recovery.
6. Screenshot support, latency, failure modes, and tool coverage.
7. Package size, persistent machine state, cloud calls, terms, and possible cost.
8. A rollback procedure that restores packages and client configuration.

Changing the default provider or a capability's primary route always requires a
human-reviewed registry change. A package update never promotes itself.

## Failure Rules

- If the selected provider is unavailable before a mutation, choose the next
  available route and record the fallback.
- If it fails after a mutation begins, do not fail over blindly. Inspect Unity,
  Undo or restore the partial change, and restart the sequence with one owner.
- Never infer availability from package presence alone. Use live health, exact
  project checks, console evidence, and the provider-specific smoke harness.
- Never call a tool whose name begins with `Unity_AssetGeneration_` without new,
  explicit approval for the exact operation, terms, and possible cost.
