# 执行与验证记录

## 备份

- 完整手机版备份：`backups/mobile-20260819-190022/`。
- 核验：189 个文件，283,458,786 字节。

## 验证

- `node --check mobile/core.js`：通过。
- `node --check mobile/game.js`：通过。
- `node --test .\\tests\\mobile-core.test.cjs`：2/2 通过。
- `node --test .\\tests\\game.test.cjs`：29/29 通过。
- 浏览器横屏预览：
  - 加号后行动牌数量从 `0 / 40` 变为 `1 / 40`，且不再打开数量弹窗。
  - 三次保存后有 3 个存档；第四次保存出现 3 个覆盖候选。
  - 设置页无纵向溢出，自动 AI 引导隐藏。
  - 充能图标在已选手牌上可见。
  - 响应详情区可见，确认和不放牌按钮宽度相等。

## 横屏交互与 AI 追击收尾补丁验证

- 完整手机版备份：`backups/mobile-20260819-203000/`，189 个文件。
- `node --check mobile/game.js`：通过。
- `node --test .\\tests\\game.test.cjs`：32/32 通过。
- 横屏浏览器实测：向自组牌组加入 1 张行动牌后点击已加入卡，数量由 `行动 1 / 40` 变为 `行动 0 / 40`，且未弹出数量选择层。
- 横屏浏览器实测：充能图标定位样式同步写入，且右侧说明列不再参与其坐标计算。

## 本轮独立交付包与归档

- 安装包：`output/鸣潮对决-手机版-20260819-195051.zip`。
- 独立归档副本：`output/导出/2026-08-19/手机版/鸣潮对决-手机版-20260819-195051.zip`。
- ZIP 条目数：222；两个副本 SHA-256 一致：`CEF7DA546B9B678C835A60FBFFD2C2A3A6E49E2E290C0A1BA0697C8501AE9C2F`。
- 手机版归档规范已写入项目级 `PROJECT.md`（并同步保留在 `mobile/README.md`），今后所有可交付手机版改动均必须执行“源码备份 → 独立安装包 → 手机版单独日期归档 → 哈希核验”。

## 自组卡组逐张角色构筑验证

- 完整手机版源码备份：`backups/mobile-20260819-200000/`，189 个文件。
- `node --check mobile/core.js`、`node --check mobile/game.js`：通过。
- `node --test .\\tests\\mobile-core.test.cjs`：3/3 通过，覆盖逐张角色卡、重复角色编号和未选角色专属行动卡。
- `node --test .\\tests\\game.test.cjs`：32/32 通过。
- 横屏浏览器实测：旧版三角色自组牌自动迁移为 9 张角色卡；新牌组加入单张角色卡后显示 `角色卡 1 / 3–15`；未选今汐时加入其专属行动卡被阻止。

## 充能按钮与详情分界线验证

- 完整手机版源码备份：`backups/mobile-20260819-200552/`，189 个文件。
- 横屏浏览器实测：未选牌和选牌后，效果说明区左侧均为 `1px solid` 分界线。
- 普通选牌时，充能按钮右边缘与选中卡右边缘误差不超过 8px，且完全位于效果说明区左侧。
- 模拟教程为充能按钮添加 `tutorial-target` 后，按钮仍为 `position: absolute`，坐标与普通状态完全一致。
- `node --test .\\tests\\mobile-core.test.cjs`：3/3 通过；`node --test .\\tests\\game.test.cjs`：32/32 通过。
- 新手机版包：`output/鸣潮对决-手机版-20260819-200947.zip`。
- 手机版单独归档：`output/导出/2026-08-19/手机版/鸣潮对决-手机版-20260819-200947.zip`。
- ZIP 共 222 项，安装包与归档副本 SHA-256 一致：`52E68AB3863DEB74BE3B87E581F0B8A07A03BEC06A305D50BD6137662628820C`。

## AI 追击结算调度验证

- 完整手机版源码备份：`backups/mobile-20260819-202938/`，189 个文件。
- `node --test .\\tests\\mobile-core.test.cjs`：4/4 通过；新增精确断言“AI 红牌响应获胜 → 本轮效果/伤害 → 连续追击 → 停止追击 → 原回合方结束 → 下一回合”。
- `node --test .\\tests\\game.test.cjs`：32/32 通过。
- 真实横屏页面回归：AI 红牌获胜后连续追击 2 次，两次均独立结算 1 点伤害；随后自动停止追击并回到原回合方的“请结束回合”状态。
- 页面未捕获异常：0；最终动画层已关闭，操作锁已释放。
- 新手机版包：`output/鸣潮对决-手机版-20260819-203254.zip`。
- 手机版单独归档：`output/导出/2026-08-19/手机版/鸣潮对决-手机版-20260819-203254.zip`。
- ZIP 共 222 项，安装包与归档副本 SHA-256 一致：`1B838FD339A62B6B122853967D689DAE60D27B56EE1C229CB096B3C2BAAA6883`。

## AI 决策 10 秒兜底修正

- 修正前完整手机版源码备份：`backups/mobile-20260819-205354/`，189 个文件。
- 追击恢复为 DeepSeek 优先；只有单次决策超过 10 秒、请求失败或服务未配置时，才由本地规则 AI 兜底。
- 保留 AI 调度总异常收口，确保异常时释放操作锁并安全结束追击，不造成永久卡死。
- `node --check mobile/game.js`：通过。
- `node --test .\tests\mobile-core.test.cjs`：4/4 通过；`node --test .\tests\game.test.cjs`：32/32 通过。
- 真实横屏页面回归：本地 AI 兜底路径完整执行多次追击并自动停止，最终显示“AI 已停止追击，请结束回合”；操作锁已释放，页面异常 0。
- 新手机版包：`output/鸣潮对决-手机版-20260819-210624.zip`。
- 手机版单独归档：`output/导出/2026-08-19/手机版/鸣潮对决-手机版-20260819-210624.zip`。
- ZIP 共 195 项，其中 189 个文件与 `mobile/` 源码逐项一致，无缺失、无额外文件；安装包与归档副本 SHA-256 一致：`1C31B97C0B6F14261C309F701F00B2647EB6D147F16195493FE11212CBC1AAD8`。

## Cloudflare Pages 生产部署

- 沿用 Pages 项目 `wuthering-waves-duel-mobile`，从项目根目录发布 `mobile/` 并同时上传现有 `functions/api/`。
- Wrangler 4.124.0 编译 Functions 成功；188 个静态资源完成核对，其中 7 个新文件上传、181 个复用；部署 ID：`1d612701`。
- 新部署别名：`https://1d612701.wuthering-waves-duel-mobile.pages.dev`；稳定生产域名：`https://wuthering-waves-duel-mobile.pages.dev`。
- 生产页面加载正常；线上 `game.js` 返回 200，包含 `AI_DECISION_TIMEOUT_MS = 10_000` 与追击 DeepSeek 请求，旧的立即本地接管逻辑不存在。
- 生产 `/api/status` 返回 200：Functions 可用，模型为 `deepseek-v4-flash`，Key 保持浏览器会话级存储边界。
