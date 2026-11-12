// 被动探测：每端点1次良性initialize。记录 sid/auth/握手形态。零注入。
import fs from "node:fs";
const lines = fs.readFileSync("/tmp/urls.txt","utf8").trim().split("\n");
const out = [];
async function probe(name, url) {
  const r = { name, url, status: 0, sid: false, auth: "", note: "" };
  try {
    const ac = new AbortController(); setTimeout(() => ac.abort(), 12000);
    const res = await fetch(url, { method: "POST", signal: ac.signal, headers: {
      "Content-Type": "application/json", "Accept": "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "mcp-session-audit", version: "0.1" } } }) });
    r.status = res.status;
    const h = res.headers;
    r.sid = !!(h.get("mcp-session-id") || h.get("Mcp-Session-Id"));
    if (r.sid) r.sidval = (h.get("mcp-session-id")||"").slice(0,10)+"…";
    r.auth = h.get("www-authenticate") || "";
    if (res.status === 200) {
      const ct = h.get("content-type")||"";
      if (ct.includes("event-stream")) { const t = await res.text(); r.note = "sse:" + t.slice(0,120).replace(/\n/g," "); }
      else { const j = await res.json().catch(()=>null); r.note = j ? (j.result ? "OK-INIT" : JSON.stringify(j).slice(0,120)) : "nonjson"; }
    } else { r.note = (await res.text().catch(()=>"")).slice(0,80).replace(/\n/g," "); }
  } catch (e) { r.note = "ERR:" + (e.name==="AbortError"?"timeout":e.message.slice(0,50)); }
  return r;
}
// 限速并发5
const queue = lines.map(l => { const i=l.indexOf("|"); return { name: l.slice(0,i), url: l.slice(i+1) }; });
const workers = Array.from({length:5}, async () => { while (queue.length) { const it = queue.shift(); const r = await probe(it.name, it.url); out.push(r); process.stdout.write(`${r.status} ${r.sid?"SID":"   "} ${it.name}\n`); } });
await Promise.all(workers);
fs.writeFileSync("/tmp/probe-results.json", JSON.stringify(out,null,1));
console.log("\n=== 汇总 ===");
console.log("握手OK(200):", out.filter(r=>r.status===200).length);
console.log("返回SID:", out.filter(r=>r.sid).length);
console.log("要求auth:", out.filter(r=>r.auth).length);
console.log("401/403:", out.filter(r=>r.status===401||r.status===403).length);
console.log("404/405:", out.filter(r=>r.status===404||r.status===405).length);
