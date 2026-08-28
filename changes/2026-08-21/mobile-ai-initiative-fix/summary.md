# 单机 AI 先后手卡死修复

- 范围：仅修复手机版单机开局时 AI 获得抛硬币决定权的状态顺序。
- 原因：AI 在选择先后手前已被标记为 `setupConfirmed`，导致核心拒绝该选择并使 `firstPlayer` 保持为空。
- 修复：单机构造时由 AI 先自动选择先手，再锁定 AI 的准备状态；移除界面层的重复选择调用。
- 未修改：PVP、卡牌效果、手机布局、Supabase 后端配置。

## 验证

- `node --check mobile/core.js`
- `node --check mobile/game.js`
- `node --test tests/mobile-core.test.cjs tests/pvp.test.cjs`：30/30 通过。
- Cloudflare Pages 正式部署：`334c04f2-4736-48fc-b388-427b7f2d8b29`；线上 `core.js` 已确认包含自动选边修复。
