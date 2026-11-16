# SBSR-DESIGN.md — Subject-Bound Session Receipt (Phase 2 design draft)

**Status**: DRAFT v0.1 · 2026-11-16 · License: CC BY 4.0 (docs)
**Rule**: No new cryptographic primitive. Ed25519 + JCS + SHA-256 only. No claim without a second independent verifier.

---

## 1. Problem this eliminates

Phase 1 established (CX-1 TS 1.32.2, CX-3 Python 2.3.0, both auth-enforced, dynamic/static tiers):
the server's admission decision rests on **session id string equality**, with the authenticated
subject never participating. Consequences: cross-subject tool execution (P-A1), cross-subject
session termination (P-A2), by-session attribution → privilege escalation.

**Minimal sufficient condition (to be argued, not asserted):** a deployment that cannot satisfy
simultaneously (a) cross-subject execution prevention, (b) attributable tool calls, (c) revocable
sessions, without binding S, A, and the tool-call request together in one verifiable object.

## 2. The object

```
SBSR = {
  v: 1,                       // receipt format version
  sid: <session id>,          // S — routing identifier
  sub: <authenticated subject>, // U — MUST come from verified credential, never from client body
  tool: <tool name>,
  args_hash: sha256(JCS(args)), // canonical digest of arguments
  exp: <unix ts>,             // short-lived (default 300s)
  nonce: <random 16B hex>     // replay binder
}
receipt = { sbsr, sig: Ed25519(authority_key, JCS(sbsr)) }
```

**Admission rule (fail-closed):** a tool call is admitted iff

1. credential verifies to `sub` (auth layer, unchanged),
2. `sid` matches the caller's session AND `sbsr.sid` equals it,
3. `tool` + `sha256(JCS(args))` match the presented call,
4. `exp` valid, `nonce` unseen,
5. `sig` verifies offline (no server round-trip needed for verification).

Missing/mismatched/malformed in **any** of 1-5 → reject. No partial credit.

## 3. Why each binding is load-bearing (falsifiable claims, per-claim test vector)

| Drop | Attack re-opens | Test vector |
|------|----------------|-------------|
| drop `sid` binding | session swap across same subject's sessions | TV-B1 |
| drop `sub` | CX-3 P-A1 replay (cross-subject exec) | TV-B2 |
| drop `args_hash` | call-args substitution inside admitted session | TV-B3 |
| drop `exp/nonce` | receipt replay after session revocation | TV-B4 |
| drop offline `sig` | authority becomes single point of failure / DoS | TV-B5 |

Each TV lives in `ccs-conformance-vectors` under `sbsr/` with fixed input → fixed output.

## 4. Implementations

- **Reference**: `agent-runtime-guard` stack (Ed25519/JCS already shipped in ccs-verifier).
- **Second verifier**: independent-reader discipline — separate implementation, MUST pass all TVs
  without consulting reference code. Gate: both verifiers agree on every TV and on 5 mutated
  inputs each (mutation battery).

## 5. Relation to existing lines (no prior-art erasure)

- CCS receipts: SBSR is the session-scoped specialization of the CCS receipt family; PAE
  domain-separation v2 carries the `sub` claim.
- SEP-2567 sessionless direction: SBSR is compatible — a sessionless deployment makes `sid`
  degenerate but still needs `sub`+`args`+`exp` binding for (b) and (c).

## 6. Explicit non-goals

No new crypto; no server rewrite required (SBSR is an admission-time artifact servers MAY
enforce); no claim that TS/Python SDK vendors endorsed this; no benchmark numbers in this doc.

## 7. Phase 2 exit criteria (pre-registered)

1. This draft frozen to v1.0 with all 5 TVs specified byte-exact
2. Reference verifier passes all TVs; independent verifier passes without cross-contamination
3. Mutation battery (5 mutations × both verifiers) recorded in `evidence/sbsr/`
4. One page of SBSR text ready for SEP-comment / advisory channel submission
