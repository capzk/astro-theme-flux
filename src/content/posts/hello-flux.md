---
title: 你好，Flux
date: 2026-10-20 10:00:00
description: 把 Material Design 风格的 Hexo 主题 Fluid 迁到 Astro —— 卡片式布局、全屏 banner、跟随滚动的目录、深浅色主题，一个都没少。
tags:
  - Astro
  - 主题
  - 迁移
categories:
  - 公告
indexImg: /img/cover-1.svg
sticky: true
---

这是 **Flux** 的第一篇文章。它的作用是：一边验证主题的各项能力（目录、代码块、卡片、深浅色），一边把话说清楚——**哪些东西从原版搬过来了，哪些没有。**

## 为什么迁移

[hexo-theme-fluid](https://github.com/fluid-dev/hexo-theme-fluid) 是 Hexo 生态里最受欢迎的 Material Design 主题之一。它的观感很难被简单复制：

- 首页全屏 banner，站名大字压在图上，底部一个向下的小箭头
- 内容装在一张**浮在背景之上**的大白卡片里，阴影很深，圆角很小
- 卡片流左图右文，摘要固定三行，meta 用小号灰字
- 文章页正文居中收窄，右侧是跟随滚动的目录

这些细节合起来，就是 Fluid 的辨识度来源。迁移时我按**观感优先**处理：先还原这些，再谈技术。

## 换掉了什么技术

原版跑在 Hexo 上，靠 EJS 模板 + Stylus + 一堆前端插件。Astro 这边全部换掉：

| 原版 | 这里 | 收益 |
| --- | --- | --- |
| EJS 模板 | Astro 组件 | 类型检查、按需水合 |
| Stylus | 手写 CSS + CSS 变量 | 构建零依赖，改色只改变量 |
| Bootstrap 栅格（CDN） | 自己写 flex/grid | 少一个外部请求、少 200KB |
| iconfont（CDN） | 内联 SVG | 零请求，随 `currentColor` |
| jQuery + tocbot | 原生 IntersectionObserver | 依赖归零 |
| highlight.js | 构建期 Shiki | 双主题、无运行时高亮 |
| hexo-generator-searchdb | `/searchindex.json` | 索引也是一次静态构建 |

> 代码高亮、目录高亮、站内搜索这几项，原版都依赖运行时脚本去「事后加工」DOM。Astro 的思路相反：**能构建期算完的就不留给浏览器。**

## 保留了哪些

首页卡片流、文章页版式、归档时间线、分类与标签、友链、关于、站内搜索、目录跟随、代码块工具栏、返回顶部、移动端菜单。

## 去掉了哪些

评论（十几种第三方服务）、浏览量统计、文章加密、数学公式与流程图、打字机副标题、图片缩放插件、九套语言包。它们要么是外部服务依赖，要么需要额外的运行时库——与「静态、零依赖」的目标冲突。

### 关于取舍的原则

一句话：**读者打开一篇文章时，从点击到读完的这条路径要完整；这条路径之外的东西可以砍。**
