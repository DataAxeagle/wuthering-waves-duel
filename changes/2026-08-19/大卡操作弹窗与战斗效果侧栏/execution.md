# 执行与验证记录

- 修改前 HTML 备份：`output/鸣潮对决-HTML修改前备份-20260819-131106/demo`、`output/鸣潮对决-HTML修改前备份-20260819-133224/demo`、`output/鸣潮对决-HTML修改前备份-20260819-151705/demo`。
- 修改文件：`demo/index.html`、`demo/game.js`、`demo/styles.css`。
- 静态检查：`node --check demo/game.js` 通过。
- 规则测试：`node --test tests/game.test.cjs`，26/26 通过。
- 卡牌库测试：`node --test tests/card-library.test.cjs`，3/3 通过。
- 按用户要求未进行浏览器视觉回归。
- 新手教程同步：操作弹窗打开后，蓝框改为指向弹窗内的选牌区或确认按钮；追击弹窗打开前仍指向“战斗/追击”按钮。
- 独立分享包：`output/鸣潮对决-分享版-20260819-152821.zip`；已确认其中包含更新后的 `app/demo/index.html`、`app/demo/game.js` 与 `app/demo/styles.css`。
