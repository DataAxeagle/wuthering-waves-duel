# 执行记录

## 修改范围

- `mobile/core.js`：统一角色效果可用性判定，并接入回合开始、回合结束、对抗、判定、连击加成、卡牌数值和受伤被动。
- `mobile/game.js`、`mobile/index.html`、`mobile/styles.css`：复用角色牌库查看弹窗增加双方协奏区入口及完整详情。
- `mobile/index.html`、`mobile/pvp.html`：核心资源版本参数更新为 `20260823-2306`。
- `tests/mobile-core.test.cjs`：增加后台非领队效果、领队限制、后台炽霞被动和双方协奏区入口回归测试。
- `rules/游戏规则.md`：记录角色效果触发位置与协奏区公开信息规则。

## 验证

- `node --check mobile/core.js`：通过。
- `node --check mobile/game.js`：通过。
- 规则、卡库、PVP、弹窗与缓存自动测试：80/80 通过。
- 响应式布局：7 个视口通过。
- PVP 横屏大厅：844×390、667×375 通过。
- 设备 UI：21 个手机页面状态、3 个桌面视口通过。
- 卡牌图鉴与战斗详情滚动：通过，控制台错误 0。
- browser-automation 实测 iPhone 15 Pro 预览 iframe 为 842×388；己方与对方协奏区各显示 8 张测试牌，完整效果可读，弹窗和关闭按钮未溢出。
- 截图：`output/测试/2026-08-23/协奏区公开查看-iPhone15Pro.png`。

## 已知的既有检查问题

- `check-screen-profile-layout.mjs` 仍报告旧屏幕适配面板/战场区域裁切。
- `check-turn-character-pursuit-ui.mjs` 仍报告旧角色说明坐标超出测试视口。
- 两项失败位置不在本次修改的协奏区弹窗与角色触发规则范围内，本轮未扩大修改范围。

## 打包核验

- 完整包：269 个 ZIP 条目，SHA-256 `90034B0A68F03A5EFE5F357C3E37C56221D3077F623781F1FCF45629A92B7CF1`。
- 精简包：83 个 ZIP 条目，SHA-256 `E54027D3276D8D4754325C5D57625B6E2C7359112F648039B79615771B939F25`。
- 两个构建包与“手机版”归档副本 SHA-256 分别一致。
