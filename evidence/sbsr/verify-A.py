#!/usr/bin/env python3
"""Verifier A — reference implementation (v0.2: owner-map binding check).
Design: linear check chain, cryptography lib, json.dumps-based canonicalization.
Decisions fail-closed. Verdicts recorded to verdicts-A.json."""
import json, os, time, base64
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

HERE=os.path.dirname(__file__)
PUB=open(os.path.join(HERE,"fixtures","ed25519_test.pub"),"rb").read()
KEYS={PUB.hex():Ed25519PublicKey.from_public_bytes(PUB)}
CTX=json.load(open(os.path.join(HERE,"fixtures","_context.json")))
OWNER=CTX["owner_map"]

def canon(o): return json.dumps(o,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()

def verify(rec, now=None):
    now = now or int(time.time())
    for f in ["sbsr_version","session_id","auth_subject","action","verdict","iat","jti"]:
        if f not in rec: return False,"A-STRUCT-MISSING-"+f
    if rec["sbsr_version"]!="0.1": return False,"A-VERSION"
    if rec["action"] not in ("tools/call","session/delete"): return False,"A-ACTION-UNKNOWN"
    if rec["verdict"] not in ("allow","deny"): return False,"A-VERDICT-VALUE"
    ow=OWNER.get(rec["session_id"])
    if ow is None: return False,"A-SESSION-UNKNOWN"
    if rec["auth_subject"]!=ow: return False,"A-SUBJECT-MISMATCH"
    if rec["iat"]>now: return False,"A-TIME-IAT-FUTURE"
    if "exp" in rec and rec["exp"]<now: return False,"A-TIME-EXPIRED"
    if "sig" in rec:
        if rec.get("sig_alg")!="Ed25519": return False,"A-SIG-ALG"
        body={k:v for k,v in rec.items() if k not in ("sig","sig_alg")}
        raw=canon(body)
        s=base64.urlsafe_b64decode(rec["sig"]+"="*(-len(rec["sig"])%4))
        for h,k in KEYS.items():
            try:
                k.verify(s,raw); return True,"A-OK-SIGNED"
            except Exception: continue
        return False,"A-SIG-INVALID"
    return True,"A-OK-UNSIGNED"

def main():
    fx=os.path.join(HERE,"fixtures")
    out={}
    for fn in sorted(os.listdir(fx)):
        if not fn.endswith(".json") or "pub" in fn or fn.startswith("_"): continue
        rec=json.load(open(os.path.join(fx,fn)))
        ok,code=verify(rec)
        out[fn]={"verifier":"A","allow":ok,"code":code}
        print(f"A {fn:36s} -> {'ALLOW' if ok else 'DENY':5s} {code}")
    json.dump(out,open(os.path.join(HERE,"verdicts-A.json"),"w"),indent=1)

if __name__=="__main__": main()
