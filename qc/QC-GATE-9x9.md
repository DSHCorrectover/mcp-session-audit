# 9+9 质检门 PoC（2026-11-18 主人令：关键节点，必须实测）

**病根**（11-18 二次发生）：自产物碰撞（本地 runner 覆盖同名路径）被误报为「服务端截断」进公开记录。
**门的设计**：任何对外声明/分歧上报，入站 9 关 + 出站 9 关，全部脚本实测，不许人工口说。
**实现**：qc-gate.py（本目录）——输入=声明清单(JSON)+草稿文本，输出=18 项 PASS/FAIL 实测报告。
**铁律**：任一 FAIL → 不准上公开记录，降级为「待复核，己方证据不全」。

## 入站 9（Inbound——采到手的字节是否可信）
1. sha256-pinned：每个引用文件已固定 sha256+时间戳
2. size-sanity：字节数与声明/清单一致
3. dual-fetch：两个独立通道二次取回且字节一致
4. collision-check：同路径是否存在我方自产物（runner/模板）覆盖
5. format-valid：文件类型自洽（py 可编译 / json 可解析）
6. provenance：URL→fetch 日志→hash 链条完整可追溯
7. encoding：编码/换行无异常（BOM/CRLF/UTF-8）
8. tail-signature：尾字节与声明结构匹配（防截断假象）
9. replay-hash：从收到字节重新推导哈希=声明值

## 出站 9（Outbound——发出去的话是否可验）
1. replay-now：每条数字/结论此刻可重放（附重放命令）
2. files-exist：引用的每个本地文件存在且 sha 固定
3. third-party：第三方可从公开 base_url 独立重放
4. factcard-align：与对外话术唯一权威源逐字对齐
5. no-secrets：无密钥/令牌泄露（pt-/sk-/Bearer 扫描）
6. redline-scan：无价格数字/无 CVE 数量（红线词）
7. scope-note：范围限定语在场（scope/surface 声明）
8. false-flag-history：与历史假红旗模式比对（未复核类）
9. diff-last：与上一版公开发布的逐字 diff 可读

**实测记录**：见本目录 qc-run-*.log（每次真实运行的 18 项输出）。
