# SEP Comment Draft — Session-Subject Binding (SBSR, one page)

**Status**: DRAFT for comment — not submitted. No claim of acceptance or endorsement.
**Intended channel**: modelcontextprotocol SEP discussion (comment on session management / security SEP), plus issue trackers of the two measured SDKs.
**Rule**: every factual claim below links to replayable evidence in this repository.

---

## The problem (one paragraph)

In the MCP 2025-06-18 spec, session management and authorization are specified independently:
`Mcp-Session-Id` is a routing identifier with entropy guidance, but no normative text requires the
server to bind it to the authenticated principal. Both official SDKs resolve this ambiguity the
same way — by treating the session id as the effective authority token:

- **TypeScript SDK 1.32.2**, `validateSession`: sole check is string equality against the stored
  session id (static audit: `evidence/EVIDENCE-reference-study.md`; dynamic verdict:
  `evidence/cx1-ts-sdk/verdict.json`).
- **Python SDK 2.3.0**, `streamableHttp._validate_session`: same string-equality-only check
  (static: line ~901-924; dynamic pack: `evidence/cx3-python-sdk/`).

Measured consequence on auth-enforced deployments (P-A0 control passes, i.e. auth is real):
a caller presenting **principal A's valid credential** plus **principal V's live session id** can
(1) execute tools in V's session (P-A1: 200 on both SDKs), and (2) terminate V's session
(P-A2: 200; victim then receives 404). We name this defect class **Session-as-Identity**: the
routing key is doing the work of a security subject.

## The claim (minimal sufficient condition, argued in MINIMAL-CONDITION.md)

A deployment cannot simultaneously provide cross-subject execution prevention, attributable tool
calls, and revocable sessions **without binding session id, authenticated subject, and the
individual tool-call request**. Binding is therefore not one hardening option among many; it is
the load-bearing requirement the spec currently leaves silent.

## The proposal (SBSR)

**Subject-Bound Session Receipt** (`SBSR.md`): a fail-closed admission object binding
`session_id` + `auth_subject` + `action/tool + params_hash` (+ `iat/exp/jti`), optionally signed
(Ed25519/JCS — existing primitives only). Falsifiable vectors TV-B1..B5: each binding claim has a
mutation that **must** be denied. Two independent verifiers (no shared code) pass all vectors with
zero disagreements; battery results: `evidence/sbsr/battery-results.json`.

## What we ask reviewers to check

1. The two dynamic packs are self-operated and replayable (commands in each evidence dir).
2. Whether the 2025-06-18 spec text contains any requirement we missed that would make the
   measured behavior non-conformant rather than spec-compliant-ambiguous.
3. Whether sessionless (SEP-2567 direction) plus SBSR covers the deployment matrix, or a third
   shape is needed.

## Explicit non-claims

No "first discovery" claim (CVE/SEP prior art acknowledged in SBSR.md §8); no new cryptographic
primitive; no vendor endorsement implied; unauthenticated-surface defects are labeled separately
and not counted as Session-as-Identity.
