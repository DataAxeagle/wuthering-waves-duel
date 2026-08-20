# 鸣潮对决 PVP 后端

本目录包含好友房 PVP 所需的 Supabase 数据迁移、RLS、事务函数和 Edge Function。它不包含任何项目密钥。

前端房间大厅只负责组房和准备；比赛开始后由 `mobile/index.html?pvp=1` 复用原单机战场。服务端投影会按登录席位重排视图，使双方各自在本机始终显示为下方玩家。

## 组成

- `migrations/20260820090000_pvp.sql`：房间、成员、私有卡组、权威比赛、玩家视图、行动回执、RLS、Realtime 授权和清理任务。
- `functions/pvp/index.ts`：创建/加入/恢复/准备/状态/心跳/动作/认输/断线判胜 API。
- `functions/_shared/game-runtime.ts`：加载与浏览器共用的卡库和 `DuelGame` 规则核心。
- `functions/_shared/pvp-state.mjs`：按席位生成脱敏状态和事件。

## 首次部署

1. 在 Supabase 新建独立项目，记下 Project Ref、Project URL 和 publishable key。
2. 启用 Auth → Anonymous Sign-Ins。
3. 在 Cloudflare Turnstile 创建站点；在 Supabase Auth CAPTCHA 中启用 Turnstile，并只在后台填写 Turnstile secret。
4. PVP 仅订阅 `pvp_player_views` 的 Postgres Changes；表级 RLS 保证登录用户只能收到自己的脱敏视图。不使用 Broadcast/Presence，也不依赖可选的 `realtime.messages` private-channel 授权表。
5. 登录并关联项目：

   ```powershell
   npx -y supabase@latest login
   npx -y supabase@latest link --project-ref <PROJECT_REF>
   ```

6. 推送数据库迁移并部署函数：

   ```powershell
   npx -y supabase@latest db push
   npx -y supabase@latest functions deploy pvp
   ```

7. 将 Project URL、publishable key、Turnstile site key 填入 `mobile/pvp-config.js`。这些是公开前端标识，不是服务端密钥。
8. 重新部署 Cloudflare Pages，生产根目录仍为 `mobile/`。

## 验证

```powershell
npx -y deno@latest check .\supabase\functions\pvp\index.ts
node --test .\tests\pvp.test.cjs
```

上线前必须用两个隔离浏览器会话完成：创建与加入、不同自组卡组、双方准备、完整对局、刷新恢复、隐藏信息检查、5 分钟断线判胜和房间结束失效。

## 密钥边界

- `SUPABASE_SERVICE_ROLE_KEY` 由 Supabase Edge Function 运行环境自动提供，不写入仓库。
- Turnstile secret 只写 Supabase Auth 后台。
- `mobile/pvp-config.js` 只能出现公开 Project URL、publishable key 和 site key。
