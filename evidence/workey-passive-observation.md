# 负责任披露/授权请求草稿（等主人批，门禁流程）

收件：mcpso Issue #1 公开评论 或 yossigrunwald 私信 / workey 安全邮箱（先查 security.txt）
主题：Session-subject binding audit — authorization request + connectivity note

正文（三段）：
1. We run an open cross-implementation audit of MCP session-subject binding (protocol + suite: github.com/DSHCorrectover/mcp-session-audit). Your server is listed in the official registry (com.workey/quote-links, Streamable HTTP).
2. Connectivity note (no security verdict): standard Streamable HTTP initialize requests to the registered endpoint are rejected at the edge (302→405/404). If the endpoint has moved or requires specific headers, we'd appreciate the current form.
3. If you'd like a free session-security checkup (our standard protocol, self-contained report), we'd be glad to run it against a staging endpoint with your authorization — results shared with you first, publication only with your sign-off.

红线自查：无冷邮性质（是授权请求+连通性反馈）；无价格；公开事实卡合规。
