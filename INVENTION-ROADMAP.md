# Invention Roadmap — Session-as-Identity → Subject-Bound Session Receipt

**Start**: 2026-11-16  
**Horizon**: 90 days  
**Success**: External citation of definition/matrix, or SEP/issue adoption of binding requirement, or independent re-run of a matrix row — not launch hype.

---

## Phase 1 — Definition & counterexamples (days 0–14)

| Deliverable | Status |
|-------------|--------|
| `DEFINITION.md` formal antinomy | **Done** 2026-11-16 |
| `PHASE1-COUNTEREXAMPLES.md` register | **Done** 2026-11-16 |
| CX-1 reference TS study evidence integrity check | In progress |
| CX-3 second auth-enforced row | Open |
| Public README points at DEFINITION | Next |

**Exit**: Definition stable; ≥1 strong auth-enforced CX fully checklisted; CX-3 scheduled.

---

## Phase 2 — Minimal binding object (days 15–42)

**Working name**: Subject-Bound Session Receipt (SBSR)

Required fields (draft, to be tightened):

- `session_id` (or hash)
- `auth_subject` (stable id of U)
- `tool` + `params_hash` (JCS/RFC8785 discipline)
- `verdict` (allow/deny)
- `iat` / optional `exp`
- Ed25519 signature over canonical bytes

Properties:

- Offline verifiable with public key only
- Second implementation must agree on vectors (reuse `independent-reader` discipline)
- Complements CCS decision receipt; may be profile or sibling object — decide in Phase 2 design note

Deliverables:

- `SBSR.md` design note + security claims (what it proves / does not prove)
- Reference issue path + vector set
- independent verifier sketch (no shared code with producer)

---

## Phase 3 — Matrix & publish (days 43–90)

- MATRIX ≥10 implementation rows (dynamic where possible; limits labeled)
- Public protocol + vectors + reference
- One primary channel: SEP comment / security advisory process / technical report
- Freeze “invention claim” language to only what external parties can re-check

---

## Hard bans

- No “world’s first” / “shocks the industry” copy
- No testing third-party production without authorization
- No secrets in git
- No conflating unauthenticated surface with Session-as-Identity

---

## Weapons used

- `mcp-session-audit` protocol & evidence discipline
- CCS / Ed25519 / JCS receipt stack (`agent-runtime-guard`, `ccs-conformance-vectors`, `independent-reader`)
- Existing CVE/SEP awareness (credit ecosystem; do not erase prior art)
