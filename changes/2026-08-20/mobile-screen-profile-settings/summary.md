# 手机版屏幕适配档位

## 结果

- 设置页新增“自动推荐”和 3 个手机横屏档位：经典 16:9（736 × 414）、全面屏 19.5:9（852 × 393）、安卓宽屏 20:9（915 × 412）。
- 自动模式按当前浏览器可用视口的长宽比选择最接近档位；手动选择会立即应用并保存到当前浏览器。
- 三档分别调整右侧操作栏、手牌区、手牌卡面、角色卡和战场中央区域尺寸，不使用会破坏点击坐标的整页 `zoom`。
- 适配同时作用于单机与 PVP 开局后的共用战场；房间页本身不改变。

## 调研依据

- Apple iPhone 17：6.3 英寸、2622 × 1206；Apple 开发者文档列出的 iPhone 17 CSS 视口为 402 × 874。
- Samsung Galaxy S25：6.2 英寸、2340 × 1080；S25+ / Ultra 为 3120 × 1440。
- Xiaomi 15：6.36 英寸、2670 × 1200；REDMI 15：6.9 英寸、2340 × 1080。
- 实现按网页实际可读的 CSS 视口和屏幕比例分档，而不是直接把物理像素当作 CSS 尺寸。

## 边界

- 没有修改规则、卡牌、伤害、AI、PVP 房间后端或素材。
- 没有修改 Supabase 数据库、Edge Function、密钥、域名或 Turnstile 配置。

## 正式交付

- Cloudflare Pages 部署版本：`ef7faa3d`。
- 版本地址：`https://ef7faa3d.wuthering-waves-duel-mobile.pages.dev`。
- 稳定生产地址：`https://wuthering-waves-duel-mobile.pages.dev`。
- 正式包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-20260820-180437.zip`。
- 手机版日期归档：`releases/share-packages/mobile/archive/2026-08-20/手机版/鸣潮对决-手机版-20260820-180437.zip`。
- 两个 ZIP 均含 248 个文件、252 个总条目，无缺失或额外文件；SHA-256 一致：`3B8223A48A697A9F245FCBBF00911C094A7B7AF917C9C90F8C145A9F80F4FCE2`。

## 备份

- `archives/backups/mobile-20260820-163027-pre-screen-profile-settings/`
