# Cloudflare PVP 人机验证生产修复

## 根因

1. Cloudflare Pages 稳定域名仍在运行旧版 `pvp.html` 与 `pvp.js`，未包含本地已经完成的 Turnstile epoch、防旧回调、动态重载和失效会话恢复。
2. 部署最新版后，自动化复现到 Cloudflare 挑战偶发一直转圈但不触发成功或错误回调；原页面因此可能永久停在“请完成上方人机验证”。

## 修复

- 将本地最新 PVP 验证链路发布到原 Pages 项目 `wuthering-waves-duel-mobile`。
- 新增从“发起验证请求”开始计算的15秒总看门狗；脚本加载、组件重建和进入交互均不会重置总计时。
- 超时后明确显示“人机验证响应超时，请重新加载验证”，并展示可点击的重新加载按钮。
- Cloudflare `error-callback` 现在显示实际错误码，便于区分域名未授权、站点密钥无效和网络错误。
- 成功后立即取消计时并解锁创建/加入房间；已有有效 Supabase 会话继续直接复用。
- 未修改 Turnstile sitekey、secret、Cloudflare 域名、Supabase CAPTCHA 配置或数据库结构。

## 线上结果

- 稳定地址：`https://wuthering-waves-duel-mobile.pages.dev/pvp`
- 最终部署别名：`https://628d0597.wuthering-waves-duel-mobile.pages.dev`
- 生产 `pvp.js` SHA-256 与本地一致。
- 最坏情况验收：18秒后状态为 `error`，重试按钮可见，创建/加入保持锁定；点击重试后组件成功重建并重新进入 `loading`。

## 备份与包

- 修改前备份：`archives/backups/mobile-20260822-001839-pre-turnstile-redeploy/`，264个文件逐文件哈希差异0。
- 完整包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-20260822-003556.zip`。
- 精简包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-上传精简版-20260822-003556.zip`。
