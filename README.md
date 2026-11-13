# mcp-session-audit

**Naming the "Session-as-Identity" antinomy — and giving every MCP server a free checkup.**

> **The claim**: MCP conflates a *session routing identifier* (`Mcp-Session-Id`) with a *security subject identifier*. This architectural antinomy — **Session-as-Identity** — explains an entire defect class across SDKs and deployments. We provide a cross-implementation test protocol, a replayable audit suite, and a remediation matrix.

## Why this matters

- The session ID answers *"which context am I operating in"*; authentication answers *"who is calling"*. **The MCP Streamable HTTP specification (2025-06-18) never requires these to be bound**, and the official TypeScript SDK validates a session with plain string equality only.
- The consequence is not theoretical: in an **authenticated deployment**, an attacker with *their own valid token* plus a leaked victim session ID can (1) execute tools inside the victim's session and (2) terminate the victim's session — both verified against the official reference deployment with full control-group evidence.
- The ecosystem already acknowledges the class (e.g. CVE-2026-67431, Ruby SDK "Session Poisoning"; SEP-2567 removes sessions entirely and is merged as **Final**). What's missing is a **systematic, per-implementation, testable matrix** — that is this project.

## The repository

| Path | What it is |
|---|---|
| `PROTOCOL.md` | The standardized experiment protocol (P-A0 … P-LEID2) — run it against *your* server |
| `tool/` | The audit CLI: point it at an MCP endpoint, get a matrix row back |
| `MATRIX.md` | The remediation matrix: official SDKs × deployment modes × binding/removal strategies |
| `THREAT-MODEL.md` | Precondition analysis: where session IDs leak, what an attacker actually needs |
| `evidence/` | Full audit dossier of the reference-implementation study (4 targets, 3 deployment modes, all dynamically verified) |

## Test matrix columns (what we measure per implementation)

1. Uses `Mcp-Session-Id` at all? (stateless / sessionless deployments)
2. Binds session to authenticated subject? (subject-swap test)
3. `DELETE /mcp` re-authenticates?
4. Control group: no-token request → 401? (proves auth layer is real)
5. Tool execution attribution: by session owner or by token? (privilege-escalation vs. integrity-only)
6. Remediation strategy: subject binding (SEP-1299 direction) or session removal (SEP-2567, merged Final)?

## Status

- [x] Reference-implementation dynamic study (TypeScript SDK 1.32.2, 3 deployment modes) — complete
- [x] Authenticated-subject-swap control-group experiment — complete
- [x] Attribution qualification experiment (data ownership by session vs. by token) — complete
- [ ] Cross-implementation matrix v1 (target: 10+ implementations)
- [ ] Release of audit CLI v0.1
- [ ] Responsible-disclosure wave + SEP input


## Services

Need your MCP server or deployment audited against this protocol? Correctover provides manual security audits of agent/MCP integrations — fail-closed review with an evidence dossier you can re-verify. Every engagement ships a signed, independently checkable verdict. Rates on request: wangguigui@correctover.com.


## Self-service audit API

Point it at your own MCP server and get a verdict JSON back (read-only probes, no handshake forgery):

```bash
curl -X POST https://api.correctover.com/v1/audit \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-server.example/mcp"}'
```

Backup endpoint (while the primary domain certificate finalizes): `https://correctover-api.pages.dev/v1/audit`.

Verdicts: `unauthenticated-surface` / `stateless-no-session` / `bound-or-inconclusive`. Full methodology in this repo. For a deeper engagement (fail-closed review with a signed, re-verifiable evidence dossier), contact wangguigui@correctover.com.

## Author & contact

Guigui Wang — Correctover · wangguigui@correctover.com
Independent verifier of agent-evidence systems (W3C CG, IETF agentproto contributor). We sell the verdict, and you can re-verify it yourself.

*License: CC BY 4.0 (docs) / MIT (code). All targets in this study were self-operated reference deployments; no third-party systems were tested without authorization.*
