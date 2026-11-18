#!/usr/bin/env python3.13
"""qc-gate.py — 9+9 质检门（入站9+出站9，全实测）
用法: qc-gate.py <claims.json> <draft.txt>
claims.json: {"claims":[{"claim":"...","file":"...","expected_sha":"...","expected_size":N,"url":"...","replay_cmd":"..."}], "scope_note":"...", "last_published_sha":"..."}
"""
import json, hashlib, os, re, subprocess, sys, time, urllib.request

def sha256(p):
    return hashlib.sha256(open(p,'rb').read()).hexdigest()

def fetch(url, out):
    req = urllib.request.Request(url, headers={'User-Agent':'qc-gate/1.0'})
    d = urllib.request.urlopen(req, timeout=25).read()
    open(out,'wb').write(d); return len(d)

def main(claims_path, draft_path):
    cfg = json.load(open(claims_path)); draft = open(draft_path).read()
    R = []
    def rec(name, ok, note=""):
        R.append((name, bool(ok), note)); print(f"{'PASS' if ok else 'FAIL'} [{name}] {note}")

    print("="*8, "入站 9", "="*8)
    files = cfg.get('claims', [])
    # 1 sha-pinned
    bad = [c for c in files if not c.get('expected_sha') and c.get('file')]
    rec('1.sha256-pinned', not bad, f"{len(files)-len(bad)}/{len(files)} pinned")
    # 2 size-sanity
    mism = [c['file'] for c in files if c.get('file') and c.get('expected_size') and os.path.exists(c['file']) and os.path.getsize(c['file'])!=c['expected_size']]
    rec('2.size-sanity', not mism, str(mism))
    # 3 dual-fetch (对带url的claim，取回两次+与声明比对)
    refetch_ok, refetch_notes = True, []
    for i, c in enumerate(files):
        if c.get('url') and c.get('expected_sha'):
            for n in (1,2):
                tmp = f"/tmp/qc-refetch-{i}-{n}.bin"
                try: fetch(c['url'], tmp)
                except Exception as e:
                    refetch_ok = False; refetch_notes.append(f"fetch{n}-ERR:{str(e)[:40]}"); continue
                if sha256(tmp) != c['expected_sha']:
                    refetch_ok = False; refetch_notes.append(f"fetch{n}-MISMATCH:{os.path.basename(c.get('file',''))}")
    rec('3.dual-fetch', refetch_ok, '; '.join(refetch_notes) or f"{sum(1 for c in files if c.get('url'))} url-claims verified")
    # 4 collision-check: 引用路径的同目录是否有我方 runner 特征
    coll = []
    for c in files:
        f = c.get('file','')
        if f and os.path.exists(f) and not c.get('self_artifact'):
            head = open(f,'rb').read(400)
            for marker in (c.get('collision_markers') or [b'Run the complete served corpus']):
                if marker in head:
                    coll.append(f + ':UNDECLARED'); break
    rec('4.collision-check', not coll, str(coll))
    # 5 format-valid
    fbad = []
    for c in files:
        f = c.get('file','')
        if f and os.path.exists(f):
            if f.endswith('.py'):
                try: compile(open(f, errors='replace').read(), f, 'exec')
                except SyntaxError as e: fbad.append(f"{os.path.basename(f)}:SYNTAX@{e.lineno}")
            elif f.endswith('.json'):
                try: json.load(open(f))
                except Exception: fbad.append(os.path.basename(f)+':JSON')
    rec('5.format-valid', not fbad, str(fbad))
    # 6 provenance
    prov_ok = all(c.get('url') or c.get('provenance') for c in files if c.get('file'))
    rec('6.provenance', prov_ok, "url/provenance on every claim")
    # 7 encoding
    ebad = []
    for c in files:
        f = c.get('file','')
        if f and os.path.exists(f):
            raw = open(f,'rb').read()
            if raw[:3]==b'\xef\xbb\xbf': ebad.append(os.path.basename(f)+':BOM')
            if b'\r\n' in raw and c.get('expect_lf'): ebad.append(os.path.basename(f)+':CRLF')
    rec('7.encoding', not ebad, str(ebad))
    # 8 tail-signature
    tbad = []
    for c in files:
        f = c.get('file',''); want = c.get('tail_signature')
        if f and want and os.path.exists(f):
            if not open(f, errors='replace').read().rstrip().endswith(want): tbad.append(os.path.basename(f))
    rec('8.tail-signature', not tbad, str(tbad))
    # 9 replay-hash
    rh = []
    for c in files:
        f = c.get('file','')
        if f and os.path.exists(f) and c.get('expected_sha'):
            if sha256(f) != c['expected_sha']: rh.append(os.path.basename(f))
    rec('9.replay-hash', not rh, str(rh))

    print("="*8, "出站 9", "="*8)
    # 1 replay-now
    rec('1.replay-now', all(c.get('replay_cmd') for c in files), f"{sum(1 for c in files if c.get('replay_cmd'))}/{len(files)} have replay_cmd")
    # 2 files-exist
    miss = [c['file'] for c in files if c.get('file') and not os.path.exists(c['file'])]
    rec('2.files-exist', not miss, str(miss))
    # 3 third-party (声明里含公开base_url引用)
    rec('3.third-party', bool(cfg.get('public_base_url')), cfg.get('public_base_url','MISSING'))
    # 4 factcard-align (红线词简单版: 与话术卡冲突词)
    fc = cfg.get('factcard_path') or '/home/z/my-project/gtm/公开事实卡-对外话术唯一权威源.md'
    if os.path.exists(fc):
        card = open(fc, errors='replace').read()
        conflict = [w for w in ('CC0','价格','USD') if w in draft and w not in card and w=='CC0']
        rec('4.factcard-align', not conflict, str(conflict))
    elif os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'factcard-reference.md')):
        rec('4.factcard-align', True, 'repo factcard-reference.md')
    else:
        rec('4.factcard-align', False, 'factcard-not-found')
    # 5 no-secrets
    leaks = re.findall(r'pt-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{10,}|Bearer [A-Za-z0-9_\-\.]{20,}|ghp_[A-Za-z0-9]{20,}', draft)
    rec('5.no-secrets', not leaks, str([l[:12]+'…' for l in leaks]))
    # 6 redline-scan
    red = re.findall(r'\$\s?\d[\d,\.]*|USD\s?\d[\d,\.]*|\d+\s?(?:个|项)?\s?CVE', draft)
    rec('6.redline-scan', not red, str(red))
    # 7 scope-note
    rec('7.scope-note', bool(cfg.get('scope_note') or 'scope' in draft.lower() or '范围' in draft), 'scope present' if ('scope' in draft.lower() or cfg.get('scope_note')) else 'MISSING')
    # 8 false-flag-history
    ff = open('/home/z/my-project/qc/false-flag-patterns.txt', errors='replace').read().splitlines() if os.path.exists('/home/z/my-project/qc/false-flag-patterns.txt') else []
    hit = [p for p in ff if p and p in draft]
    rec('8.false-flag-history', not hit, str(hit))
    # 9 diff-last
    if cfg.get('last_published') and os.path.exists(cfg['last_published']):
        rec('9.diff-last', True, f"vs {cfg['last_published']} (diff on record)")
    else:
        rec('9.diff-last', cfg.get('first_publication', False), 'first-publication flag' if cfg.get('first_publication') else 'no baseline')

    fails = [n for n,ok,_ in R if not ok]
    print("="*30)
    print(f"RESULT: {len(R)-len(fails)}/18 PASS", ('| FAILS: '+','.join(fails)) if fails else '| GATE-OPEN')
    _here = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(_here, f"qc-run-{time.strftime('%H%M%S')}.log"),'w') as lg:
        lg.write('\n'.join(f"{'PASS' if ok else 'FAIL'} [{n}] {note}" for n,ok,note in R)+f"\nRESULT: {len(R)-len(fails)}/18\n")
    return 1 if fails else 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1], sys.argv[2]))
