# 执行记录

## 素材

- `demo/assets/menu/8月17日.mp4`：来自用户指定封面 Demo，SHA-256 `39518EB11D051C1C4747654CEE2EAB123D2565445D7A3B48CEC4FC2D2CA9DE23`。
- `demo/assets/menu/wuthering-waves-duel-logo.png`：来自用户指定封面 Demo，SHA-256 `4E247C654F1E0F263E5DC7A26763EF02FF21D4C7D14A19A7E1752DB869DB8ABD`。

## 验证

- `node --check demo/game.js`：通过。
- `node --check demo/core.js`：通过。
- `node --test tests/game.test.cjs`：20 通过，0 失败。
- `node --test tests/card-library.test.cjs`：3 通过，0 失败。
- `git diff --check`：未发现空白错误；工作树中存在本任务之外的既有重建/删除状态，未处理。

## 后续补正

- 根据验收反馈移除了残留的旧式侧栏菜单，并以 Demo 的 Hero/胶囊按钮布局替换全部菜单入口。

## 未做操作

- 未做新分享包打包。
- 未提交或推送 GitHub。
