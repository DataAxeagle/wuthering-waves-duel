# 执行记录

## 验证

- `node --check demo/game.js`：通过。
- `node --check demo/core.js`：通过。
- `node --test tests/game.test.cjs`：20 通过，0 失败。
- `node --test tests/card-library.test.cjs`：3 通过，0 失败。
- `powershell.exe -NoProfile -ExecutionPolicy Bypass -File launcher.ps1 -ValidateOnly`：通过；启动器成功自检后，若真实启动失败将直接输出原始 `Error:` 行。
- 已修复部分 Windows `cmd.exe` 对 Unix LF 批处理换行的错误解析：`启动游戏.cmd` 与 `配置AI.cmd` 均已转换为 ANSI + CRLF，无 BOM、无孤立 LF；避免命令被错误截断成 `rshell.exe`、`ho` 等无效命令。
- 已打包：`output/鸣潮对决-分享版-20260817-230642.zip`；360.4 MB、189 个条目，包含 `启动游戏.cmd` 与 `app/demo/index.html`，SHA-256 为 `D7D972F0FE4B16205D8577110B974C84AE38DD59BAA2BA01F9CDFDC4B66EB934`。

## 卡面错配修复验证

- 用户补充的炽霞原图已录入：`SD01-007`「砰砰·普攻」及 `SD01-008`「砰砰·闪避反击」；来源图保存在 `卡牌素材/炽霞-SD01-007-用户提供.jpg` 与 `卡牌素材/炽霞-SD01-008-用户提供.jpg`，运行卡面分别保存在对应 `art/红色攻击`、`art/蓝色闪避` 目录。
- 开始新对局时已将 `menuBackgroundVideo.muted` 设为 `true`，并同步更新音量按钮状态。
- 新增“闪避获胜后抽牌并由效果拥有者自主选择弃置手牌”回归测试。
- `node --check demo/core.js`、`node --check demo/game.js`、catalog JSON / JS 解析：通过。
- `node --test tests/game.test.cjs`：24 通过，0 失败。
- `node --test tests/card-library.test.cjs`：3 通过，0 失败。
- 本地浏览器实际启动并验证：右上角已无重开与 AI Key 提示；回合状态已移至战场顶部；角色牌库可打开并读取 6 张剩余角色牌，选择后右侧展示完整卡面和效果。
- 针对 720px 高视口补充弹窗内部滚动，确保底部“关闭，返回对战”按钮可见可用。

## 运行提示

- 4173 端口存在旧服务时，会继续显示旧前端；本次核验改用 4174，确认读取的是当前源码。分享包启动时会自动寻找可用端口。

## 二次布局验证

- 暂停菜单已在测试场实际打开：背景暗化、菜单居中、底部顺序为“返回主界面”“退出游戏”。
- “返回主界面”已实际跳转到视频动画封面，同时保留当前对局以供主菜单中的返回对局入口继续使用。
- 已确认护盾的水平位置在 HP 信息右侧。

## 紧凑布局验证

- 附件背景图已复制至运行资源，SHA-256：`36418A5BBB4E1BD95E0DBB56BA7E735308B4C8E9DFBEC14560332A1AC34DA214`。
- 本地页面截图核验：角色牌库已位于 COST 下方的小型牌堆位；协奏区短条、敌方右上信息、我方左下信息和手牌左下计数均已生效。
- 规则审计发现高风险未实现项，界面调整包不包含未核验的规则修复。

## 本轮修复与卡面核验

- 顶栏已替换为主界面的 `wuthering-waves-duel-logo.png`。
- 牌库固定在敌方区域上方、我方区域下方；我方弃牌堆可点击查看，敌方角色牌库与弃牌堆不再提供入口。
- 阶段条不再预置“战斗”高亮，按真实 `game.phase` 渲染；主要阶段只高亮“主要”。
- 对手手牌数在右上身份区的名字上方以 `X / 8` 展示。
- `node --check demo/game.js`、`node --check demo/core.js`：通过。
- catalog JSON / JS 解析：通过。
- `node --test tests/game.test.cjs`：23 通过，0 失败。
- `node --test tests/card-library.test.cjs`：3 通过，0 失败。
