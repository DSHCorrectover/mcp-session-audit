// 靶机#5：P-A1 定性——数据归属按会话(场景A) vs 按token(场景B)
// A: 工具从会话建立者解析数据 → attacker经victim会话读到victim余额 = 权限提升
// B: 工具按认证主体解析 → attacker拿到自己余额 = 降档(仅状态污染/归因错误)
// 论证点: SDK工具handler拿不到HTTP req → 场景B需server自建token→session绑定表,规范/SDK均无此钩子
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import express from "express";
import { randomUUID } from "node:crypto";

const TOKENS = { alice: "tok-alice-9f3e", attacker: "tok-attacker-2b7d" };
const BALANCE = { alice: 12500, attacker: 37 };
let serverLog = "";
const origLog = console.log;
console.log = (...a) => { serverLog += a.join(" ") + " | "; origLog(...a); };

function mkApp(mode) {
  const app = express(); app.use(express.json());
  const transports = {}; const ownerBySession = {}; let curSubject = "-";
  app.use("/mcp", (req, res, next) => {
    const tok = (req.headers["authorization"] || "").replace(/^Bearer\s+/i, "");
    if (!Object.values(TOKENS).includes(tok)) { res.status(401).json({ error: "unauthorized" }); return; }
    curSubject = Object.entries(TOKENS).find(([, v]) => v === tok)[0];
    next();
  });
  app.post("/mcp", async (req, res) => {
    const sid = req.headers["mcp-session-id"];
    let transport;
    if (sid && transports[sid]) transport = transports[sid];
    else if (!sid && req.body?.method === "initialize") {
      transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (s) => { transports[s] = transport; ownerBySession[s] = curSubject; } });
      const server = new McpServer({ name: "t5-" + mode, version: "1.0.0" });
      server.tool("wallet_balance", {}, async () => {
        const sessOwner = ownerBySession[Object.entries(transports).find(([, t]) => t === transport)[0]];
        const owner = mode === "A" ? sessOwner : curSubject;
        console.log(`BALANCE mode=${mode} authSubject=${curSubject} sessionOwner=${sessOwner} -> returned owner=${owner}`);
        return { content: [{ type: "text", text: `balance-of:${owner}=$${BALANCE[owner]}` }] };
      });
      await server.connect(transport);
    } else { res.status(400).end(); return; }
    await transport.handleRequest(req, res, req.body);
  });
  app.delete("/mcp", async (req, res) => { const t = transports[req.headers["mcp-session-id"]]; if (!t) { res.status(404).end(); return; } await t.handleRequest(req, res, req.body); });
  return app;
}

const readBody = async (r) => { const c = r.headers.get("content-type") || ""; if (c.includes("event-stream")) { const rd = r.body.getReader(); let b = ""; try { const t = setTimeout(() => rd.cancel(), 2500); while (b.length < 2048) { const { done, value } = await rd.read(); if (done) break; b += new TextDecoder().decode(value); if (b.includes("balance-of:")) break; } clearTimeout(t); } catch (e) {} return b; } return r.text(); };
const R = [];

for (const mode of ["A", "B"]) {
  const app = mkApp(mode); const srv = app.listen(0);
  await new Promise(r => srv.on("listening", r));
  const URL = `http://127.0.0.1:${srv.address().port}/mcp`;
  const call = (h, body) => fetch(URL, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json, text/event-stream", ...h }, body: JSON.stringify(body), signal: AbortSignal.timeout(5000) });
  const r0 = await call({ "Authorization": `Bearer ${TOKENS.alice}` }, { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "alice", version: "1" } } });
  const sidA = r0.headers.get("mcp-session-id");
  await call({ "Authorization": `Bearer ${TOKENS.alice}`, "mcp-session-id": sidA }, { jsonrpc: "2.0", method: "notifications/initialized" });
  const r1 = await call({ "Authorization": `Bearer ${TOKENS.attacker}` }, { jsonrpc: "2.0", id: 2, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "attacker", version: "1" } } });
  const sidK = r1.headers.get("mcp-session-id");
  await call({ "Authorization": `Bearer ${TOKENS.attacker}`, "mcp-session-id": sidK }, { jsonrpc: "2.0", method: "notifications/initialized" });
  const r2 = await call({ "Authorization": `Bearer ${TOKENS.attacker}`, "mcp-session-id": sidA }, { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "wallet_balance", arguments: {} } });
  const b2 = await readBody(r2);
  const gotAlice = b2.includes("balance-of:alice"), gotSelf = b2.includes("balance-of:attacker");
  if (mode === "A") R.push([`场景A(按会话归属,社区默认形态)`, gotAlice, `attacker读到victim余额$${BALANCE.alice}: ${gotAlice}`]);
  else R.push([`场景B(按token归属,需自建绑定表)`, gotSelf, `attacker只拿到自己数据: ${gotSelf}`]);
  srv.close();
}
console.log("=== 靶机#5 · P-A1 定性 ===");
for (const [n, ok, ev] of R) console.log(`${ok ? "!!" : "--"} | ${n} | ${ev}`);
process.exit(0);
