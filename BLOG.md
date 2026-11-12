# The Schrödinger Identity of MCP: 37% of Officially Registered Endpoints Don't Know Who You Are

*Guigui Wang — Correctover · 2026-11-12 · raw data & replayable scripts: [github.com/DSHCorrectover/mcp-session-audit](https://github.com/DSHCorrectover/mcp-session-audit)*

**TL;DR**: We passively probed 57 servers advertising Streamable HTTP endpoints in the official MCP registry — one benign `initialize` each, no injection, no state change. **37% complete the handshake with zero authentication. 76% of those return their full tool inventory to callers who never performed the protocol handshake at all.** One advertising-tech endpoint exposes 35 account-level tools (mailbox listing, account lookup, campaign management) to any `curl` one-liner. The deeper problem is architectural, and we named it: **the Session-as-Identity antinomy**.

## What we found

| Class | Share | What it means |
|---|---|---|
| Anonymous handshake OK | **37%** | Anyone can enumerate tools. No credential, no registration, no subject concept. |
| Zero-handshake tool inventory | **76% of the above** | No `initialize` needed either — a bare `tools/list` POST works. |
| OAuth-gated (correct 401 + RFC 9728 metadata) | 21% | The minority doing it by the book. |
| Registered-but-unreachable | 16% | URLs that no longer serve standard traffic — a registry-hygiene footnote. |

Every call was read-only, carried an explicit `X-Audit-By: Correctover` header, and is replayable from our repo. We named no one in this post; responsible disclosure to the affected operators comes first.

## Why "no auth" is worse than it sounds

An MCP server is not a website. Its tool list is a machine-readable contract that LLM agents consume and *execute*. A tool named `get_account` behind no authentication is not a missing login page — it is an unauthenticated data-retrieval API wearing an agent-friendly protocol. The ecosystem's story so far has been about MCP servers being *easy to build*; our data says they have been equally easy to expose.

## The architectural flaw: Session-as-Identity

For servers that *do* implement authentication, we ran controlled experiments against the official TypeScript SDK (self-operated targets, our own tokens, our own sessions). The result: **the session ID and the authenticated subject are never bound.** With a valid attacker token and a leaked victim session ID, tools execute inside the victim's session, and a plain `DELETE` terminates it — the victim's own valid token then bounces off a 404. We call this the **Session-as-Identity antinomy**: MCP conflates a *routing identifier* ("which context") with a *subject identifier* ("who"). The spec (2025-06-18) never requires binding; the reference implementation validates sessions by string equality; a Ruby SDK CVE and the protocol's own SEP-2567 (sessionless MCP, merged Final) confirm the class is known upstream.

Three verdicts cover the whole ecosystem:

- **unauthenticated-surface** — no identity exists to bind (37% of registry)
- **session-as-identity** — identity exists but sessions don't bind to it (SDK-class, measured)
- **bound** — correct implementations exist (we found one; it validates fabricated and missing session IDs properly). It can be done.

## What to do

- **Operators**: put OAuth in front of your MCP endpoint (RFC 9728 discovery), and treat every session ID as a capability bound to the authenticated subject — or adopt the sessionless model.
- **Protocol authors**: SEP-2567 removes sessions; SEP-1299 binds them. Either direction resolves the antinomy — but 37% of the registry needs the part neither SEP can ship: *operators actually turning authentication on*.
- **You, in 30 seconds**: run [our one-line GitHub Action](https://github.com/DSHCorrectover/mcp-session-audit#mcp-session-audit) against your own server and see which verdict you get.

We sell the verdict, and you can re-verify it yourself.

---

*Method, per-endpoint raw data, probe scripts, and the full test protocol: [github.com/DSHCorrectover/mcp-session-audit](https://github.com/DSHCorrectover/mcp-session-audit). Errors and corrections welcome — we publish our own error log with the data.*
