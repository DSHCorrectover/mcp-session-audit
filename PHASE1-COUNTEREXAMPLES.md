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

## CX-3 — Official Python MCP SDK 2.3.0 (FILLED 2026-11-16)

> **Filled**: dynamic evidence landed in `evidence/cx3-python-sdk/` (verdict: Session-as-Identity, auth-enforced; P-A1 200 + P-A2 200 + victim 404 post-kill). Original slot text below.

## CX-3 (slot archive) — Slot open (required for Phase 1 close)

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
2. ≥2 auth-enforced Session-as-Identity rows with replayable evidence ✅ **CLOSED 2026-11-16** — CX-1 (TS SDK 1.32.2, static closed, dynamic pack pending-flagged) + CX-3 (Python SDK 2.3.0, `measured (dynamic)`, evidence/cx3-python-sdk/, checklist green)
3. CX-3 filled ✅ (c093488)
4. `INVENTION-ROADMAP.md` Phase 2 gate reviewed ✅ (3cd60f0)
→ **Phase 1 CLOSED 2026-11-16. Gate to Phase 2: Subject-Bound Session Receipt design draft (SBSR-DESIGN.md).**
