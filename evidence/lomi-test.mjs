// africa.lomi/mcp 双会话自测：sid 存在性校验 + stateless 行为（自己会话+自造sid，零第三方）
const U = "https://mcp.lomi.africa/mcp/guest";
async function call(headers, body) {
  const ac = new AbortController(); setTimeout(() => ac.abort(), 10000);
  const r = await fetch(U, { method: "POST", signal: ac.signal, headers: { "Content-Type": "application/json", "Accept": "application/json, text/event-stream", ...headers }, body: JSON.stringify(body) });
  const t = await r.text();
  return { status: r.status, sid: r.headers.get("mcp-session-id"), body: t.slice(0, 200) };
}
const R = [];
// 1) 正常 initialize 拿自己的 sid
const r1 = await call({}, { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "audit", version: "0.1" } } });
const sid = r1.sid; R.push(["INIT", r1.status, "sid=" + (sid ? sid.slice(0, 8) + "…" : "none"), r1.body.slice(0, 80)]);
// 2) 自己 sid 正常用
const r2 = await call({ "mcp-session-id": sid }, { jsonrpc: "2.0", id: 2, method: "tools/list" });
R.push(["SELF-SID tools/list", r2.status, "", r2.body.slice(0, 100)]);
// 3) 无 sid 直接调（stateless 行为）
const r3 = await call({}, { jsonrpc: "2.0", id: 3, method: "tools/list" });
R.push(["NO-SID tools/list", r3.status, "", r3.body.slice(0, 100)]);
// 4) 自造假 sid（UUID随机——不与任何第三方相关）
const r4 = await call({ "mcp-session-id": randomUUID() }, { jsonrpc: "2.0", id: 4, method: "tools/list" });
R.push(["FAKE-SID tools/list", r4.status, "", r4.body.slice(0, 100)]);
import { randomUUID } from "node:crypto";
for (const [n, s, e, b] of R) console.log(`${n} | ${s} | ${e} | ${b}`);
