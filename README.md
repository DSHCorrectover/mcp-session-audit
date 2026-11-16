# mcp-session-audit

**Naming the "Session-as-Identity" antinomy — and giving every MCP server a free checkup.**

> **The claim**: MCP conflates a *session routing identifier* (`Mcp-Session-Id`) with a *security subject identifier*. This architectural antinomy — **Session-as-Identity** — explains an entire defect class across SDKs and deployments. We provide a cross-implementation test protocol, a replayable audit suite, and a remediation matrix.

**Formal definition (Phase 1 lock):** [`DEFINITION.md`](DEFINITION.md)  
**Counterexample register:** [`PHASE1-COUNTEREXAMPLES.md`](PHASE1-COUNTEREXAMPLES.md)  
**90-day invention roadmap:** [`INVENTION-ROADMAP.md`](INVENTION-ROADMAP.md)

## Why this matters

- The session ID answers *"which context am I operating in"*; authentication answers *"who is calling"*. **The MCP Streamable HTTP specification (2025-06-18) never requires these to be bound**, and the official TypeScript SDK validates a session with plain string equality only.
- The consequence is not theoretical: in an **authenticated deployment**, an attacker with *their own valid token* plus a leaked victim session ID can (1) execute tools inside the victim's session and (2) terminate the victim's session — both verified against the official reference deployment with full control-group evidence.
- The ecosystem already acknowledges the class (e.g. CVE-2026-67431, Ruby SDK "Session Poisoning"; SEP-2567 removes sessions entirely and is merged as **Final**). What's missing is a **systematic, per-implementation, testable matrix** — that is this project.

## The repository

| Path | What it is |
|---|---|
| `DEFINITION.md` | Formal definition of the Session-as-Identity antinomy + Bound criteria |
| `PROTOCOL.md` | Standardized experiment protocol (P-A0 … P-LEID) — run it against *your* server |
| `PHASE1-COUNTEREXAMPLES.md` | Counterexample register and control-group checklist |
| `INVENTION-ROADMAP.md` | 90-day path toward Subject-Bound Session Receipt |
| `tool/` | Audit CLI: point it at an MCP endpoint, get a matrix row back |
| `MATRIX.md` | Remediation matrix: SDKs × deployment modes × binding/removal strategies |
| `THREAT-MODEL.md` | Precondition analysis: where session IDs leak, what an attacker needs |
| `evidence/` | Audit dossiers (self-operated targets; replayable) |

## Test matrix columns (what we measure per implementation)

1. Uses `Mcp-Session-Id` at all? (stateless / sessionless deployments)
2. Binds session to authenticated subject? (subject-swap test)
3. `DELETE /mcp` re-authenticates?
4. Control group: no-token request → 401? (proves auth layer is real)
5. Tool execution attribution: by session owner or by token? (privilege-escalation vs. integrity-only)
6. Remediation strategy: subject binding or session removal (SEP-2567, merged Final)?

## Status

- [x] Formal definition locked (DEFINITION.md)
- [x] Reference-implementation dynamic study (TypeScript SDK class, multiple modes)
- [x] Authenticated-subject-swap control-group experiment
- [x] Attribution qualification experiment
- [ ] CX-3 second auth-enforced counterexample (Phase 1 open item)
- [ ] Cross-implementation matrix v1 (target: 10+ implementations)
- [ ] Subject-Bound Session Receipt design (Phase 2)
- [ ] Release of audit CLI v0.1
- [ ] Responsible-disclosure wave + SEP input

## Services

Need your MCP server or deployment audited against this protocol? Correctover provides manual security audits of agent/MCP integrations — fail-closed review with an evidence dossier you can re-verify. Rates on request: wangguigui@correctover.com.

## Self-service audit API

```bash
curl -X POST https://api.correctover.com/v1/audit \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-server.example/mcp"}'
```

Backup: `https://correctover-api.pages.dev/v1/audit`.

Verdicts: `unauthenticated-surface` / `stateless-no-session` / `bound-or-inconclusive`. Methodology in this repo.

## Author & contact

Guigui Wang — Correctover · wangguigui@correctover.com

*License: CC BY 4.0 (docs) / MIT (code). All targets in published studies were self-operated reference deployments unless noted; no third-party systems tested without authorization. Not first discovery of the pattern; contribution is protocol, matrix, and binding path.*
