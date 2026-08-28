# 执行记录

## 备份

- 修改文件备份：`archives/backups/mobile-upgrade-card-choice-20260828-003216/`
- 完整修改前手机版备份：`archives/backups/mobile-20260828-003216/mobile/`
- 修改前 `game.js` 哈希已核对一致。

## 验证

- `node --check mobile/game.js`：通过。
- 定向规则测试：74 / 74 通过。
- 真实浏览器：炽霞升级候选准确显示 `BP01-026`、`SD01-006`；选择 `BP01-026` 后弃牌弹窗显示对应编号和效果；852 × 343、平板、电脑布局均通过。
- browser-automation 专用 Chrome 9222 已启动；skill 的 CDP Proxy 组件缺失，使用项目现有直连 CDP 脚本完成验收；本地页面不涉及登录态。
- 完整版：291 个文件条目，SHA-256 `743A7D789A3479447E4A1C2C1867017349B1C23035FC783EA7F7370B8F027463`。
- 精简版：95 个文件条目，SHA-256 `E9CBF4B2EF6D0FB50BED5CB9A5C04B372825631BADDFBCAD49529B6C0B300E88`。
- 两个 builds 包与日期归档副本哈希分别一致。
