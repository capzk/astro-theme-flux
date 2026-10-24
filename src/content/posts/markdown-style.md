---
title: Markdown 排版细节
date: 2026-10-16 20:30:00
description: 标题、列表、引用、表格、代码块、图片——把常用元素铺开，检验这篇主题的排版质量。
tags:
  - Markdown
  - 排版
categories:
  - 使用
indexImg: /img/cover-3.svg
---

主题好不好用，看**正文**就够了。这一页把常用元素全部铺开，方便检查每一处的间距与层次。

## 段落与行内元素

正文的字号是 16px，行高 1.8，字间距 `0.02em` —— 中文长文需要比英文更松的行高，这是原版就调好的值。

行内可以有**加粗**、*斜体*、~~删除线~~、`行内代码`，以及[一个链接](https://astro.build/)。链接用下划线标出，悬停变主题蓝。

## 列表

无序列表：

- 卡片阴影用了两层：近处一层大扩散，远处一层小扩散
- 圆角只有 0.5rem，Material 的克制
- 目录宽度固定 240px，不抢正文的注意力

有序列表（带你走一遍构建）：

1. `npm install`
2. `npm run dev`
3. 改 `src/config.ts` 里的站名与菜单
4. `npm run build`

## 引用

> 引用块的左边有一道主题蓝的竖线，背景比正文淡一档。
> 它适合放「需要被记住的一句话」，不适合放长段落。

## 代码块

带语言标签与复制按钮，悬停代码块时按钮才显形：

```js
// 目录跟随滚动：取「已进入视口且最靠上」的标题
const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (visible.length) setActive(map.get(visible[0].target));
  },
  { rootMargin: '-80px 0px -60% 0px' },
);
```

也可以用 Shell：

```bash
npm run build
# 34 pages built in 4.29s
```

## 表格

| 元素 | 亮色 | 暗色 |
| --- | --- | --- |
| 页面底色 | `#eee` | `#181c27` |
| 卡片底色 | `#fff` | `#252d38` |
| 正文色 | `#2c3e50` | `#c4c6c9` |
| 强调色 | `#30a9de` | `#30a9de` |

## 分隔线与图片

---

![封面示意图](/img/cover-2.svg)

## 小结

排版这件事没有惊喜才叫成功：读者应该感觉不到字体、行高、间距的存在，只感觉「读起来舒服」。
