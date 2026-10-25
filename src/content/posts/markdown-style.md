---
title: Markdown 排版细节
date: 2026-10-16 20:30:00
description: 标题、列表、引用、表格、代码块、图片——把常用元素铺开，检验这篇主题的排版质量。
tags:
  - Markdown
  - 排版
categories:
  - 使用
cover: ../../assets/covers/cover-3.webp
---

主题好不好用，看**正文**就够了。这一页把常用元素全部铺开，方便检查每一处的间距与层次。

## 段落与行内元素

正文的字号是 16px，行高 1.6，字间距 `0.02em` —— 这几个值是原版调好的，直接沿用。

行内可以有**加粗**、*斜体*、~~删除线~~、`行内代码`，以及[一个链接](https://astro.build/)。链接用下划线标出，悬停变主题蓝。需要补充说明时挂个脚注[^1]。

[^1]: 脚注会排到文末，带 `[1]` 序号，点序号可以跳回原文位置。

## 列表

无序列表：

- 卡片阴影用了两层：近处一层大扩散，远处一层小扩散
- 圆角只有 0.5rem，Material 的克制
- 正文两侧各留 10%，一行四十来个字，眼睛不用来回找行首

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
// 滚动高亮：取「已进入视口且最靠上」的那一个
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

## 提示块

正文里可以插语义化的提示块，写 `<div class="note note-xxx">` 即可，颜色和左边框都由 CSS 给出：

<div class="note note-info">info：补充说明、背景信息这一类。</div>

<div class="note note-success">success：推荐做法、操作成功。</div>

<div class="note note-warning">warning：需要注意的坑，别踩。</div>

<div class="note note-danger">danger：会造成数据丢失的操作。</div>

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

## 冷门元素

删除线 ~~已经作废的说法~~ 用灰色，不抢眼；重点标记靠 HTML 的 `<mark>`：<mark>这一句要记住</mark>。上下标写作 H<sub>2</sub>O 与 E=mc<sup>2</sup>。

任务清单：

- [x] 标题层级有梯度
- [x] 列表首尾不多留白
- [ ] 表格在窄屏横向滚动

折叠块（默认收起，点标题展开）：

<details>
<summary>这里放一段补充说明</summary>

`details` 与 `summary` 用和引用块同一套配色，里面可以继续写段落、列表、代码，不影响正文节奏。

</details>

带图注的图片：

<figure>
  <img src="/img/cover-4.svg" alt="图注示例">
  <figcaption>图注用灰色小字居中，和正文拉开一层</figcaption>
</figure>

## 小结

排版这件事没有惊喜才叫成功：读者应该感觉不到字体、行高、间距的存在，只感觉「读起来舒服」。
