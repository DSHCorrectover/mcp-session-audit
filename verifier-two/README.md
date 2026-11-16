# verifier-two — 第二独立实现（2026-11-16 开工）

**定位**（STRATEGY v19）：让「双验证器零分歧」从一次性（A/B）变成**公开可复现常态**——第三方拿这份代码在任意受测实现上跑五项绑定检验。这是「MCP 迁移后鉴权完整性鉴定」交付卷宗 §C 的基础设施。

**约束**：不新增仓库（停三件纪律）——住本仓子目录；Apache-2.0（分层：验证器=open）。

## 接口契约 v0
输入：`{receipt_json, session_context, tool_call}` → 输出：`{verdict: ALLOW|DENY, rule: TV-B1..B5|FAIL-CLOSED, detail}`
- 与 verifier-A/B 语义对齐：DENY 必须由受测实现产生，本实现只记录与判定
- 每条 DENY 附逐字节输入，保证第三方重放

## 里程碑
1. [x] 接口契约（本文件）
2. [ ] TV-B1 subject binding 判定器 + 1 条可重放向量
3. [ ] TV-B2/B3 签名组检验
4. [ ] TV-B4/B5 + fail-closed 结构检查
5. [ ] 三个官方 SDK 靶实跑（Python 2.3.0 / TS 1.32.2 / Go 中招实现）→ 公开卷宗

进度记录追加于此，不写新文档。
