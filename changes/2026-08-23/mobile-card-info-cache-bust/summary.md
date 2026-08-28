# 手机版卡牌信息缓存混版修复

## 结果

- 修复腾讯云正式站点在复用旧域名、连续部署后可能出现的“新 HTML 配旧 JS/CSS”问题。
- 首页和好友 PVP 页的核心脚本、卡库、样式统一增加版本参数 `20260823-1910`，强制手机浏览器重新获取同一版资源。
- 卡牌库、卡面、卡牌效果文本和玩法内容未修改。
- 精简包、完整包均已重新生成、单独归档并部署到腾讯云。

## 正式地址

- `https://ai-axeagle.com`

## 交付物

- 完整包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-20260823-191347.zip`
- 精简包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-上传精简版-20260823-191347.zip`
- 腾讯云部署包：`output/导出/2026-08-23/鸣潮对决-腾讯云部署包-20260823-191425.tar.gz`

## 备份

- 本地完整手机版：`archives/backups/mobile-20260823-190942`
- 测试文件：`archives/backups/cache-busting-20260823-190942`
- 服务器部署前版本：`/opt/waves-duel/backups/20260823-191600-before-card-cache-fix`
