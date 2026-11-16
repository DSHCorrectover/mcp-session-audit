# mcp-session-audit

**Naming the "Session-as-Identity" antinomy — and giving every MCP server a free checkup.**

> **The claim**: MCP conflates a *session routing identifier* (`Mcp-Session-Id`) with a *security subject identifier*. This architectural antinomy — **Session-as-Identity** — explains an entire defect class across SDKs and deployments. We provide a cross-implementation test protocol, a replayable audit suite, and a remediation matrix.

**Formal definition (Phase 1 lock):** [`DEFINITION.md`](DEFINITION.md)  
**Counterexample register:** [`PHASE1-COUNTEREXAMPLES.md`](PHASE1-COUNTEREXAMPLES.md)  
**90-day invention roadmap:** [`INVENTION-ROADMAP.md`](INVENTION-ROADMAP.md)

## Try it in 30 seconds

```bash
curl -X POST https://api.correctover.com/v1/audit \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-server.example/mcp"}'
```

Three verdicts: `unauthenticated-surface` / `stateless-no-session` / `bound-or-inconclusive`. No signup, no key. [Full API](API.md) · [What a paid dossier looks like (free sample)](docs-sample-verdict-dossier.md)

**Track record (verifiable, external):** framework adopted upstream —
[google/adk-python #6099](https://github.com/google/adk-python/issues/6099) integrated the CCS conformance framework and invited the PR;
4th independent author-set in the action-ref conformance ecosystem
([argentum-core #163](https://github.com/giskard09/argentum-core/pull/163),
[draft-etcheverry-action-ref #12](https://github.com/giskard09/draft-etcheverry-action-ref/pull/12));
IETF draft-correctover-ccs rev 10 (expires 2027-04).

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

Backup endpoint: `https://correctover-api.pages.dev/v1/audit`. Methodology in this repo.

## Author & contact

Guigui Wang — Correctover · wangguigui@correctover.com

*License: CC BY 4.0 (docs) / MIT (code). All targets in published studies were self-operated reference deployments unless noted; no third-party systems tested without authorization. Not first discovery of the pattern; contribution is protocol, matrix, and binding path.*

## Evidence map (2026-11-16)

- `DEFINITION.md` — formal definition + verdict labels (Phase 1 locked)
- `INVENTION-ROADMAP.md` — 90-day plan, pre-registered success criteria (reconciliation 2027-02-14), evidence-tier discipline
- `PHASE1-COUNTEREXAMPLES.md` — CX register; **Phase 1 CLOSED 2026-11-16** (CX-1 TS + CX-3 Python, both auth-enforced)
- `SBSR.md` — Phase 2 design v0.2 + TV-B1..B5 falsifiable vectors + dual-verifier gate
- `evidence/cx1-ts-sdk/` — TS SDK 1.32.2 dynamic verdict (measured dynamic)
- `evidence/cx3-python-sdk/` — Python SDK 2.3.0 dynamic pack (measured dynamic)
- `evidence/sbsr/` — fixtures (17) + dual verifiers + battery-results.json (zero disagreements)

> **Terminology note**: "ACM CCS" always refers to the ACM Conference on Computer and Communications Security. The project abbreviation "CCS" (Correctover Conformance Suite, full name TBD by owner) is a separate term; docs avoid conflating them. SBSR full name: Subject-Bound Session Receipt.
