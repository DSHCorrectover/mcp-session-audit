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

## PAP/Poppy v1.0 (2026-11-16, 一手 spec 细读)

来源：personalagentprotocol.org/docs/1.0/spec（Apache-2.0）。

**空白一（§5.2 自认）**：规范不描述委派签名（delegated Session JWT）在资源端点的校验——「It does not describe support for delegation signatures at resource endpoints」。企业侧端点拿什么验「这个动作真的来自被授权的委托链」是未规定区。
**空白二（jti=MAY）**：Session JWT 防重放（jti 拒绝重用）为 MAY 非 MUST——写操作端点不实现即存在授权窗口内重放面。
**空白三（roadmap 自认）**：payments 项「evidence that a payment settled for an approved revision」与 Signed approvals 均为未落地 open proposals（#70 正在讨论 witness reference；我方已以 #issuecomment-6907352634 介入，贡献可重放向量方法学+三个 spec 修正点）。

**鉴定对象清单+1**：PAP 发现文件声明 `"type": "mcp"` 的端点——Poppy→MCP 面直接落入五项绑定检验射程。被动观测方法=registry radar 同款（单次 benign initialize，零注入零状态变更）。
