# Passive observations (no active testing without authorization)

| Endpoint | Registry claim | Observed | Verdict | Date |
|---|---|---|---|---|
| com.workey/quote-links v1.0.0 (`workey.com/api/mcp`) | Streamable HTTP, commercial quoting | POST → 302 → `efalia.com/efalia-process/api/mcp` (openresty); POST/DELETE → 405; GET stream → 404 | **handshake-unreachable** — no security verdict; standard Streamable HTTP rejected at edge | 2026-11-12 |

*Method: one benign `initialize` + method probes. No injection, no third-party session IDs, no state change. Active tests require implementer authorization (see disclosure template).*

## Leakage-path code-search evidence (2026-11-12, GitHub code search, authenticated API)

- Query `"mcp-session-id" localStorage`: **2,444 files** match (all languages), **588 in TypeScript** alone.
- Notable matches: tldraw/tldraw, firecrawl/firecrawl-mcp-server, JetBrains/intellij-community, raycast/extensions, musistudio/claude-code-router.
- Saved snippet: `evidence/leakage-evidence/claude-code-router-snippet.txt` (client reads session ID from response header and re-sends it — browser-persisted session IDs are a realistic harvest surface).
