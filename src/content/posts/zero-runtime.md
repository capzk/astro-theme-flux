---
title: 零运行时：这个主题为什么不引第三方依赖
date: 2026-10-26 21:00:00
description: jQuery、Bootstrap、tocbot、highlight.js 统统没有 —— 需要什么就写几十行。换来的是三年后你还敢动它。
tags:
  - 性能
  - JavaScript
  - 无依赖
categories:
  - 实现
cover: ../../assets/covers/cover-2.webp
---

装一个主题，最容易被忽略的成本是**它带进来的依赖**。

## 一张依赖清单

很多博客主题的 `package.json` 会挂着这些东西：jQuery、Bootstrap（或它的一部分）、tocbot、clipboard.js、nprogress、fancybox、highlight.js，再加 CDN 上的图标字体。每一个单看都不大，凑一起就是首屏要多下载几百 KB、多解析几个库。

Flux 的选择是：**运行时依赖为 0**。

## 那这些功能怎么办

不是不做，是换个做法：

| 功能 | 常见做法 | Flux 的做法 |
| --- | --- | --- |
| 滚动目录跟随 | tocbot | 一段 `IntersectionObserver` |
| 代码高亮 | highlight.js / Prism | Astro 内置的 Shiki，**构建期**就高亮好 |
| 深色模式 | 一堆库 | 内联几行脚本 + CSS 变量 |
| 站内搜索 | 一堆库 + 后端 | 构建期生成索引，前端纯过滤 |
| 图片灯箱 | fancybox | 自己写几十行 |
| 平滑滚动 | 插件 | 一行 CSS `scroll-behavior` |

代码高亮特别值得说：交给 Shiki 在**构建时**做，产出的就是带颜色标记的 HTML，浏览器一个高亮库都不用加载 —— 首屏省下的正是最贵的那部分。

## 唯一的例外：评论

评论是个例外，但处理得很克制：Waline 客户端**默认关闭**、滚到评论区附近才动态 `import`，不进主依赖树、也不进首屏产物。想完全没有第三方脚本，把 `comment.enable` 关掉即可。

## 为什么值得

依赖的成本不在「今天能不能跑」，而在「三年后还敢不敢升级」。一个锁在旧版本、层层依赖的主题，往往最后没人敢动。这部分我写在[《主题里那些看不见的成本》](/posts/invisible-cost/)里了。

零依赖不意味着功能少，意味着**每一块都能单独看、单独改、单独删**。需要什么，就写几十行；出了问题，也只需要看那几十行。
