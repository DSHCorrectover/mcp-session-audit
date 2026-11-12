# mcp-session-audit-action

One-line session-security checkup for your MCP server's CI.

```yaml
- uses: DSHCorrectover/mcp-session-audit/action@main
  with:
    endpoint: https://your-server.example/mcp
    victim-token: ${{ secrets.AUDIT_VICTIM_TOKEN }}
    attacker-token: ${{ secrets.AUDIT_ATTACKER_TOKEN }}
```

Positive case study: `africa.lomi/mcp` correctly validates session existence (fabricated sid → 404, missing sid → 400) — the suite reports `bound-or-inconclusive` for correct implementations. This is a health check, not an attack tool: it only ever uses credentials YOU provide and sessions YOU create.

Roadmap: v0.2 SSE/Last-Event-ID replay test · v0.3 registry batch scan + radar chart.
