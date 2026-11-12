# Correctover Session Audit API (public beta)

**Free, read-only, self-service.** `POST http://120.26.163.143:8787/v1/audit` with `{"url":"https://your-mcp-server/mcp"}` → verdict JSON.

```bash
curl -s -X POST http://120.26.163.143:8787/v1/audit \
  -H "Content-Type: application/json" \
  -d '{"url":"https://your-mcp-server/mcp"}'
```

- 3 read-only probes max per run; no handshake forgery against third-party endpoints; self-target blocked.
- Verdicts: `unauthenticated-surface` | `stateless-no-session` | `session-required-stateless` | `session-validated` | `auth-enforced` | `unreachable`
- Landing page (paste-your-URL UI + waitlist): http://120.26.163.143:8787/
- Roadmap: TLS domain + OAuth-binding scans (own-account, waitlist-gated) → paid Verdict Reports.
