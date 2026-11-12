# Threat Model — What an attacker actually needs

The Session-as-Identity defect has exactly one precondition: **the attacker learns a live session ID of the victim while holding their own valid credential for the same server.** No victim credential is required. No victim interaction is required.

## Where session IDs leak (each to be backed by a replayable artifact)

1. **Server-side logs** — every framework default access log that records request headers (nginx `log_format` customizations, debug-level middleware, APM agents) captures `Mcp-Session-Id` alongside `Authorization`. One log-reader role = sid harvest.
2. **Reverse proxies / gateways** — request IDs, tracing headers, and `proxy_set_header` misconfigurations surface session headers to upstream logging or error pages.
3. **Browser-side MCP clients** — clients that persist the session header in `localStorage`/`sessionStorage` expose it to any XSS, extension, or shared-machine context. Code search shows the combination of `mcp-session-id` with client-side storage across hundreds of repositories (sampled evidence in `evidence/leakage-evidence/`).
4. **Error responses** — frameworks echoing headers or request dumps on 4xx/5xx pages.
5. **Multi-tenant proxies sharing one upstream server** — sid values are routing keys; one tenant's proxy operator can observe another's.

## What the attacker does

With own-valid-token + victim-sid (per PROTOCOL.md P-A1/P-A2):
- **Execute tools inside the victim's session** — in by-session-attribution deployments (the default), results and side effects accrue to the victim's context. Where tool authorization is session-scoped, this is privilege escalation; where the server hand-binds token→session, it degrades to integrity/attribution fault (P-Q1 Mode B).
- **Terminate the victim's session at will** — an authenticated denial-of-service that also destroys the victim's in-flight agent state (running tasks, streaming results), which for long-lived agent workloads is often the bigger loss.

## What this is NOT (anti-overstatement)

- Not "zero-credential hijacking": a valid credential for the target is required (P-A0 control).
- Not a bypass of a *bound* system: if an implementation binds sid to subject, P-A1/P-A2 fail — that's the point of the matrix.
- Not a claim of first discovery of the pattern: CVE-2026-67431 (Ruby SDK) and SEP-2567 (sessionless MCP, merged Final) show the ecosystem already knows. The contribution here is the **protocol, the matrix, and the attribution qualification** — turning a known pattern into a measurable standard.

## Severity framing

Where P-Q1 Mode A (default): cross-subject tool execution with session-scoped authorization = **privilege escalation, CVSS-scope-changing**. Where Mode B: integrity/attribution defect. Where P-A0 shows auth: none: unauthenticated tool surface, classified separately and never conflated with the authenticated finding.
