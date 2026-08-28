# 分享包瘦身与目录去重

- 调整 `打包分享版.ps1`，让桌面分享包在 staging 阶段剔除重复的 `demo/demo` 目录。
- 让分享包卡图只保留运行时需要的 WebP 版本，并把 `card-library/catalog.js` 中的卡面路径同步到 WebP。
- 保留源码里的 PNG 原图，便于后续继续编辑和核验，不影响本地 demo 开发。
