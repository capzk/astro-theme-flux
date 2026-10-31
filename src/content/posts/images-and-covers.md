---
title: 图片与封面：两种写法与优化管线
date: 2026-10-26 15:00:00
description: /img/x.webp 与 import 两种写法差在哪、什么时候用哪个，以及封面、banner、正文图各自怎么走优化。
tags:
  - 图片
  - 封面
  - 性能
categories:
  - 使用
cover: ../../assets/covers/cover-4.webp
---

同一个位置放一张图，主题支持两种写法，效果差别很大。

## 两种写法

```yaml
# 写法一：字符串路径（public/ 里，或完整 URL）
indexImg: /img/cover-1.webp

# 写法二：相对本文档的 import（交给 Astro 优化）
cover: ../../assets/covers/cover-1.webp
```

| | 字符串路径 | `import` / `cover:` |
| --- | --- | --- |
| 是否优化 | 否，原图多大发多大 | 是，按需出多档宽度 |
| srcset | 无 | 有，移动端下小图 |
| 宽高比 | 手写 | 自动带上，避免跳动 |
| 适合 | 外链图、SVG、临时图 | 自己的照片、截图 |

**能用 `import` 就用 `import`**：同一张图，手机只会下最小那档，桌面才拿大图，还自带宽高、不会加载时抖一下。

## 封面：indexImg 与 cover

首页卡片的封面有两个字段：

- `indexImg`：字符串，不优化。
- `cover`：`import` 进来，走优化。**填了 `cover` 就不再理 `indexImg`。**

推荐用 `cover`。对没有封面的文章，卡片会用 `index.defaultImg` 兜底，不会破图。

## banner：同上

文章页顶部的 banner 也是两种写法：`bannerImg`（字符串，不优化）和 `banner`（`import`，优化）。文章头图往往是全屏大图，走优化省下的流量最多。

## 正文里的图

正文用标准 Markdown 语法即可；主题对正文图做了懒加载与宽度约束，不会撑破版心。想让某张图也走优化，用 Astro 的 `<Image>` 组件，而不是 `![]()`。

## 分享封面要注意格式

`og:image`（分享到社交平台时那张卡）**不能是 SVG**，也不建议 webp —— 不少平台会渲染成空白。主题在构建期会把封面另裁一张 1200×630 的 JPEG 专门用于分享，你只要保证原图够清晰就行。

## 小结

- 自己的图：`import` / `cover:`，让 Astro 优化。
- 外链、SVG、临时图：字符串路径，原样输出。
- 分享封面：交给构建期，别用 SVG。
