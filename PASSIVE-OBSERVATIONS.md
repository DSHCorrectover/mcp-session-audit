# Passive observations (no active testing without authorization)

| Endpoint | Registry claim | Observed | Verdict | Date |
|---|---|---|---|---|
| com.workey/quote-links v1.0.0 (`workey.com/api/mcp`) | Streamable HTTP, commercial quoting | POST → 302 → `efalia.com/efalia-process/api/mcp` (openresty); POST/DELETE → 405; GET stream → 404 | **handshake-unreachable** — no security verdict; standard Streamable HTTP rejected at edge | 2026-11-12 |

*Method: one benign `initialize` + method probes. No injection, no third-party session IDs, no state change. Active tests require implementer authorization (see disclosure template).*

## Leakage-path code-search evidence (2026-11-12, GitHub code search, authenticated API)

- Query `"mcp-session-id" localStorage`: **2,444 files** match (all languages), **588 in TypeScript** alone.
- Notable matches: tldraw/tldraw, firecrawl/firecrawl-mcp-server, JetBrains/intellij-community, raycast/extensions, musistudio/claude-code-router.
- Saved snippet: `evidence/leakage-evidence/claude-code-router-snippet.txt` (client reads session ID from response header and re-sends it — browser-persisted session IDs are a realistic harvest surface).

## P-SL batch: zero-handshake tool enumeration (2026-11-12)

Against the 21 anonymous-handshake-OK endpoints: POST `tools/list` **without any initialize** (read-only, X-Audit-By header set).

**16 of 21 returned tool inventories with zero handshake** — including `ad.getle/leads` (35 tools: get_account, list_mailboxes, test_mailbox…), `academy.apexai/apex-ai-academy` (30 tools), `ae.mrk/dubai-property` (22 tools). Combined with the 37% anonymous rate: **~28% of the sampled registry serves tool inventories to callers who performed no protocol handshake whatsoever.**

Raw: `evidence/psl-batch-20261112.json` (via probe pipeline). All calls read-only, no execution of state-changing tools.
