# 角色卡面素材

`hero-cards-v1.png` 为早期 3×2 角色立绘精灵图，保留作归档，不再被游戏页面引用。

```text
漂泊者 | 今汐 | 散华
卡卡罗 | 忌炎 | 守岸人
```

- 生成方式：Codex 内置 `image_gen`。
- 参考用途：官方教学视频截图只用于卡牌构图与氛围参考；原游戏 UI 截图用于配色参考。
- 约束：新绘制的动漫游戏立绘，无官方卡框、无文字、无 Logo、无水印。
- 现行用法：每名角色使用 `heroes/{hero-id}-v*.png` 独立立绘，CSS 以 `cover` 显示，避免精灵图裁切时露出其他角色。

当前独立角色立绘：

```text
rover-v2       jinhsi-v1       sanhua-v1       calcharo-v2
jiyan-v2       shorekeeper-v2  yangyang-v1     chixia-v1
```

- 全部为 Codex 内置 `image_gen` 分角色独立生成的同人立绘。
- 约束：竖版、无卡框、无文字、无 Logo、无水印、单角色构图；不使用官方卡图裁切。

## 行动卡插画

`actions/` 内为当前原型的 12 张独立行动卡插画，每种卡牌一张：

```text
dawn      迅刀·破晓      resonance 共鸣重击      finale 绝奏爆发
windcut   风切追击       dragon    青龙破阵      echo   声骸协奏
counter   谐振反制       dodge     精准闪避      barrier 逆流屏障
heal      潮汐疗愈       insight   战术推演      armor  回声护甲
```

- 文件名统一为 `actions/{card-key}-v1.png`。
- 生成方式：Codex 内置 `image_gen`，每张独立生成，并非从官方卡面裁切。
- 约束：竖版动漫游戏插画，无卡框、文字、Logo 和水印。
- 映射入口：`demo/game.js` 的 `actionArtPath()`；后续拿到完整正式素材时，可保持文件名直接替换。
