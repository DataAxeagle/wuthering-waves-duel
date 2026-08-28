# 执行记录

1. 先审计了 `打包分享版.ps1`、`demo/card-library/art` 和现有分享包，确认分享包体积主要来自重复的 `demo/demo`、大体积卡图和菜单视频。
2. 修改打包脚本，在 staging 阶段删除重复的 `demo/demo`，并把分享包卡图切换为只保留 WebP 版本，同时同步更新 `card-library/catalog.js`。
3. 重新执行打包脚本，生成新版分享包：
   - 目录版：`releases/share-packages/desktop/builds/鸣潮对决-分享版-20260828-105706`
   - ZIP：`releases/share-packages/desktop/builds/鸣潮对决-分享版-20260828-105706.zip`
4. 核对结果：
   - ZIP 条目数：106
   - ZIP 体积：131.75 MB
   - 目录版体积：186.93 MB
   - 分享包卡图库仅保留 73 个 `.webp` 文件，合计 11.70 MB
