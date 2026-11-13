# Evidence: ArchLang MCP — passive self-service audit (2026-11-13)

**Target**: `https://mcp.archlang.uk/mcp` (Streamable HTTP)
**Publisher disclosure**: `ChanMeng666`, submitted for listing in `chatmcp/mcpso#1` on 2026-11-12, self-described as "remote: https://mcp.archlang.uk/mcp (Streamable HTTP, no sign-in)" and "Disclosure: I maintain it."
**Audit run**: 2026-11-13T08:46:55.979Z, via the self-service audit API (`POST /v1/audit`, read-only probes only — 3 requests, no handshake forgery, no exploit payload).
**Verdict**: `unauthenticated-surface`

## Test results

| probe | result |
|---|---|
| `initialize` (no session, no auth) | HTTP **200**, no `Mcp-Session-Id` issued |
| `tools/list` (zero handshake — no `initialize` first) | HTTP **200**, verdict **EXPOSED**, **12 tools** enumerated |

## Interpretation

The server accepts `tools/list` without any prior `initialize` and without any credential. The full tool inventory (12 tools) is readable by any anonymous client. This is the **Session-as-Identity** antinomy pattern documented in this repository (see `EVIDENCE-reference-study.md`): a session-routing identifier treated as (or here, replaced by) a security subject boundary.

## Reproduce it yourself

```bash
curl -s -X POST https://mcp.archlang.uk/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":9,"method":"tools/list"}'
# → 200 with the full 12-tool inventory, no session or auth required
```

Or via the self-service API (same read-only probes, evidence included in the response):

```bash
curl -s -X POST https://correctover-api.pages.dev/v1/audit \
  -H "Content-Type: application/json" \
  -d '{"url":"https://mcp.archlang.uk/mcp"}'
```

## Responsible disclosure note

The publisher self-identified as the maintainer in a public listing issue and publicly advertised the endpoint as requiring no sign-in; this observation was produced with read-only probes only (the server's own advertised behavior), and will be communicated to the maintainer with a fix reference (this repo's remediation matrix, row: require authenticated `initialize` and bind `Mcp-Session-Id` to the authenticated subject).
