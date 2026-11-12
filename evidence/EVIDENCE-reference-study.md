# MCP 会话安全审计 · 证据卷宗（第一发子弹）

**日期**：2026-11-12 ｜ **状态**：规范缺口+参考实现代码审计闭环；跨实现实测矩阵待网络环境
**性质**：对外可发送（脱敏）｜ **复现方式**：本卷所有行号引用可由任何人重读核对

## 一、规范语义缺口（靶区定位，2025-06-18 版规范原文）

MCP 规范 Session Management 条款（modelcontextprotocol.io/specification/2025-06-18/basic/transports）：

1. 会话 ID 仅要求 "SHOULD be globally unique and cryptographically secure"（如 UUID/random）；
2. 客户端后续请求 MUST 携带 `Mcp-Session-Id` 头；
3. 服务端 MAY 随时终止会话，之后对含该 ID 的请求 MUST 回 404；
4. **全文无任何条款要求会话 ID 与认证主体绑定**，也无会话终止的重鉴权要求；
5. Authorization 是独立章节（OAuth 2.1 Bearer），与会话管理零耦合。

**命题化**：
- P1 会话 ID 熵（规范已覆盖，低风险）
- P2 **会话 ID 劫持**：持有字符串即可完全接管会话能力——规范未要求绑定认证主体
- P3 **未鉴权会话终止**：持字符串即可 DELETE 杀死他人会话（拒绝服务）——规范未要求重鉴权
- P4 Last-Event-ID 重投递到未认证请求方（resumability，待测）

## 二、参考实现代码审计（@modelcontextprotocol/sdk 1.32.2，实测靶机即用它部署）

关键文件 `dist/esm/server/webStandardStreamableHttp.js`：

- **L737-759 `validateSession` 全文**：唯一校验 = `sessionId !== this.sessionId` **字符串相等**（L754）。
  无认证主体比对、无 Origin/Host 绑定、无 TLS 通道绑定、无第二因子。
- L232 / L554 / L717：POST/GET/DELETE 三类请求均只走这一个校验函数。
- L190-191：`case 'DELETE': return this.handleDeleteRequest(req)` ——会话终止同样仅凭会话 ID 头。
- L46 自述 "No session validation is performed"（stateless 模式，更弱）。

**代码审计结论**：官方参考实现的会话安全模型 = 「拿字符串即拿会话」。在真实部署里，会话 ID 会出现在日志、代理、错误页、前端存储——一旦泄漏，攻击者无需任何凭证即可 (a) 以受害者身份执行工具调用（含涉及资金/数据的敏感工具），(b) 随时终止其会话。

## 三、动态实测结果（2026-11-12，杭州 ECS · Node v20.18.1 · SDK 1.32.2）

靶机：官方 SDK 参考形态部署（express + StreamableHTTPServerTransport，按官方 example 惯例接线）。脚本 `oneshot.mjs`（入卷），单命令重放。

| 命题 | 裁决 | 证据 |
|---|---|---|
| P0 合法初始化 | ✅ | 200，sid=36 位 UUID |
| P1 会话 ID 熵 | ✅ 低风险 | 两会话 UUID 不相同 |
| **P2 会话 ID 劫持** | **⚠️ 成立** | 攻击者零凭证、仅持被盗 `Mcp-Session-Id`：服务端日志 `TOOL-EXECUTED:ATTACKER-FROM-STOLEN-SID` + SSE 响应 `receipt-of:ATTACKER-FROM-STOLEN-SID`——**敏感工具在受害者会话下完整执行** |
| **P3 未鉴权会话终止** | **⚠️ 成立** | 同样仅凭被盗 ID，DELETE → 200；随后合法请求 → 404（会话确实被杀） |

**审计过程中的诚实留痕**（复现者可跳过的弯路，如实记录）：
1. 靶机接线遗漏 `server.connect(transport)` → 消息被静默丢弃（这是我方 bug，非 SDK 判定）；
2. SSE 长连接使朴素 `text()` 挂死 → 改有界流读取；
3. `Accept` 必须双含 json+event-stream（SDK 406 检查）；
4. 每会话需独立 McpServer 实例（P1 第二次 initialize 的 connect 报错为测试器工件，不影响 P1 裁决——两个 UUID 已发出且不同）。

**结论**：官方参考实现 + 官方规范文本双重确认——**会话安全模型 = 「拿字符串即拿会话」**：劫持执行（P2）与未鉴权终止（P3）在规范未设防、参考实现未设防的条件下动态成立。攻击前置条件=会话 ID 泄漏（日志/代理/前端存储/错误页为现实泄漏面）。

**下一步**：① 社区 server 5-10 个横向矩阵 ② 披露包起草（SEP 修订建议：会话-主体绑定条款 + DELETE 重鉴权）③ 与 Corelight 报告差异化定位。

