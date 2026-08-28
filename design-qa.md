# 手机版回合与追击提示视觉 QA

- 我方源图：`C:/Users/47450/AppData/Local/Temp/codex-clipboard-da81ef27-3ba1-421e-be88-545f6f73e60e.png`
- 我方项目素材：`mobile/assets/backgrounds/turn-transition-frame.png`
- 我方 SHA-256（源图与项目素材一致）：`9D83D6BFCCDA1936A96ECC31FF38B2C0B2BA250E0EE274B34976B7B8D8FDE60E`
- 对方源图：`C:/Users/47450/AppData/Local/Temp/codex-clipboard-5f8e315f-95eb-4c29-b9a1-386c7f862fc6.png`
- 对方项目素材：`mobile/assets/backgrounds/turn-transition-opponent.png`
- 对方 SHA-256（源图与项目素材一致）：`E0229FF461AD3286BD3D6CE33DCBB5A07D1C9563D6CF0F7A71E2D03FAB568076`
- 我方渲染截图：`output/测试/2026-08-20/我方回合原图直用-844x390.png`
- 对方渲染截图：`output/测试/2026-08-20/对方回合原图直用-844x390.png`
- Viewport: 844 × 390 CSS px, deviceScaleFactor 1, mobile landscape

## Full-view comparison

- 我方回合只显示用户提供的第二张 1848 × 851 PNG。
- 对方回合只显示用户提供的第一张 1846 × 852 PNG。
- 两张图均由 `<img>` 直接加载，仅通过 `max-width`、`max-height` 和 `object-fit: contain` 缩放居中。
- 没有遮罩、动态文字、重绘、调色、滤镜或裁切；淡入淡出过程只作用于外层容器。
- 844 × 390 两个状态均完整留在视口内。

## Focused evidence

- Character trigger: `output/测试/2026-08-20/女漂Lv2角色效果提示-844x390.png`; 360 × 362.5 px, no clipping.
- Pursuit action: `output/测试/2026-08-20/追击按钮蓝框提示-844x390.png`.
- Stop pursuit: `output/测试/2026-08-20/停止追击按钮蓝框提示-844x390.png`; right-side button remains within the viewport.

## Required fidelity surfaces

- 字体与文字：完全使用两张源图内置文字，页面不叠加任何文字。
- 间距与布局：素材保持自身宽高比并在动画层居中。
- 颜色与画质：源文件原样复制且哈希一致，无重压缩或颜色处理。
- 状态映射：第二张图对应我方回合，第一张图对应对方回合。

## Findings

- No actionable P0/P1/P2 mismatch remains.
- 已移除上一版擅自加入的深色遮罩、动态标题与双方文字配色。

## 停止追击按钮回归

- 用户问题截图：`output/测试/2026-08-20/停止追击缺失-用户截图.png`
- 修复后截图：`output/测试/2026-08-20/追击教学停止按钮保持可见-844x390.png`
- 并排对比：`output/测试/2026-08-20/停止追击用户截图与修复对比.png`
- 根因：原实现用包含 `uiLocked` / `aiRunning` 的可操作状态决定按钮文案；教学或动画短暂锁定时，追击阶段被误显示为“结束回合”。
- 修复：追击阶段判断与临时交互锁分离；只要轮到玩家追击，按钮始终显示“停止追击”。教学遮罩中该按钮会提升到遮罩上层，但不抢占“有合法红牌时继续追击”的蓝框主提示。
- 844 × 390 验证：按钮位于 `left 747 / right 840 / top 159 / bottom 197`，没有越界，文案为“停止追击”，不再被遮罩压暗。

## 屏幕适配设置回归

- 经典 16:9：`output/测试/2026-08-20/屏幕适配/经典16比9-736x414.png`
- 全面屏 19.5:9：`output/测试/2026-08-20/屏幕适配/全面屏19点5比9-852x393.png`
- 安卓宽屏 20:9：`output/测试/2026-08-20/屏幕适配/安卓宽屏20比9-915x412.png`
- 结构化结果：`output/测试/2026-08-20/屏幕适配/screen-profile-layout-report.json`
- 三档自动推荐均解析到预期档位，手动选择与 `localStorage` 保存一致。
- 右侧操作栏实际宽度分别为 94 / 102 / 112 px，手牌区实际高度分别为 106 / 112 / 118 px，证明战场布局随档位变化而非只修改设置文字。
- 三档均无水平溢出、设置面板越界、子面板裁切、选项裁切或战场越界。
- 线上版本 `ef7faa3d` 再次通过同一三档回归；线上截图位于 `output/测试/2026-08-20/屏幕适配-线上-ef7faa3d/`。

