# Remediation Matrix — MCP Session-Subject Binding

Version 2026-11-12 (v0.1, evolving). Columns per PROTOCOL.md. Every "measured" cell is dynamically verified against a self-operated reference deployment with a replayable script; "reported" cells cite public records (advisory/SEP) and will be re-measured per implementation.

| Implementation | Deployment mode | Session header? | Auth enforced (P-A0)? | Binds subject (P-A1)? | DELETE re-auth (P-A2)? | Attribution default (P-Q1) | Remediation strategy | Status |
|---|---|---|---|---|---|---|---|---|
| **TypeScript SDK 1.32.2** (official) | stateful (reference wiring) | yes (UUIDv4) | yes (measured 401 control) | **NO — measured** | **NO — measured 200+lockout** | by session → **privilege escalation** | upstream: TBD (issue pending) | measured |
| TypeScript SDK 1.32.2 | stateless | no | yes | n/a — **no boundary at all; tool exec with zero handshake measured** | n/a | by session | — | measured |
| TypeScript SDK 1.32.2 | resumability (eventStore) | yes | yes | **NO — measured** | — | by session | — | measured (partial) |
| Ruby SDK | SSE/streamable | yes | — | **NO — CVE-2026-67431** ("Session Poisoning") | — | — | fixed commits (95feef2, 3546660) | reported (OSV) |
| Python SDK | streamable | yes | — | subject-binding defect class acknowledged by ecosystem | — | — | — | to measure |
| SEP-2567 (protocol direction) | sessionless | **removed** (merged Final 2026-05-07) | — | removes the antinomy by construction | n/a | explicit state handles | **session removal** | spec |
| SEP-1299 (protocol direction) | stateful | yes | — | **binds** client session ↔ server-side authorization management | required | by token | **subject binding** | spec (closed; direction survives in SEP-2567 rationale) |

## Reading the matrix

- The defect class is **not** "one SDK bug". The TypeScript reference implementation (current, authenticated wiring) exhibits it in every deployment mode; the Ruby SDK's CVE confirms cross-language presence; the protocol itself (2025-06-18) never requires binding.
- Two coherent fixes exist and they are alternatives, not competitors: **bind** (make sid a capability bound to the subject) or **remove** (SEP-2567's sessionless MCP). The matrix's purpose is to measure which direction each implementation actually took, and what compatibility cost each choice carries.
- "Attribution default" is the severity hinge: MCP tool handlers cannot see the HTTP request, so **by-session attribution is the default reality** — which makes cross-subject tool execution a privilege escalation, not merely a routing bug. Only servers that hand-roll their own token→session binding (the SDK provides no hook) downgrade to integrity-only.

## Contribute

Run `PROTOCOL.md` against your server (self-operated targets only), submit a row via PR with your replay script attached.
