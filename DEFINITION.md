# Session-as-Identity — Formal Definition

**Status**: Phase 1 lock · 2026-11-16  
**Track**: Invention path (Subject-Bound Session Receipt)  
**License**: CC BY 4.0  
**Rule**: No claim without control group. No “first discovery” claim.

---

## 1. Two identifiers

| Symbol | Role | Answers |
|--------|------|--------|
| **S** | Session routing identifier (`Mcp-Session-Id` or equivalent) | Which conversation / context am I in? |
| **U** | Security subject identifier (authenticated principal: token subject, user id, client id) | Who is calling? |

In a correct design, **S is not a proof of U**. Possession of S does not authorize actions as U.

---

## 2. Definition — Session-as-Identity (defect)

An MCP (or agent-tool) deployment exhibits **Session-as-Identity** when all of the following hold:

1. **Auth is real** — requests without a valid credential for the deployment are rejected (PROTOCOL P-A0).
2. **Sessions exist** — the server issues and requires a session identifier S for tool calls (not pure stateless).
3. **No subject binding** — the server accepts a tool call (or session-terminating request) when the caller presents:
   - a **valid credential for principal A**, and
   - a **live session identifier S issued to principal V** (V ≠ A),
   without proving that A owns S.
4. **Effect is real** — the call executes in V’s session context and/or terminates V’s session (PROTOCOL P-A1, P-A2, P-A2b).

Under these conditions, **S is treated as if it were U**: the session routing key is doing the work of a security subject.

**Verdict labels** (from PROTOCOL.md):

| Label | Meaning |
|-------|--------|
| **Session-as-Identity** | P-A1 or P-A2 passes on an auth-enforced target |
| **Bound** | P-A1 and P-A2 both fail on an auth-enforced target |
| **Unauthenticated surface** | P-A0 fails (auth not enforced); do not conflate |
| **Sessionless** | No session concept (SEP-2567 direction) |

---

## 3. What must be true for a system to be Bound

At least one of:

- **B1 — Subject binding**: Every use of S is checked against the authenticated U that created or was granted S; mismatch ⇒ reject.
- **B2 — Session removal**: S is not used as an authorization-relevant identifier (sessionless / request-scoped only).
- **B3 — Equivalent control**: Another mechanism that makes P-A1 and P-A2 fail under the same threat model (must be stated and tested).

Phase 2 of this track proposes a concrete B1-shaped object: **Subject-Bound Session Receipt** (decision object binding S, U, tool+args digest; offline-verifiable). That is not claimed here; Phase 1 only locks the defect definition and counterexamples.

---

## 4. Explicit non-claims

- Not first discovery of the pattern (CVE-2026-67431, SEP-2567, and others already exist).
- Not a new cryptographic primitive.
- Not “all MCP servers are vulnerable.”
- Contribution of this track: **named antinomy + measurable protocol + matrix + (later) minimal binding receipt**.

---

## 5. Pointers

- Experiment protocol: `PROTOCOL.md`
- Threat model: `THREAT-MODEL.md`
- Counterexample register: `PHASE1-COUNTEREXAMPLES.md`
- Remediation matrix: `MATRIX.md`
