# SAMPLE VERDICT DOSSIER — subject-bound session receipt integrity

> **Free sample, full structure.** Built entirely on our own self-operated
> reference deployment (CX-3, Python SDK 2.3.0 + Bearer auth on localhost).
> No client environment was touched. It shows exactly what a paid engagement
> delivers: same six sections, same evidence discipline, same reproducibility.

**Dossier ID**: CO-AUD-2026-XXXX (unique, client-presentable)
**Register**: forensic/audit register — "authorization integrity assessment", not "security testing", not "pentest".

---

## A. Subject and environment fingerprint

- Subject: official MCP Python SDK 2.3.0 server + Bearer authentication layer (self-operated localhost target)
- Fingerprint: OS / Python / package versions / timestamps / target port — persisted, third-party rebuildable
- Authorization boundary: self-built target, zero third-party contact

## B. Test matrix and verdicts (measured, dual-verifier)

14 fixtures run through two independently written verifiers (A: Python, B: Node) —
**zero disagreements**, battery pass 2026-11-16. The finding pattern that matters:

| Fixture class | Unsigned (control) | Signed | Meaning |
|---|---|---|---|
| TV-B1 cross-subject | **ALLOW** | **DENY** | control admits another subject's call in your session; signature closes it |
| TV-B2 params mutated | **ALLOW** | **DENY** | tampered params invisible to the API layer; digest catches it |
| TV-B3 tool swapped | **ALLOW** | **DENY** | same-prefix tool substitution; receipt binds tool identity |
| TV-B4 expired / future-iat | DENY | DENY | freshness check correct in both |
| TV-B5 verdict flipped | **ALLOW** | **DENY** | a flipped decision record passes unsigned; signature makes it falsifiable |

The business finding: **the API's own auth layer cannot see any of the signed-column
attacks** — all five tamper classes pass the 401/403 boundary untouched. The receipt
layer is what turns them from silent failures into detectable ones.

## C. Evidence pack (per finding)

Per fixture: request/response captures, canonical preimage, digest recomputation,
one-command replay (`verify-A.py` / `verify-B.py`). Every claim independently
re-verifiable by an auditor with no access to our systems.

## D. Scope and non-claims

- Integrity-layer verification only — post-hoc, offline (layer separation per draft-etcheverry-action-ref -05 §5.2)
- Authorization-layer independence is a write-time property of your signing stack; we do not certify it after the fact
- Not a W3C assessment, endorsement, or conformance certification

## E. Remediation matrix

Per tamper class: binding-level remediation (Subject-Bound Session Receipt, SBSR.md),
deployment-level mitigation, residual-risk statement.

## F. Sign-off

Assessor identity, environment hashes, dossier hash chain — the dossier itself is an
artifact under the same discipline.

---

**Get yours assessed**: wangguigui@correctover.com — engagement scoping within one business day.
