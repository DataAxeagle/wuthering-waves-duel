# 执行与验证

## 备份

- `archives/backups/pvp-reliability-20260823-111128`
- 7 个关键源码/测试文件逐项 SHA-256 一致，迁移 SQL 同步备份。

## 修改文件

- `mobile/pvp.js`
- `mobile/pvp-game.js`
- `mobile/game.js`
- `supabase/functions/pvp/index.ts`
- `tests/pvp.test.cjs`

## 验证

- Deno Edge Function 类型检查通过。
- 规则、卡库、AI、自组卡组、PVP：35/35 通过。
- 新增乱序网络测试：服务端返回版本 3、2 时，客户端实际顺序为 `动画2 → 状态2 → 动画3 → 状态3`。
- 空房离开测试确认：客户端调用 `leave`；普通网络失败保留本地会话供重试；成员/房间已终止时安全清理本地会话。
- 响应式：桌面 7 档、PVP 横屏 2 档、先后手提示通过。
- PVP 匿名登录态往返恢复通过。
- 完整包 264 文件、精简包 81 文件，均逐条可读并包含 `leave` 与顺序事件队列。
- 完整包 SHA-256：`941EF3DDFDE26FE1070BAED75B1CF4D3E736008A0998A8033514172C484C2E86`。
- 精简包 SHA-256：`4A30991961AEDE69EF7770F131DC277EE018643CDC430A7A0C7AAC7FC3CD2914`。
- Cloudflare 线上资源与精简包 80/80 哈希一致。
- 线上 PVP 页面、Supabase SDK、Turnstile 与 challenge 资源均返回 200，无失败请求或脚本异常。

## 验证边界

- 专用测试浏览器没有已完成人机验证的匿名会话，因此本轮无法自动创建真实房间并执行线上双人操作；真实离房事务由 Edge Function 部署、类型检查、客户端行为测试和服务端代码路径覆盖确认。
- 仍建议用两台真机做一次“创建空房 → 离开 → 立即再创建”和“网络限速下连续操作”的最终验收。
