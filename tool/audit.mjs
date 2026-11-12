#!/usr/bin/env node
// mcp-session-audit CLI v0.1 — run the PROTOCOL.md tests against YOUR server.
// Usage: node tool/audit.mjs --url https://your-server/mcp \
//          --victim-token <V-valid-token> --attacker-token <A-valid-token> [--no-auth]
// Emits a MATRIX.md-compatible row (JSON + human summary). Self-operated targets only.
import { randomUUID } from "node:crypto";

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith("--") ? (a.push([v.slice(2), arr[i + 1]]), a) : a), []));
const URL = args.url; const VT = args["victim-token"]; const AT = args["attacker-token"];
if (!URL || !VT || !AT) { console.error("usage: audit.mjs --url <mcp-endpoint> --victim-token <t> --attacker-token <t> [--no-auth]"); process.exit(2); }

const R = [];
async function call(headers, body, method = "POST") {
  const ac = new AbortController(); setTimeout(() => ac.abort(), 8000);
  const r = await fetch(URL, { method, headers: { "Content-Type": "application/json", "Accept": "application/json, text/event-stream", ...headers }, body: method === "POST" ? JSON.stringify(body) : undefined, signal: ac.signal });
  let txt = "";
  if (r.body) { try { const rd = r.body.getReader(); const t = setTimeout(() => rd.cancel(), 2500); let buf = ""; while (buf.length < 4096) { const { done, value } = await rd.read(); if (done) break; buf += new TextDecoder().decode(value); if (buf.includes("}")) break; } clearTimeout(t); txt = buf; } catch (e) {} }
  return { status: r.status, text: txt };
}

async function main() {
  // P-A0 control: no auth
  const r0 = await call({}, { jsonrpc: "2.0", id: 0, method: "tools/list" });
  R.push(["P-A0", r0.status === 401 || r0.status === 403 ? "enforced" : "not-enforced/" + r0.status, `status=${r0.status}`]);

  // P-A0b: victim healthy session
  const rv = await call({ "Authorization": `Bearer ${VT}` }, { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "audit-victim", version: "1.0" } } });
  const sidV = rv.headers?.get?.("mcp-session-id") || (rv.text.match(/"mcp-session-id":"([^"]+)"/) || [])[1] || "";
  R.push(["P-A0b", rv.status === 200 && sidV ? "ok" : "fail", `status=${rv.status} sid=${sidV ? sidV.slice(0, 8) + "…" : "none"}`]);
  if (!sidV) { finish("no-session-issued"); return; }
  await call({ "Authorization": `Bearer ${VT}`, "mcp-session-id": sidV }, { jsonrpc: "2.0", method: "notifications/initialized" });

  // P-A1: attacker own token + victim sid → tools/list probe (read-only; do NOT use state-changing tools)
  const r1 = await call({ "Authorization": `Bearer ${AT}`, "mcp-session-id": sidV }, { jsonrpc: "2.0", id: 2, method: "tools/list" });
  R.push(["P-A1", r1.status === 200 ? "DEFECT: cross-subject session accepted" : "bound", `status=${r1.status}`]);

  // P-A2: attacker own token + victim sid → DELETE
  const r2 = await fetch(URL, { method: "DELETE", headers: { "Authorization": `Bearer ${AT}`, "mcp-session-id": sidV } });
  R.push(["P-A2", r2.status === 200 || r2.status === 202 ? "DEFECT: cross-subject kill accepted" : "bound", `status=${r2.status}`]);

  // P-A2b control: victim locked out?
  const r3 = await call({ "Authorization": `Bearer ${VT}`, "mcp-session-id": sidV }, { jsonrpc: "2.0", id: 3, method: "tools/list" });
  R.push(["P-A2b", r3.status === 404 || r3.status === 400 ? "victim locked out (kill was real)" : "victim still ok", `status=${r3.status}`]);

  finish();
}
function finish(note) {
  const row = { target: URL, note: note || "", verdict: R.some(([n, v]) => v.startsWith("DEFECT")) ? "Session-as-Identity" : (R.find(([n]) => n === "P-A0")?.[1].startsWith("not-enforced") ? "unauthenticated-surface" : "bound-or-inconclusive"), tests: Object.fromEntries(R.map(([n, v, e]) => [n, { v, e }])) };
  console.log("\n=== mcp-session-audit v0.1 ===");
  for (const [n, v, e] of R) console.log(`${v.startsWith("DEFECT") ? "!!" : v.startsWith("bound") || v === "enforced" || v === "ok" ? "OK" : "--"} | ${n} | ${v} | ${e}`);
  console.log("\nMATRIX row (JSON):"); console.log(JSON.stringify(row, null, 2));
}
main().catch(e => { console.error("ERR", e.message); process.exit(1); });
