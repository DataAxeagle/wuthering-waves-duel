# 2026-08-25 变更汇总

## 当日概览

完成移动端横屏设置页可见性修复，移除屏幕档位并建立“先可访问、后缩放”的布局约束。

## 逐项记录

- [mobile-settings-visibility.md](mobile-settings-visibility.md)：设置页裁切修复、备份与验证结果。
- [mobile-combat-scale-layout.md](mobile-combat-scale-layout.md)：88% 缩放下右侧操作栏与底部说明区越界修复。
- [cloudflare-pages-mobile-deploy.md](cloudflare-pages-mobile-deploy.md)：手机版发布包、Cloudflare Pages 部署与线上回查。

## 影响范围

`mobile/index.html`、`mobile/game.js`、`mobile/styles.css`、项目协作规则与 Cloudflare Pages 手机版镜像。

## 验证结果

移动端脚本语法通过；根项目规则测试 39/39 通过；本地 `852 × 343` 横屏下，设置页关键控件、88% 缩放后的右侧操作栏和底部说明区均完整可见；Cloudflare Pages 新部署、稳定域名 `game.js` 与 `/api/status` 均返回 HTTP 200。

## 未完成项或风险

未进行真实 iOS Safari 设备复测。
