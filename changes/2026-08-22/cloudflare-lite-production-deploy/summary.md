# Cloudflare Pages精简版生产部署

## 部署

- 来源包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-上传精简版-20260822-005212.zip`。
- 独立解压目录：`output/导出/2026-08-22/cloudflare-lite-deploy-005212/`。
- Pages项目：`wuthering-waves-duel-mobile`，生产分支 `main`。
- 部署版本：`https://3c294cf7.wuthering-waves-duel-mobile.pages.dev`。
- 稳定地址：`https://wuthering-waves-duel-mobile.pages.dev`。
- 上一完整版部署 `bfaf1fed` 保留为回滚点。

## 完整版与精简版区别

- 完整版：265条目、303,655,252字节；保留PNG原始卡面、Demo、文档、开发记录、预览页及其他非运行文件。
- 精简版：81条目、22,329,577字节；保留11个根运行文件、3个卡库数据文件、60张WebP卡面和7个必要视觉/视频素材。
- 两者游戏规则、60张卡库、单机AI、PVP、手机/电脑UI和主要视觉效果一致。
- 精简版不包含 `preview.html`、原始PNG卡面、`demo/`、README、开发脚本和历史改动记录，不能作为完整源码归档或素材母版。

## 验证

- 精简目录81个文件与当前 `mobile/` 对应文件逐项SHA-256差异0。
- 四个核心JS语法检查通过；精简目录响应式回归覆盖7个通用视口、2个PVP手机视口和先后手提示。
- Wrangler部署清单：80个公开资源 + `_headers`，Pages Functions正常编译上传。
- 生产80个公开资源与精简目录逐文件哈希全部一致。
- 删除路径只回退到首页HTML，未继续提供旧PNG/Demo/README/预览文件。
- 首页与PVP浏览器截图通过；`/api/status`返回HTTP 200且 `available:true`。
