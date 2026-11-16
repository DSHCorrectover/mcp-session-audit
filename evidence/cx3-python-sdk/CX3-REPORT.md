# CX-3 — Official Python MCP SDK 2.3.0 (self-operated, dynamic)

**Date**: 2026-11-16 · **Tier**: `measured (dynamic)` · **Target**: localhost only, self-operated
**Verdict label**: **Session-as-Identity** (auth-enforced target; P-A1 and P-A2 both pass)

## Environment

| Field | Value |
|-------|-------|
| SDK | `mcp` 2.3.0 (official Python SDK, `MCPServer` + streamable HTTP, stateful default) |
| Python | 3.12, venv `.venv-cx3` |
| Auth wrapper | Bearer middleware, two principals: subj-victim (token_V) / subj-attacker (token_A); invalid/absent → 401 |
| Files | `target_server.py` (target), `cx3_run.py` (probe), `verdict.json` (raw), `server.log` |

## Static corroboration (pre-run, line-level)

`mcp/server/streamable_http.py` (2.3.0) `_validate_session` (~L901-924): sole check is
`request_session_id != self.mcp_session_id` string equality — no subject comparison, matching
TypeScript SDK 1.32.2 `validateSession` (CX-1). Same defect pattern across SDK languages.

## Dynamic results (probe run 2026-11-16)

| Control | Request shape | Result | Meaning |
|---------|--------------|--------|---------|
| P-A0 no-token | POST init, no Authorization | **401** | auth is real → label eligible |
| P-A0 bad-token | POST init, bogus bearer | **401** | auth is real |
| CONTROL V+self | token_V + sid_V, tools/call | **200**, marker executed | victim session healthy pre-attack |
| **P-A1** | token_A + sid_V, tools/call | **200**, `executed note='P-A1 marker…'` | **cross-subject tool execution** |
| **P-A2** | token_A + sid_V, DELETE | **200** | **cross-subject session termination** |
| P-A2b | token_V + sid_V after A's DELETE | **404 Session not found** | victim's session killed by attacker |

## Control-group checklist (per PHASE1-COUNTEREXAMPLES.md)

- [x] P-A0 recorded (401 both invalid-cred shapes)
- [x] P-A0b victim session healthy; sid_V = UUID-class 32-hex (entropy note: opaque hex, session id)
- [x] P-A1 result + marker tool executed (attacker subject)
- [x] P-A2 / P-A2b recorded (200 kill; victim 404 after)
- [x] P-Q1: deferred (no data-owning tool in this target; attribution default is by-session per MATRIX note)
- [x] No secrets in git; tokens are dummy local values; self-operated localhost only

## Replay

```bash
python3 -m venv .venv-cx3 && .venv-cx3/bin/pip install "mcp==2.3.0" uvicorn
.venv-cx3/bin/python evidence/cx3-python-sdk/target_server.py 8931 &
.venv-cx3/bin/python evidence/cx3-python-sdk/cx3_run.py
```

## Significance

Second **auth-enforced** counterexample, different language family and major SDK version
(Python 2.x vs TypeScript 1.x). Supports the MATRIX claim that the defect is structural
(protocol-level: no binding requirement) rather than implementation-accidental.
