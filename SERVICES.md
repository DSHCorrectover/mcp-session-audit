# Correctover — Independent Verification Engagements

*(渠道解禁令后首个公开商品页草案；价格按 v19 已批口径印出)*

## What we do
We certify **post-migration authorization integrity** for MCP server deployments. Migration vendors prove you can handshake; we certify you didn't go naked after migration.

## Engagement tiers

### T1 — Bounded Review — **USD 8,000–15,000**
One deployment, five binding checks (subject / params / tool / freshness / verdict integrity), two independently written verifiers, zero-disagreement requirement. Deliverable: a court-ready dossier — signed verdict, byte-level reproducible evidence, regulatory mapping (SOC 2 CC6/CC7/CC8, EU AI Act Art.12/15, ISO 42001).

### T2 — Interoperability Review — **quote**
Cross-implementation battery against official MCP SDKs (Python / TypeScript / Go). For vendors shipping MCP servers or gateways.

### T3 — Incident-to-Verdict — **quote**
A live incident (authorization bypass, session takeover, replay). We produce a third-party-verifiable determination: what bound to what, when, and whether the control failed.

## What we are NOT
- Not a certification body. Reports state, in these words, that we are not a certification, endorsement or conformity seal.
- We review only artifacts you own or are authorized to test. Never third parties' systems.
- All findings come with a replay pack: environment fingerprint, fixed vectors, idempotent reproduction. No reproduction evidence = no finding (house rule).

## Free tier
The five-binding-check vector corpus and the two-verifier comparison battery are public and CC0/Apache-2.0 at [mcp-session-audit](https://github.com/DSHCorrectover/mcp-session-audit). Run them yourself in minutes; pay us when you need the dossier.

## Contact
wangguigui@correctover.com — all communication by email, asynchronously.
