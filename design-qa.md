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
