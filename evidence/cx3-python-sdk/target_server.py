#!/usr/bin/env python3
"""CX-3 target: official Python MCP SDK 2.3.0, stateful streamable HTTP,
   auth-enforced wrapper (P-A0 control). Self-operated, localhost only.
   Two principals: victim V (token_V), attacker A (token_A)."""
import sys, json
from starlette.applications import Starlette
from starlette.responses import JSONResponse

import uvicorn

from mcp.server.mcpserver import MCPServer

TOKENS = {"token_V": "subj-victim", "token_A": "subj-attacker"}
AUDIT = []

def auth_mw(app):
    async def middleware(scope, receive, send):
        if scope["type"] == "http" and scope["path"].startswith("/mcp"):
            hdr = {k.decode(): v.decode() for k, v in scope.get("headers", [])}
            tok = hdr.get("authorization", "").removeprefix("Bearer ").strip()
            if tok not in TOKENS:
                AUDIT.append({"path": scope["path"], "auth": "NONE/invalid", "verdict": "401"})
                r = JSONResponse({"error": "unauthorized"}, status_code=401)
                await r(scope, receive, send)
                return
            scope["state"] = {"subject": TOKENS[tok]}
        await app(scope, receive, send)
    return middleware

server = MCPServer(name="cx3-python-sdk", version="2.3.0")

@server.tool()
def marker_exec(note: str) -> str:
    """P-A1 marker: records which subject executed."""
    AUDIT.append({"tool": "marker_exec", "note": note})
    return f"executed note={note}"

app = server.streamable_http_app()   # Starlette app, manages session manager lifecycle itself
app = auth_mw(app)                   # auth-enforced wrapper (P-A0 control)

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv)>1 else 8931
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="warning")
