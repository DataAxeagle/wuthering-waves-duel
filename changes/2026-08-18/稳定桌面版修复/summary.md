# 稳定桌面版修复

## 结论

已停止使用会产生“窗口标题存在但内容全黑”的 Electron 交付路线，新增稳定 Windows 启动 EXE。它启动包内 Node 服务，并让 Microsoft Edge 以无地址栏应用窗口渲染最新游戏页面。

## 交付入口

`桌面EXE版/稳定版/鸣潮对决桌面版/启动鸣潮对决.exe`

该目录包含完整 `app/demo/`、57 个卡牌素材与 `app/runtime/node.exe`；整体移动即可运行，无需 CMD 或系统 Node.js。

## 素材修复

卡图目录含中文名。渲染层现在通过 `encodeURI` 生成卡图 URL，避免 Chromium 将中文路径解析失败；页面级验证已确认卡图返回 `765×1072` 的真实尺寸。

## 验证

- 启动 EXE 后，本地服务 `/api/status` 返回 `wuthering-waves-duel`。
- 应用窗口实际打开为 `鸣潮：对决 | Wuthering Waves: Duel`。
- 页面级验证确认 `document.readyState=complete`、主界面文本存在、卡图正常加载。
- 游戏和卡库测试：28/28 通过。
- 响应式布局检查：7 个视口尺寸通过。

## 已知边界

优先使用 Microsoft Edge，其次 Google Chrome；两者均没有时调用系统默认浏览器，因此不再把 Edge 作为运行前置条件。旧 `release-1.0.x` Electron 文件保留为历史构建，但不再推荐运行。
