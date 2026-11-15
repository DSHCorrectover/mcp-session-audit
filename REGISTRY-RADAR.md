# Ecosystem Radar — Official Registry Passive Scan v0.1 (2026-11-12)

57 servers advertising `streamable-http` remotes in the official MCP registry (pull of 2026-11-12). One benign `initialize` per endpoint. **No injection, no third-party session IDs, no state change.**

| Class | Count | Reading |
|---|---|---|
| **Unauthenticated handshake OK** | **21 (37%)** | Anonymous callers can complete `initialize` and list tools. No subject concept exists to bind. |
| OAuth-gated (401 + resource_metadata) | 12 (21%) | Correctly reject anonymous; per-protocol OAuth discovery present. Session-subject binding inside = next-phase authorized/own-account testing. |
| Other auth errors (401 plain) | 12 (21%) | Auth present, OAuth metadata absent. |
| Handshake-unreachable (404/405/edge) | 9 (16%) | Registered URLs that no longer serve standard Streamable HTTP (incl. com.workey/quote-links). Registry hygiene issue. |
| Other (timeouts) | ~3 | — |

## Session-header presence among the 21 anonymous-OK endpoints

Only **1 of 21** (`africa.lomi/mcp`, `/mcp/guest`) returns `Mcp-Session-Id`; the other 20 complete stateless-ish handshakes with no session header at all.

### Case: africa.lomi/mcp (own-session tests only)
- Own sid → 200 tools/list ✓
- **No sid → 400** "No valid MCP session ID provided"
- **Fabricated random UUID sid → 404** "Unknown MCP session"
- **Verdict: session-validating (bound-class control) — the first correct implementation in our sample.** But: guest channel is unauthenticated and exposes agent-registration tools — classified `unauthenticated-surface` for the tool plane.

## The headline finding

**The dominant MCP exposure is not "session not bound to identity" — it is "no identity at all".** 37% of officially-registered commercial servers accept anonymous tool enumeration, and among session-using ones, subject-binding is untested precisely because there is no subject. Session-as-Identity has two failure branches: implementations that *have* identity and don't bind (SDK-class), and deployments that *never established identity* (registry-class). Both need the same protocol; the remediation differs (binding vs. OAuth gating).

Raw data: `evidence/registry-probe-20261112.json`. Probe script: `probe-registry.mjs`.

---

## Radar update 2026-11-15 — Client-side governance is converging (passive, no probing)

Same week as the scan above, the two largest coding-agent CLIs shipped organizational MCP governance changes on 2026-11-13 (public changelogs):

| Client | Version | Change |
|---|---|---|
| GitHub Copilot CLI | 1.0.112 | Built-in GitHub MCP server is **no longer available when an organization's policy disables MCP servers** — org policy now reaches the built-in plane. |
| Claude Code | 2.1.325 | Remote-marketplace plugins brought under managed settings (organization-controlled); `pluginDigests` deprecated. |

**Reading:** the client side is standardizing "the org decides which MCP surfaces exist". Registry- and client-side entry controls are converging — which pushes the residual risk to the plane neither covers: **already-established sessions and post-hoc accountability** (who ran which tool, with which credential, with what side effects). That residual plane is exactly what this repository's protocol targets (see PROTOCOL.md §session-subject binding; Session-as-Identity, PASSIVE-OBSERVATIONS.md).

Sources: agentvera.dev/en/agent-changelog (2026-11-13 entries); havoptic.com changelog mirror. Passive observation — no client probing performed.
