# PAP/Poppy Radar v0 (2026-11-16)

方法：公开发现文件 passive GET（/.well-known/poppy.json），零握手注入零状态变更——registry radar 同款合规框架。

| 端点 | HTTP | Poppy 版 | 关键观察 |
|---|---|---|---|
| mystore.myshopify.com（Sunday Post Apparel, Shopify 模板） | 200 | 0.4 | auth.scopes=`dev.ucp.shopping.checkout:manage`（agent 以登录客户身份结账）；scope_hints 自标 `changes: "irreversible"`+`personal_data: true`；agent.protocols→UCP |
| shopify.com | 301 | — | 重定向 |
| admin.shopify.com | 200 | — | 非 JSON（登录墙） |
| mercury.com / turkishairlines.com | 404/000 | — | 尚未发现公开 poppy.json（Mercury 是 live 设计伙伴，发现路径待 spec §3 确认） |

**介入锚点**：
1. Shopify「every merchant」= 数百万商家同模板暴露不可逆结账面，scope 授权链无第三方验证层（spec §5.2 委派签名端点校验未描述）
2. 我方已在 PAP repo #70 提交技术评论（witness reference 三修正点+可重放向量贡献）：issuecomment-6907352634
3. 鉴定对象扩展：PAP `type:"mcp"` 端点 → 五项绑定检验直接适用（PASSIVE-OBSERVATIONS.md 同日记录）

下一轮：按 spec §3 discovery 语义抽样真实商家 poppy.json，产出 scope 声明一致性基线（聚合比例，不存原始数据——遵守 v19a 红线）。