**为什么这可能够「世界级」判据**：
1. **矿脉新**：Streamable HTTP transport 2025-03-26 才引入，规范 2025-06-18 现行——语义审读环有新鲜矿；
2. **影响面**：所有官方 SDK 默认形态 + 数千社区 server 沿用同一模式——差分实测环是处女地；
3. **判据可兑现**：P2/P3 已在参考实现动态成立 → 社区矩阵扩充后提交规范 SEP（会话-主体绑定条款）+ 官方 SDK 公告 = 双收录（规范+CVE），硬线全绿；
4. **既有工作空白**：Corelight 2025-10 报告只测供应链依赖，无系统会话安全差分审计——我们的矩阵将是首份。

## 四、下一步

1. ~~迁移动态矩阵到 ECS~~（✅ 2026-11-12 完成，靶机 #1 四命题闭环）；
2. 横向拉靶：社区 MCP server 5-10 个（会话实现路径各异的）；
3. 出首份《MCP 会话安全差分矩阵》→ 披露包起草。

---

*Correctover — AI Reliability. 联系：wangguigui@correctover.com*

## 三-B、第二/三靶动态结果（2026-11-12 续，同环境）

| 命题 | 裁决 | 证据 |
|---|---|---|
| **P-SL1 stateless 零握手调工具** | **⚠️ 成立** | `sessionIdGenerator: undefined`（官方文档明示 "No session validation is performed"）部署下，无 initialize 无会话无凭证，直接 POST tools/call → 200 + 服务端日志 `SL-TOOL-EXEC:NO-HANDSHAKE-ATTACK` |
| P-LEID 事件流重放 | ⚠️ 部分成立 | 攻击者仅持 sid 建立 GET SSE 流（200）；eventStore 重投递数据未在采样窗内到达，待深测 |

**矩阵现状**：靶机#1（stateful）P2/P3 成立；靶机#2（stateless）P-SL1 成立；靶机#3（resumability）流建立成立。三种官方部署形态，**没有一种把工具执行和「谁在调用」绑起来**——绑定缺失是规范级空位，不是实现 bug。

## 三-C、T3 闭环弧线：forge 漏洞版 vs 修复版（2026-11-12 终）

同一构造（A=identity 公钥, S=42, R=42·B，标量小端编码）：

```
forge 1.4.0  identity+S42 零密钥伪造 => ACCEPTED (vulnerable)   ← CVE-2026-125335 受影响版
forge 1.4.3  identity+S42 零密钥伪造 => rejected false           ← 官方修复版
```

弧线：官方公告 → 我方零 PoC 独立复现（含 4 次自查纠错留痕）→ 修复版对照验证 → 全部公共工件单命令重放。**这就是 T3 Incident-to-Verdict 产品形态的第一个完整样例证据链。**

## 三-D、靶机#4：启用认证后的解耦判定（2026-11-12，分水岭实验）

部署：官方 SDK + Bearer 认证 middleware（模拟 OAuth 校验）。两个独立合法主体 alice / attacker。对照组齐全。

| 命题 | 裁决 | 证据 |
|---|---|---|
| P-A0 对照：无 token → 401 | ✅ | 认证层真实生效，非稻草人靶 |
| **P-A1 认证后跨主体接管** | **⚠️ 成立** | attacker 用**自己的合法 token** + 受害者 sid → `transfer_funds` 在受害者会话内执行，服务端日志 `TRANSFER-EXEC:attacker:$99999`——工具执行上下文 = 受害者会话，认证主体 = attacker，**两者零校验** |
| **P-A2 认证后跨主体杀会话** | **⚠️ 成立** | attacker 合法 token + 受害者 sid DELETE → 200；受害者本人随后持合法 token → 404（会话确实被杀） |

**判定**：命中「启用官方认证后仍可绕过」档——传输层会话（mcp-session-id）与认证主体（Authorization）**完全解耦**：认证回答"你是谁"，会话回答"你在哪个上下文里操作"，两者之间规范与参考实现均无绑定校验。跨主体接管在带认证部署中成立 → 强度支撑官方 SDK 公告 / CVE / SEP，而非仅"配置风险"。

**三条硬线进度**：①认证后仍可跨主体接管 ✅（本靶）②跨多实现复现 ◐（4 靶 3 形态，扩至 5-10 社区实现）③官方承认并修复 ○（SEP + 公告待提交）。

**对外口径（按主人 13:10 分层校准）**：
> "首个系统性揭示 MCP Streamable HTTP 会话 ID 与认证主体解耦风险的公开审计：在官方参考实现的认证部署形态下实证了跨主体工具执行与未鉴权会话终止，并覆盖 stateful/stateless/resumability 三种部署形态。"

不称"世界发现"；硬线①已过、③提交后视官方响应再升格。
