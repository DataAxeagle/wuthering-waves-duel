# 执行记录

日期：2026-08-20

## 移动映射

- `卡牌素材/` → `assets/card-art/`
- `输入素材/` → `assets/input/`
- `桌面EXE版/` → `packaging/desktop-exe/`
- `稳定输出版本/` → `releases/stable-desktop/`
- `output/` 内桌面/手机版交付物 → `releases/share-packages/` 对应平台目录
- `backups/` → `archives/backups/`
- 修改前 HTML 快照 → `archives/pre-change/`

## 后续验证

- 运行卡牌库测试，验证原始素材路径。
- 对打包脚本做 PowerShell 语法检查，并确认新发布路径可创建。
- 扫描当前源码和工作流中的旧路径；历史记录与归档内容除外。
