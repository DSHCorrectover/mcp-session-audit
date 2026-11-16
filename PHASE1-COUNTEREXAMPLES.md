# Phase 1 — Counterexample Register

**Rule**: A counterexample counts only if PROTOCOL controls pass and artifacts are replayable under `evidence/`.

Target for Phase 1 close: **≥3** independent, documented counterexamples of Session-as-Identity on **auth-enforced** deployments (or clearly labeled unauthenticated-surface if P-A0 fails).

---

## CX-1 — Official TypeScript SDK reference deployment (self-operated)

| Field | Value |
|-------|--------|
| Status | **Claimed in README as complete** — evidence must remain under `evidence/` and match PROTOCOL |
| Target class | TypeScript SDK 1.32.2-class reference, 3 deployment modes |
| Auth | Must show P-A0 pass (401/403 without token) for Session-as-Identity label |
| Tests | P-A1 (cross-subject tools/call), P-A2/P-A2b (cross-subject DELETE), P-Q1 attribution |
| Expected defect label | Session-as-Identity if P-A1 or P-A2 passes under enforced auth |
| Evidence path | `evidence/` (reference-implementation study dossier) |
| Re-run | `tool/` CLI against self-operated target; record sid_V, tokens never committed |

**Integrity note**: Do not cite third-party production systems. Self-operated only unless written authorization exists.

---

## CX-2 — ArchLang MCP (passive / maintainer-disclosed endpoint)

| Field | Value |
|-------|--------|
| Status | Evidence commit present (`evidence: ArchLang MCP unauthenticated-surface`, 2026-11-13) |
| Label discipline | If P-A0 fails → **Unauthenticated surface**, not Session-as-Identity |
| Evidence path | Commit trail + `evidence/` artifacts for that run |
| Action | Keep classification honest; use as surface-class contrast row in MATRIX, not as bound-auth defect |

---

## CX-3 — Slot open (required for Phase 1 close)

| Field | Value |
|-------|--------|
| Status | **OPEN** |
| Requirement | Second **auth-enforced** implementation or second deployment mode with full P-A0 → P-A1/P-A2 chain |
| Preferred | Another official SDK (Python / Go / Ruby) self-operated, or same SDK different session generator mode |
| Deliverable | New directory under `evidence/cx-3-<name>/` with: command log, redacted headers policy, verdict JSON, PROTOCOL checklist |

---

## Control-group checklist (every CX)

- [ ] P-A0 recorded (auth real or explicitly “auth: none”)
- [ ] P-A0b victim session healthy; sid_V entropy noted
- [ ] P-A1 result + whether marker tool executed
- [ ] P-A2 / P-A2b if session DELETE exists
- [ ] P-Q1 Mode A vs B if data-owning tool available
- [ ] No secrets in git; tokens redacted; only self-operated or authorized targets

---

## Phase 1 exit criteria

1. `DEFINITION.md` locked (done)
2. ≥2 auth-enforced Session-as-Identity rows with replayable evidence **or** 1 auth-enforced + clear MATRIX contrast with unauthenticated-surface
3. CX-3 filled or explicitly deferred with date
4. `INVENTION-ROADMAP.md` Phase 2 gate reviewed
