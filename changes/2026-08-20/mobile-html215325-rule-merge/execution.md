# 执行记录

1. 对当前 `mobile/` 与 `鸣潮对决-手机版-20260820-180437.zip` 做 248 文件哈希比对，确认完全一致后创建时间戳备份。
2. 对比 HTML215325 与手机版核心，保留手机版 RNG、PVP、存档、WebP、AI 看门狗、回合转场与屏幕档位实现。
3. 合并 60 张卡牌语义数据和新增角色素材，不覆盖手机版现有资源路径策略。
4. 将角色效果改为稳定 `effectId/operationId` 的待结算队列，快照保存选择状态；非法 UID、越权、重复提交和必选空选均拒绝。
5. 复用手机版 `responseOverlay` 实现弃牌区回收/置协奏选择，只添加 `discard-recovery` 模式样式。
6. 将 Supabase PVP 命令接到同一套 `mobile/core.js` 权威核心，增加规则版本检查和待选信息隐私投影。
7. 补齐联机双方的升级、对抗、延迟效果资源动画；联机已提交伤害走纯展示分支，避免客户端二次结算。
8. 执行单元、Deno 和 CDP 横屏回归，并保存手机端截图到 `output/测试/2026-08-20/`。

## 验证命令

```powershell
node --check mobile/game.js
node --test tests/game.test.cjs tests/card-library.test.cjs tests/mobile-core.test.cjs tests/pvp.test.cjs
$env:npm_config_cache='.\\.tmp-npm-cache'; npx -y deno@latest check .\\supabase\\functions\\pvp\\index.ts
node tests/check-screen-profile-layout.mjs
node tests/check-responsive-layout.mjs
node tests/check-turn-character-pursuit-ui.mjs
```

## 结果

- Node：67/67 通过。
- Deno：通过。
- CDP：三组脚本最终均通过。并行首次执行时两个脚本同时占用 4178 端口，其中一项出现 `EADDRINUSE`；改为顺序执行后通过，确认属于测试服务端口冲突，不是页面故障。
