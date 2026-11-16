# Subject-Bound Session Receipt (SBSR)

**Status**: Phase 2 design draft · 2026-11-16  
**Parent**: Session-as-Identity invention track (`DEFINITION.md`, `INVENTION-ROADMAP.md`)  
**Rule**: Draft only. No “standard” or “world’s first” claim. Implements **B1** (subject binding) as a checkable object.

---

## 1. Problem restated

Under Session-as-Identity, a caller may present:

- valid credential for principal **A**, and
- live session id **S** issued in the context of principal **V** (V ≠ A),

and still execute tools or terminate the session (measured: TS SDK 1.32.2, Python SDK 2.3.0).

Root pattern: **S is validated as a string, not as a capability bound to U.**

SBSR is a minimal **decision object** that makes binding explicit and optionally **offline-verifiable**.

---

## 2. What SBSR is

A receipt that attests, for one authorization decision at the tool-call (or session-control) boundary:

> Principal **U** is allowed (or denied) to use session **S** for action **X** (tool + params digest, or session-terminate), under policy **P**, at time **T**.

It does **not** replace MCP transport, OAuth, or gateway routing. It records the **bind check result** in a form a second implementation can re-verify when signatures are used.

---

## 3. Required fields (v0 draft)

| Field | Meaning |
|-------|--------|
| `sbsr_version` | `0.1` |
| `session_id` or `session_id_hash` | S or hash(S) if raw id must not leave the trust boundary |
| `auth_subject` | Stable id of U (token subject / client_id / user id) |
| `action` | `tools/call` \| `session/delete` \| extension |
| `tool` | Tool name when action is tools/call; else omit |
| `params_hash` | Hash of canonical params (JCS / RFC 8785 discipline recommended) |
| `verdict` | `allow` \| `deny` |
| `policy_id` | Optional opaque policy identifier |
| `iat` | Issued-at (unix) |
| `exp` | Optional expiry |
| `jti` | Unique id for this receipt |

**Binding rule (normative for conformant emitters):**

- Emit `allow` only if the implementation has established that **S is bound to U** (created by U, or explicitly delegated to U under a stated rule).
- If only string equality on `Mcp-Session-Id` was checked, the emitter **must not** claim SBSR conformance.

---

## 4. Signature profile (optional but required for offline re-verify)

- Payload: JCS (RFC 8785) canonical JSON of the fields above (signature field excluded).
- Alg: Ed25519 detached signature over the canonical bytes (or over `SHA-256` of those bytes — pick one in v0.2 and freeze vectors).
- Verification: public key only; no control-plane call required.

Alignment note: same evidence discipline as CCS receipts; SBSR may later be defined as a **CCS profile** or a **sibling object**. v0 keeps it sibling to avoid coupling the defect track to CCS draft politics.

---

## 5. Security claims (narrow)

**Claims**

1. A verified `allow` SBSR binds **U + S + action digest** for that `jti`.
2. Without the signing key, a third party cannot forge a valid signature (under Ed25519 assumptions).
3. A verifier that enforces SBSR on the path rejects cross-subject use of S when the bound `auth_subject` ≠ caller subject.

**Non-claims**

- Does not prevent session id leakage.
- Does not replace authentication.
- Does not prove tool side effects were safe.
- Does not claim coverage of all MCP transports without an explicit mapping.

---

## 6. Mapping to PROTOCOL tests

| Test | SBSR-conformant behavior |
|------|---------------------------|
| P-A1 | Cross-subject tools/call ⇒ `deny` receipt or hard HTTP 401/403; no tool execution |
| P-A2 | Cross-subject DELETE ⇒ `deny` or 401/403; victim session remains |
| P-A0 | Still required: auth layer real |

Conformance for an implementation = **measured** PROTOCOL rows show Bound, and (if advertising signed SBSR) vectors verify under a second implementation.

---

## 7. Phase 2 deliverables checklist

- [ ] Freeze field set + canonicalization choice (this doc → v0.2)
- [ ] JSON example + negative examples (cross-subject must not allow)
- [ ] Vector file (unsigned + signed fixtures)
- [ ] Reference emit path (minimal; self-operated only)
- [ ] Independent verify sketch (no shared code with emitter) — reuse `independent-reader` discipline
- [ ] MATRIX column or footnote: SBSR-capable yes/no

---

## 8. Relation to prior art

- CVE-2026-67431 / SEP-2567 / SEP-1299: ecosystem already knows the class; SBSR is a **bind-shaped artifact**, not discovery of the bug.
- Sessionless (SEP-2567) removes the antinomy by construction; SBSR is for deployments that **keep** sessions and need B1.

---


---

## 9. Falsifiable binding vectors (TV-B1..B5, from dual-draft merge 2026-11-16)

Each binding claim must have a byte-exact test vector: the verifier MUST `deny` when any one
component is dropped or substituted, and MUST `allow` the unmodified original.

| Vector | Claim | Mutation (must deny) |
|--------|-------|---------------------|
| TV-B1 | session bound to subject | receipt with `auth_subject` ≠ session owner |
| TV-B2 | params committed | `params_hash` recomputed over altered args |
| TV-B3 | tool committed | `tool` swapped, rest unchanged |
| TV-B4 | freshness | `exp` in past, or `iat`>now |
| TV-B5 | verdict integrity | signed bytes covering `verdict`; `allow`↔`deny` flip |

Mutation battery: 5 mutations × both verifiers, results recorded in `evidence/sbsr/`.

## 10. Dual-verifier gate (hard)

- Verifier A (reference, emitter-adjacent) and Verifier B (independent, `independent-reader`
  discipline, no shared code) must agree on every TV and on 5 mutated inputs each.
- Disagreement = draft is broken, not a "known limitation". No v1.0 freeze until zero disagreement.

## 11. Phase 2 exit criteria (pre-registered, hard)

1. This doc frozen to v1.0 with all 5 TVs byte-exact
2. Reference verifier passes all TVs; independent verifier passes without cross-contamination
3. Mutation battery (5 mutations × both verifiers) recorded in `evidence/sbsr/`
4. One page of SBSR text ready for SEP-comment / advisory channel submission
5. Argument (not assertion) of the minimal-sufficient condition: no deployment satisfies
   {anti-hijack, attribution, revocation} simultaneously without binding S, U, and the request

## 12. Evidence tier note

All fixtures under `evidence/sbsr/` labeled per INVENTION-ROADMAP.md tier table; unsigned and
signed fixture groups kept separate to avoid label mixing.

---

*Phase 1 evidence base: TS + Python official SDKs measured dynamic Session-as-Identity under auth. Phase 2 turns “must bind” into an object that can be tested and optionally re-verified offline.*
