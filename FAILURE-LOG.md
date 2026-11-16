# FAILURE-LOG.md — first-class evidence artifact

**Rule**: failures and verifier-script errors are recorded with the same weight as successes. Zero-defect evidence chains are untrustworthy by default.

| # | Date | What failed | Why it matters | Caught by | Resolution |
|---|------|-------------|----------------|-----------|------------|
| 1 | 2026-11-16 | Round-1 battery: unsigned-group TV-B1/B2/B3 not falsifiable (no owner truth table / no signature coverage) | Three vectors were counting nothing; would have read as "14 mutations denied" | Own battery + hard gate ("disagreement = draft defect, not limitation") | v0.2: owner-map context (B1), signed-group move (B2/B3), sign-then-mutate discipline — commit 249600e |
| 2 | 2026-11-16 | Generator bug: mutated-then-signed fixtures made mutations self-consistent (fake green) | Signature covered the tampered bytes themselves | Own battery (B2/B3 signed rows unexpectedly ALLOW) | Reordered sign→mutate in gen-fixtures.py; kept raw outputs |
| 3 | 2026-11-16 | Reconciliation script mis-flagged expected labels (battery_pass=false on correct output) | Verifier output was right; the checker was wrong | Cross-checking detail rows | Expected-class fixed (unsigned b2/b3 = ALLOW controls); raw first run preserved in round-1/ |
| 4 | 2026-11-16 | External posting: modelcontextprotocol org blocks all issue/discussion/private-report channels for DSHCorrectover | SEP/comment delivery path dead for this identity | REST + GraphQL probes (FORBIDDEN on discussion write despite write:discussion scope) | Switched to public dev.to publication; identity remediation needs owner action |

Lessons (standing rules): generators never participate in judgment; expected labels must derive from the spec text, not from generator authors; every reconciliation runs twice against both verifiers.
