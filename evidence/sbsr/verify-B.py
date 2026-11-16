#!/usr/bin/env python3
"""Verifier B — independent implementation (independent-reader discipline), v0.2.
No shared code with verify-A: hand-rolled canonicalizer, pynacl stack, hash-keyed
index, table-driven policy. v0.2 adds owner-map binding check. Fail-closed."""
import json, os, time, base64, hashlib
from nacl.signing import VerifyKey

HERE=os.path.dirname(__file__)
_raw=open(os.path.join(HERE,"fixtures","ed25519_test.pub"),"rb").read()
KIDX={hashlib.sha256(_raw).hexdigest()[:16]:VerifyKey(_raw)}
CTX=json.load(open(os.path.join(HERE,"fixtures","_context.json")))
OWNER=CTX["owner_map"]
POLICY={"required":["sbsr_version","session_id","auth_subject","action","verdict","iat","jti"],
        "actions":{"tools/call","session/delete"},"version":"0.1"}

def canon(o):
    def enc(v):
        if isinstance(v,str): return '"'+v.replace('\\','\\\\').replace('"','\\"')+'"'
        if v is True: return 'true'
        if v is False: return 'false'
        if v is None: return 'null'
        if isinstance(v,(int,float)): return str(v)
        if isinstance(v,dict):
            return '{'+','.join(enc(k)+':'+enc(v[k]) for k in sorted(v))+'}'
        raise TypeError
    return enc(o).encode()

def verify(rec, now=None):
    now = now or int(time.time())
    missing=[f for f in POLICY["required"] if f not in rec]
    if missing: return False,"B-REQ:"+",".join(missing)
    if rec["sbsr_version"]!=POLICY["version"]: return False,"B-VER"
    if rec["action"] not in POLICY["actions"]: return False,"B-ACTION"
    if rec["verdict"] not in ("allow","deny"): return False,"B-VERDICT"
    ow=OWNER.get(rec["session_id"])
    if ow is None: return False,"B-SESSION-UNKNOWN"
    if rec["auth_subject"]!=ow: return False,"B-SUBJECT-MISMATCH"
    if rec["iat"]>now: return False,"B-IAT-FUTURE"
    if rec.get("exp") is not None and rec["exp"]<now: return False,"B-EXPIRED"
    if "sig" in rec:
        if rec.get("sig_alg")!="Ed25519": return False,"B-ALG"
        body={k:v for k,v in rec.items() if k not in ("sig","sig_alg")}
        raw=canon(body)
        pad="="*(-len(rec["sig"])%4)
        s=base64.urlsafe_b64decode(rec["sig"]+pad)
        for k,vk in KIDX.items():
            try:
                vk.verify(raw,s); return True,"B-OK-SIGNED"
            except Exception: continue
        return False,"B-BADSIG"
    return True,"B-OK-UNSIGNED"

def main():
    fx=os.path.join(HERE,"fixtures")
    out={}
    for fn in sorted(os.listdir(fx)):
        if not fn.endswith(".json") or "pub" in fn or fn.startswith("_"): continue
        rec=json.load(open(os.path.join(fx,fn)))
        ok,code=verify(rec)
        out[fn]={"verifier":"B","allow":ok,"code":code}
        print(f"B {fn:36s} -> {'ALLOW' if ok else 'DENY':5s} {code}")
    json.dump(out,open(os.path.join(HERE,"verdicts-B.json"),"w"),indent=1)

if __name__=="__main__": main()
