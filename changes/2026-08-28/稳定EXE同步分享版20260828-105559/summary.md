# 稳定 EXE 同步分享版 20260828-105559

## 交付

- 新稳定 EXE 包：`releases/stable-desktop/exe版本/鸣潮对决桌面版-20260828-105559.zip`
- 同步基线：`releases/share-packages/desktop/builds/鸣潮对决-分享版-20260828-105559`

## 同步结果

- 新包以最新分享版完整目录为基线，保留原 EXE 启动程序、PDB 和使用说明。
- 分享版进行了资源格式和目录瘦身：旧 PNG 与重复目录被清理，卡面改为 WebP；因此不从旧 EXE 包保留任何旧 `app/` 资源。
- 新包中 105 个分享版文件的路径和 SHA-256 与来源逐一一致。

## 验证

- 新包包含 EXE、PDB、使用说明、许可证、启动游戏脚本与 AI 配置脚本。
- `app/demo` 与 `app/server.js` JavaScript 语法检查通过。
- 使用新包运行时启动服务，`/api/status` 正常返回 `wuthering-waves-duel`。

## 保留边界

- 既有稳定 EXE ZIP 均未覆盖，可随时回退。
