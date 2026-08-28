# PVP验证成功后联机会话持久化

## 根因

- Turnstile成功回调原先只把一次性 `captchaToken` 保存在当前PVP页面内存中，并立即显示“验证已完成”。
- Supabase匿名登录要等玩家点击“创建房间”或“加入房间”才执行。
- 玩家验证成功后若先进入单机或离开PVP页，内存token会随页面销毁；返回PVP时没有Supabase会话，只能重新做人机验证。

## 修复

- Turnstile成功后立即调用 `signInAnonymously({ options:{ captchaToken } })`。
- 建立身份期间保持创建/加入按钮锁定，并显示“验证已通过，正在建立联机身份……”。
- 只有Supabase会话成功写入浏览器存储后，才显示“联机身份已保存，可以创建或加入房间”并解锁按钮。
- 再次进入PVP时复用持久化会话，不重新加载Turnstile。
- 身份建立失败时重置组件并显示重新验证按钮。

## 发布与交付

- Cloudflare Pages最终部署：`https://bfaf1fed.wuthering-waves-duel-mobile.pages.dev`。
- 稳定地址：`https://wuthering-waves-duel-mobile.pages.dev/pvp`。
- 修改前备份：`archives/backups/mobile-20260822-004721-pre-pvp-auth-persistence/`，264个文件逐文件哈希差异0。
- 完整包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-20260822-005212.zip`。
- 精简包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-上传精简版-20260822-005212.zip`。

## 验证

- 规则、PVP、卡库测试33/33通过。
- 确定性浏览器回归：首次Turnstile渲染1次并保存会话；进入单机首页后返回PVP，Turnstile渲染0次，按钮保持解锁。
- 生产 `pvp.js` 与本地哈希一致并包含 `persistCaptchaSession`。
- 生产自动化浏览器被Cloudflare判为高风险时仍会进入15秒超时重试分支；真实设备成功一次后应出现“联机身份已保存”提示。
