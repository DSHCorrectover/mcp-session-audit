#!/usr/bin/env python3
"""SBSR fixture generator — TV-B0..B5 (unsigned + signed groups).
Canonicalization: JCS discipline (sorted keys, no whitespace, UTF-8).
Ed25519 detached signature over the canonical receipt bytes.
Outputs: evidence/sbsr/fixtures/*.json + keypair (test-only key)."""
import json, os, time, hashlib
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization

OUT = os.path.join(os.path.dirname(__file__), "fixtures")
os.makedirs(OUT, exist_ok=True)

def jcs(obj):
    return json.dumps(obj, sort_keys=True, separators=(',',':'), ensure_ascii=False).encode()

def b64u(b):
    import base64
    return base64.urlsafe_b64encode(b).decode().rstrip('=')

KEY = Ed25519PrivateKey.generate()
PUB = KEY.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
open(os.path.join(OUT,"ed25519_test.pub"),"wb").write(PUB)  # test-only key, public half only

NOW = int(time.time())
def receipt(**over):
    r = {"sbsr_version":"0.1","session_id":"7d885027f39842b4a67aa021a3148430",
         "auth_subject":"subj-victim","action":"tools/call","tool":"marker_exec",
         "params_hash": hashlib.sha256(json.dumps({"note":"victim self"},sort_keys=True,separators=(',',':')).encode()).hexdigest(),
         "verdict":"allow","iat":NOW,"exp":NOW+300,
         "jti":"tv-b0-original","policy_id":"sbsr-default"}
    r.update(over)
    return r

import base64
def sign(rec):
    sig = KEY.sign(jcs(rec))
    rec = dict(rec); rec["sig_alg"]="Ed25519"; rec["sig"]=b64u(sig)
    return rec

fixtures = {}
# Group 1: unsigned base + per-claim violations (must be denied on structural check)
fixtures["tv-b0-original-unsigned"] = receipt()
fixtures["tv-b1-cross-subject"] = receipt(auth_subject="subj-attacker")
fixtures["tv-b0-original-unsigned"] = receipt()
fixtures["tv-b2-params-mutated"] = receipt(params_hash="0"*64)
fixtures["tv-b0-original-unsigned"] = receipt()
fixtures["tv-b3-tool-swapped"] = receipt(tool="other_tool")
fixtures["tv-b4-expired"] = receipt(exp=NOW-1, jti="tv-b4")
fixtures["tv-b4-iat-future"] = receipt(iat=NOW+3600, jti="tv-b4b")
# TV-B1 signed form (subject swap after signing)
sw = dict(receipt(jti="tv-b1s")); sw["auth_subject"]="subj-attacker"
fixtures["tv-b1-signed-cross-subject"] = sign(sw)
fixtures["tv-b1-signed-original"] = sign(receipt(jti="tv-b1s0"))
# TV-B2/B3 signed forms: SIGN FIRST, mutate AFTER (sig no longer covers mutated bytes)
r2 = receipt(jti="tv-b2s"); s2 = sign(r2)
m2 = dict(r2); m2["params_hash"]="0"*64; m2["sig"]=s2["sig"]; m2["sig_alg"]=s2["sig_alg"]
fixtures["tv-b2-signed-params-mutated"] = m2
r3 = receipt(jti="tv-b3s", tool="marker_exec"); s3 = sign(r3)
m3 = dict(r3); m3["tool"]="other_tool"; m3["sig"]=s3["sig"]; m3["sig_alg"]=s3["sig_alg"]
fixtures["tv-b3-signed-tool-swapped"] = m3
fixtures["tv-b3-signed-original"] = sign(receipt(jti="tv-b3s0", tool="marker_exec"))
# owner map context (TV-B1 truth table for unsigned+signed check)
fixtures["_context.json"] = {"owner_map": {"sess-victim-0001":"subj-victim","7d885027f39842b4a67aa021a3148430":"subj-victim","sess-attacker-0001":"subj-attacker"}}
# Group 2: signed (verdict integrity TV-B5: flip verdict AFTER signing → verify fails)
fixtures["tv-b5-signed-original"] = sign(receipt(jti="tv-b5"))
flipped = dict(fixtures["tv-b5-signed-original"]); flipped["verdict"]="deny"
fixtures["tv-b5-verdict-flipped"] = flipped  # sig no longer covers these bytes
# also a signed-then-mutated-params case
mut = dict(fixtures["tv-b5-signed-original"]); mut["params_hash"]="0"*64
fixtures["tv-b5-params-mutated-signed"] = mut

CTX=fixtures.pop("_context.json")
with open(os.path.join(OUT,"_context.json"),"w") as f:
    json.dump(CTX, f, indent=1, sort_keys=True)
for name, rec in fixtures.items():
    with open(os.path.join(OUT, f"{name}.json"),"w") as f:
        json.dump(rec, f, indent=1, sort_keys=True)
print("fixtures written:", len(fixtures))
print("canonical b0:", jcs(receipt())[:80], "...")
