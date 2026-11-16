# MINIMAL-CONDITION.md — Why binding is load-bearing

**Status**: argument draft v1.0 · 2026-11-16 · falsifiable per §4
**Parent**: DEFINITION.md (Session-as-Identity), SBSR.md (the binding object)

---

## 1. Three properties a session-bearing deployment wants

- **P-x (execution isolation)**: a request is executed only if its authority derives from the
  authenticated principal, not from a transport-level handle.
- **P-a (attribution)**: for every executed tool call, the deployment can state which principal's
  authority was spent. (MCP tool handlers cannot see HTTP request context — attribution must be
  carried in something the handler receives.)
- **P-r (revocation)**: terminating a session (or credential) ends the authority of everything
  that authority issued, for every principal.

## 2. What each property requires the admission decision to consult

Let S = session id, U = authenticated subject, R = (tool, params) of a specific request.

| Property | Admission decision must consult |
|----------|-------------------------------|
| P-x | the pair (S, U) — to establish S belongs to U |
| P-a | the triple (S, U, R) — attribution of a specific call needs the specific request bound to the authority |
| P-r | S ↔ U ownership at termination time — otherwise the DELETE of S is itself an unattributed cross-subject act (P-A2 measured) |

## 3. The argument (necessity, then sufficiency sketch)

**Necessity.** Suppose the admission decision consults S but never (S,U): then possession of S
alone is sufficient to act — P-x fails by construction whenever S leaks (CX-1, CX-3 measured:
S is a header string, observable to any intermediary or co-resident logic of A). If the decision
consults (S,U) but not R: attribution defaults to by-session, and since the handler cannot see
the request, P-a degrades to "whoever held the session did it" — which under S-leakage is exactly
the privilege escalation measured in P-A1. If termination consults S alone: P-r fails as measured
(P-A2/P-A2b). Hence **any decision rule satisfying P-x ∧ P-a ∧ P-r must consult (S,U,R) together**.

**Sufficiency sketch.** A decision object that commits to (S,U,R), is integrity-protected
(signature), and freshness-checked (iat/exp) makes each failure of P-x/P-a/P-r correspond to a
deniable mutation — implemented as TV-B1 (subject swap), TV-B2 (params mutation), TV-B3 (tool
swap), TV-B4 (staleness), TV-B5 (verdict flip). The battery in `evidence/sbsr/` shows two
independent verifiers deny all ten mutations. This does not *prove* sufficiency in general; it
reduces sufficiency to a checkable artifact.

## 4. Falsification clause (what would refute this argument)

The argument is refuted by a concrete deployment that, **without consulting (S,U,R) jointly**,
satisfies all three properties — e.g. a capability model where S is itself an unforgeable
capability bound to U at issuance and single-use per call. That is a binding mechanism; it
satisfies the condition, not the negation. A genuine counterexample would need to keep S as a
bearer string at admission time and still defeat cross-subject reuse; we know of none and none is
described in the cited advisories/SEPs. Any reviewer finding one invalidates §3 and we will
amend this document rather than reframe it.

## 5. Scope limits

Argument covers deployments that (a) use session identifiers at admission time and (b) enforce
authentication (P-A0 pass). Sessionless designs sidestep P-x by removing S; they still need
(U,R) binding for P-a — SBSR degrades gracefully (`session_id` becomes degenerate).