final result: passed

---

# 电脑全屏复用手机战场布局 QA（2026-08-27）

- 视觉真值：`C:/Users/47450/AppData/Local/Temp/codex-clipboard-010a73de-2b1c-4c7b-937c-aa3a9aef2a1e.png`
- 问题截图：`C:/Users/47450/AppData/Local/Temp/codex-clipboard-c0959a2d-dae4-4520-96f6-5da9a5846275.png`
- 最终实现截图：`output/测试/2026-08-27/desktop-mobile-layout/desktop-1745x839.png`
- 同视口并排对比：`output/测试/2026-08-27/desktop-mobile-layout/comparison-reference-implementation.png`
- 主对比视口：1745 × 839 CSS px；补充回归视口：1366 × 768、1024 × 768。
- 使用项目现有战场背景、角色卡、行动卡和卡背；没有生成、替换或重编码素材。

## Full-view comparison

- 电脑端不再使用“左侧战报 + 中央战场 + 右侧主要阶段”的三栏桌面结构，改为与手机横屏一致的“战场 + 右侧行动栏 + 底部手牌/效果”结构。
- 双方 HP、COST、手牌数固定在左上与左下；双方行动牌库、角色牌库、弃牌区固定在右上与右下；角色卡继续居中排列。
- 右侧仅保留“进入战斗”和“结束回合”；重复的充能、升级、换领队区域已隐藏，实际操作仍从手牌与角色卡进入。
- 手牌保持底部横向浏览；右下效果区保持原卡牌详情内容并允许自身上下滚动，不会推动或遮住战场。

## Required fidelity surfaces

- 信息架构：双方状态、角色、牌堆、操作按钮、手牌和效果说明的位置与手机横屏保持一致。
- 功能：没有修改充能、升级、换领队、出牌、结束回合、查看牌堆或查看卡牌效果的业务逻辑。
- 手机与平板：新增样式均以 `html.desktop-ui` 为作用域，手机横屏和 iPad 断点未改。
- 文字与素材：沿用现有字体、颜色、卡面和背景；窄电脑屏幕只缩放尺寸，不裁切效果文字。

## Comparison history

- 初始 P1：电脑端独立三栏布局导致双方状态、牌堆和效果详情的位置与手机端完全不同。
- 初始 P1：右侧重复显示充能、升级和换领队，既占空间又与手机点按操作不一致。
- 第一轮：移除桌面战报栏与重复主要阶段面板，将状态、牌堆、角色、手牌和效果区按手机结构重新锚定。
- 第二轮：恢复双方圆形头像锚点，放大角色卡，并在 1250px 以下增加窄电脑尺寸收束。
- 最终对比：1745 × 839 的完整状态与视觉真值结构一致；1366 × 768、1024 × 768 均无关键区遮挡或页面横向溢出。

## Findings

- No actionable P0/P1/P2 mismatch remains.
- P3：电脑全屏未复刻手机预览器的外层圆角设备边框，因为用户要求的是全屏电脑版本；战场内部结构保持一致。

final result: passed

---

# 对抗阶段卡牌效果两栏弹窗 QA（2026-08-23）

- 用户视觉真值：`C:/Users/47450/AppData/Local/Temp/codex-clipboard-0a8bdae8-cd4e-44e4-b7c8-d561529606a6.png`
- 电脑端实现：`output/测试/2026-08-23/battle-showcase-layout/battle-showcase-desktop-1440x900.png`
- 手机横屏实现：`output/测试/2026-08-23/battle-showcase-layout/battle-showcase-mobile-844x390.png`
- 并排对比：`output/测试/2026-08-23/battle-showcase-layout/battle-showcase-reference-comparison.png`
- 使用项目现有“感知”完整 WebP 卡面；未生成、替换或重编码素材。

