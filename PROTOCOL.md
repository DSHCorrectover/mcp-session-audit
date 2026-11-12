# Standard Experiment Protocol — MCP Session-Subject Binding Audit

Version 2026-11-12.1 · CC BY 4.0 · Every test is a single replayable script against a self-operated target.

**Principle**: no claim without a control group. Tests marked [CONTROL] must pass for any non-control verdict to count.

## Setup (attacker/victim model)

Two independently-authenticated principals: `V` (victim) and `A` (attacker). Each holds their own valid credential (e.g. Bearer token). `V` establishes a session on the target; `A` later learns `V`'s session ID **without any other credential of `V`**. The attacker's HTTP client MUST send its own valid `Authorization` header on every request.

## Tests

### P-A0 [CONTROL] — authentication layer is real
`POST /mcp` with **no** `Authorization` header.
- **Expected if auth enforced**: 401/403. If not enforced, note "auth: none" — findings remain valid but are classified "unauthenticated surface".

### P-A0b [CONTROL] — victim session is healthy
`V` performs `initialize` → `notifications/initialized` → `tools/list`. All 200.
- Record the issued `Mcp-Session-Id` (sid_V). Verify entropy class (UUIDv4 / other).

### P-A1 — authenticated cross-subject tool execution
`A` sends: own valid `Authorization`, `mcp-session-id: sid_V`, `tools/call` of a **harmless marker tool** (see Note 1).
- **Failing (secure)**: 401/403/404 with no tool execution.
- **Passing (defect)**: 200 + the marker tool executes. Record execution attribution: session owner's context vs. token subject's context (see P-Q1).

### P-A2 — authenticated cross-subject session termination
`A` sends: own valid `Authorization`, `mcp-session-id: sid_V`, `DELETE /mcp`.
- **Failing (secure)**: 401/403 (re-authentication of session ownership required).
- **Passing (defect)**: 200/202 and `V`'s subsequent valid requests now fail (P-A2b).

### P-A2b [CONTROL] — victim actually locked out
`V` re-tries `tools/list` with own valid token + sid_V. 404/400 confirms the kill was real.

### P-SL — stateless deployment surface
For servers started in stateless mode (`sessionIdGenerator: undefined` or equivalent):
`A` (or any unauthenticated caller if P-A0 shows auth: none) sends `tools/call` with **no initialize, no session header**.
- **Passing (defect surface)**: 200 + tool executes. Note: in this mode there is no session boundary at all; classification depends on P-A0.

### P-LEID — event-stream replay
`A` opens `GET /mcp` with `Accept: text/event-stream`, `mcp-session-id: sid_V`, `Last-Event-ID: 0`.
- Record whether the server opens the victim's SSE stream for `A`.

### P-Q1 — attribution qualification (two-part)
Deploy the target twice with a data-owning tool (e.g. `wallet_balance`):
- **Mode A** (data scoped to session owner — the default for servers that cannot see the HTTP request inside tool handlers): `A` with sid_V reads `V`'s data → **privilege escalation**.
- **Mode B** (data scoped to token subject — requires the server to build its own token→session binding table; the SDK provides no hook for this): `A` reads `A`'s own data → downgraded to **integrity/attribution defect**.
Record which mode the implementation makes *possible by default*.

### P-LEAK — leakage-path demonstration (to be scripted)
Demonstrate at least one realistic path by which sid_V reaches `A`: reverse-proxy access logs recording all headers, error responses echoing headers, browser-side clients persisting the session header. Each demonstration must be a replayable artifact.

## Note 1 — harmless marker tool
Targets MUST expose a read-only marker tool (e.g. `ping_marker() -> "pong:<run-id>"`) for P-A1. Never test with state-changing tools against third-party systems. All reference targets in this project are self-operated.

## Verdict vocabulary

- **Bound** — P-A1 and P-A2 both fail on an auth-enforced target.
- **Session-as-Identity** — P-A1 or P-A2 passes on an auth-enforced target.
- **Unauthenticated surface** — P-A0 shows auth is not enforced; classify findings accordingly and do **not** overstate.
- **Sessionless** — implementation removes the concept (SEP-2567 direction); P-SL applies.