## Full-view comparison

- 源图中胜利卡面、效果和胜负结论纵向堆叠，完整卡面被挤在弹窗顶部并缩成横向可视片段。
- 修复后胜利展示固定为两栏：左栏只放玩家名和完整卡面；右栏从上到下展示胜负结论、卡牌名称、属性和效果。
- 电脑端弹窗维持原暗色、金边和青绿色强调设计，没有改动战场、操作栏、手牌或其他动画。
- 手机横屏使用相同两栏语义，只缩小卡面与文字；不会回退成顶部卡面、底部文字。

## Focused measurements

- 电脑端 1440×900：弹窗 860×429；卡面 276×368，宽高比 0.75；右栏 453×391。
- 手机端 844×390：弹窗 826×241；卡面 158×211，宽高比约 0.749；右栏 627×223。
- 两个视口均解析为 2 个 grid 列；卡面和右栏互不重叠，所有关键区域完全位于视口内。
- 卡面图片 `object-fit: contain`；效果区 `overflow-y: auto`，长文只在右栏内部上下滚动。

## Findings

- 已解决 P1：电脑端卡面被挤到弹窗顶部且无法完整展示。
- 已解决 P1：原结构实际形成卡面、效果、结论三块，宽屏仍会纵向堆叠。
- 已解决 P2：手机端旧规则可能被全局卡牌高度覆盖；现使用更高优先级的完整卡面尺寸规则。
- No actionable P0/P1/P2 mismatch remains.

final result: passed

---

# 手机图鉴与战斗详情滚动修复 QA（2026-08-22）

- 源视觉真值 1：`C:/Users/47450/.codex/codex-remote-attachments/01a01b06-537d-7d22-a2ca-76a861407a91/7FF5B832-5012-42DF-8306-DAB209D92036/1-照片-1.jpg`
- 源视觉真值 2：`C:/Users/47450/.codex/codex-remote-attachments/01a01b06-537d-7d22-a2ca-76a861407a91/7FF5B832-5012-42DF-8306-DAB209D92036/2-照片-2.jpg`
- 图鉴实现截图：`output/测试/2026-08-22/mobile-scroll-areas/codex-844x340.png`
- 战斗详情实现截图：`output/测试/2026-08-22/mobile-scroll-areas/battle-detail-844x340.png`
- 图鉴并排证据：`output/测试/2026-08-22/mobile-scroll-areas/design-qa/codex-source-left-implementation-right.png`
- 战斗并排证据：`output/测试/2026-08-22/mobile-scroll-areas/design-qa/battle-source-left-implementation-right.png`
- 源图像素：两张均为 1280 × 590；Safari 浏览器内容区约为 1280 × 515。
- 实现像素：2532 × 1020；CSS 视口 844 × 340，deviceScaleFactor 3。
- 归一化：源图裁去顶部 75px 浏览器栏；实现按比例降采样，双方统一为 1280 × 515 后并排比较。
- 状态：图鉴使用同一卡牌“炽霞 BP01-026”；战斗详情使用同一右下说明结构，并注入超长测试文字验证滚动边界。

## Full-view comparison

- 图鉴外层页面、返回入口、标题、两个下拉框和双栏结构尺寸保持不变。
- 修复后图鉴内部底边落在可视区内；卡面按剩余高度完整缩放，不再被 Safari 底部区域裁切。
- 战斗布局、手牌区和右侧操作栏尺寸未改；右下文字从说明区顶边开始显示，长内容留在原区域内滚动。

## Focused region comparison

- 图鉴左栏卡面在 844 × 340 与 844 × 390 下均完整位于 `.codex-card-visual` 内；右栏 `.codex-card-info` 的 `overflow-y` 为 `auto`，测试长内容可从顶部滚到底部。
- 战斗右下 `.selection-preview` 顶部间距从 10px 降为 0；102–108px 高的可视区域中，328px 测试内容可以滚动到底。
- 两个浏览器状态均无运行时异常；无需修改卡面素材、文字内容或战斗数据。

## Required fidelity surfaces

- 字体与排版：保留原字体、字号、字重和行高；只移除会截断长文字的 line-clamp。
- 间距与布局节奏：外框尺寸不变；只修正图鉴内部高度公式与右下说明的 10px 顶部空隙。
- 颜色与视觉 token：背景、边框、强调色、透明度均未修改。
- 图片质量：继续使用原 WebP 卡面，按比例缩放，无裁切、重编码或替换素材。
- 文案内容：真实卡牌文案未改；超长文字只在测试页面运行时注入，不进入产品数据。

## Comparison history

- 初始 P1：图鉴内部高度比实际 Safari 内容区多约 25px，卡面和详情底部被遮挡。
- 初始 P1：右下说明仍继承基础 `margin-top: 10px`，并被 4 行 line-clamp 截断。
- 第一轮修复：图鉴卡面完整缩放、详情启用内部滚动；右下说明启用内部滚动并取消截断。
- 第二轮发现：Safari 可视高度约 340px 时，卡面仍受宽度推导后的固有高度影响。
- 最终修复：卡面最大高度直接绑定 `100dvh - 187px`；844 × 340 和 844 × 390 均完整；说明顶部间距为 0，长内容滚动可达。

## Findings

- No actionable P0/P1/P2 mismatch remains.
- P3：桌面 CDP 的滚动条比 iOS Safari 更明显；属于浏览器原生滚动条差异，不影响触控滑动。

final result: passed

---

# 自组牌组卡牌区空间修复 QA（2026-08-21）

- 源视觉真值：`C:/Users/47450/AppData/Local/Temp/codex-clipboard-233affa6-e9fc-4884-b314-7fbe862df336.png`
- 修复后实现截图：`output/测试/2026-08-21/deck-builder-space-fix/mobile-deck-builder-844x390.png`
- 并排对比：`output/测试/2026-08-21/deck-builder-space-fix/design-qa-comparison-source-left-implementation-right.png`
- 视口：844 × 390 CSS px，横屏手机状态；实现截图 deviceScaleFactor 3（2532 × 1170 像素），源图 1389 × 657 像素。
- 归一化：并排对比统一缩放到 657 像素高；只比较应用自组牌组内容，忽略源图外层手机预览标题和实现截图的画布比例差异。

## Full-view comparison

- 源图顶部两行构筑说明占据卡牌库垂直空间，第二排卡牌紧贴并超出可见底边。
- 修复后完全移除该说明，牌组左右两栏直接从面板顶部开始；卡牌列表获得额外高度，844 × 390 下同时显示更多完整卡牌行，并继续保留内部滚动。
- 外层面板、返回入口、牌组名称、保存与清空按钮均未越界。

## Focused region comparison

- 聚焦右侧卡牌库：筛选器仍在首行；两列卡牌网格宽度、数量标记、滚动条和右侧卡牌详情区保持原有交互结构。
- 用户红框位置不再由顶部说明挤压；可见卡牌数量明显增加。无需额外裁切或缩放卡面。

## Required fidelity surfaces

- 字体与排版：仅删除用户指定说明，不修改其余字体、字号、字重或行高。
- 间距与布局节奏：释放说明占用的高度，现有 6px 紧凑间距与双栏结构保持不变。
- 颜色与视觉 token：未修改背景、边框、强调色或透明度。
- 图片质量：卡牌继续加载原 WebP 卡面，未重采样或替换素材。
- 文案内容：指定的整段构筑说明已不存在；卡牌区内必要的类型、数量和操作提示保留。

## Comparison history

- 初始 P2：顶部说明造成 844 × 390 下卡牌区垂直空间不足，红框处卡牌只显示一部分。
- 修复：从 `mobile/index.html` 删除该 `modal-lead` 段落，不改规则或卡牌列表逻辑。
- 修复后证据：21 个手机功能页状态和 3 个桌面视口均无页面裁切或水平溢出；自组牌组截图显示卡牌列表获得更多可见高度。

## Findings

- No actionable P0/P1/P2 mismatch remains.
- P3：列表末行仍可能因滚动位置呈现部分卡面，这是可滚动卡牌库的正常位置提示，不影响查看或拖拽。

final result: passed
