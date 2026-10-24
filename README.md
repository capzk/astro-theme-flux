# Flux · 流变

[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](./LICENSE)
[![Astro](https://img.shields.io/badge/Astro-7.x-BC52EE.svg?logo=astro&logoColor=white)](https://astro.build)
[![Node](https://img.shields.io/badge/node-%E2%89%A522.23.4-339933.svg?logo=node.js&logoColor=white)](./package.json)

> A Material Design blog theme for **Astro** — card grid, full-screen banner, dark mode, local search, sticky TOC.

**Flux（流变）** 是一套 Material Design 风格的 Astro 博客主题。名字取自拉丁语 *fluxus*（流动），设计概念与视觉语言迁移自 [hexo-theme-fluid](https://github.com/fluid-dev/hexo-theme-fluid)：卡片与阴影、全屏 banner、大留白的阅读区、跟随滚动的目录、深浅色主题 —— 观感对齐原版，而运行时依赖归零。

不引 Bootstrap、iconfont、jQuery、tocbot、clipboard.js、highlight.js、fancybox、nprogress。目录高亮用原生 `IntersectionObserver`，图标是内联 SVG，代码高亮在构建期由 Shiki 完成。

## 特性

**布局与观感**

- 首页：全屏 banner（背景图 + 黑色蒙版 + 站名大字 + 滚动箭头），下方浮起一张白卡片
- 卡片流：左图右文，封面带投影，摘要固定三行，meta 一行小字（日期 / 分类 / 标签）
- 文章页：banner + 白卡片，正文收窄居中，右侧 240px 目录跟随滚动
- 顶栏：首页透明，滚动后变实色 + 阴影；移动端抽屉菜单

**功能**

| 功能 | 实现 |
| --- | --- |
| 深色模式 | 3 行内联脚本 + 一套 CSS 变量，首帧不闪白；优先级 `localStorage > 站点默认 > 系统` |
| 目录跟随高亮 | `IntersectionObserver`（原版是 tocbot + jQuery） |
| 站内搜索 | 构建期生成 `/searchindex.json`，前端分档打分；`/` 或 `Ctrl/⌘+K` 唤起 |
| 代码块 | Shiki 双主题（亮 `github-light` / 暗 `github-dark`）+ 语言标签 + 复制按钮 |
| 归档 / 分类 / 标签 / 友链 / 关于 / 404 | 全部静态生成 |
| 分页 | `/page/2/`，与 Hexo 的 `page/2/` 一致 |
| 返回顶部、标题锚点、外链新窗口 | 零依赖脚本 / Markdown 插件 |
| RSS 与 sitemap | `@astrojs/rss` + `@astrojs/sitemap` |

## 开始使用

```bash
git clone https://github.com/capzk/astro-theme-flux.git my-blog
cd my-blog
npm install
npm run dev      # http://localhost:4321
npm run build    # 产物在 dist/
```

要求 **Node ≥ 22.23.4**（Astro 7 的要求）。

也可以用 GitHub 的 **Use this template** 直接开一个新仓库，或 `npx degit capzk/astro-theme-flux my-blog` 拉一份不含 git 历史的副本。

## 配置

几乎全部在 **`src/config.ts`** 一个文件里：站名、副标题、头像、菜单、banner（图 / 高度 / 蒙版 / 标语）、文章页 banner、首页卡片（默认封面 / 摘要长度 / meta 开关）、文章 meta（作者 / 日期 / 字数 / 阅读时长）、目录、文末版权、上下篇、深色模式默认值、配色（顶栏 / 页面底 / 卡片底 / 强调色）、每页条数、搜索开关。

上线前记得改 **`astro.config.mjs`** 的 `site`，它决定 RSS 与 sitemap 里的绝对地址。

配色除了可以在 `config.ts` 覆盖，也可以直接改 `src/styles/main.css` 顶部的 CSS 变量 —— 亮色一套、暗色一套，改色不用碰任何组件。

## 写文章

放进 `src/content/posts/`，front matter 与 Hexo 基本同名：

```yaml
---
title: 文章标题
date: 2026-10-20 10:00:00
description: 摘要（列表与 SEO 用）
tags: [Astro, 主题]
categories: [公告]
indexImg: /img/cover-1.svg   # 卡片封面（原版叫 index_img）
sticky: true                 # 置顶
toc: true                    # 右侧目录
---
```

字段由 Zod 校验，写错会在构建期报错，并指出是哪一篇。`draft: true` 的文章不会进入列表、搜索索引与 RSS。

## 从 Hexo / Fluid 迁移

| Hexo | Flux |
| --- | --- |
| `source/_posts/*.md` | `src/content/posts/*.md` |
| `_config.yml` | `src/config.ts` |
| `_data/links.yml` | `src/data/links.ts` |
| `layout/*.ejs` | `src/pages/*.astro` + `src/components/*.astro` |
| `languages/*.yml` | `src/i18n.ts` |
| `hexo-generator-searchdb` | `src/pages/searchindex.json.ts` |

URL 形态保持一致（`/posts/<文件名>/`、`/tags/<名称>/`、`/page/2/`），旧链接不会 404。

## 取舍：原版有哪些，这里为什么没有

| 原版功能 | Flux | 原因 |
| --- | --- | --- |
| 评论（13 种第三方服务）、浏览量统计 | ✕ | 外部服务依赖，与「静态、零依赖」冲突 |
| 文章加密、数学公式、Mermaid | ✕ | 各需一个运行时库，属于插件而非主题核心 |
| 打字机副标题、视差 banner、fancybox 图片缩放 | ✕ | 锦上添花，需要额外 JS；banner 保留静态版 |
| Bootstrap 栅格（CDN） | 自己写 flex/grid | 只用到栅格，为它引 200KB 不划算 |
| iconfont（CDN） | 内联 SVG | 零请求、随 `currentColor` |
| Stylus | 手写 CSS | 改色只动 CSS 变量，构建不依赖预处理器 |
| 9 套语言包 | 中文一份（`src/i18n.ts`） | 结构已就位，加语言只需扩一个对象 |

原则一句话：**读者从点开一篇文章到读完，这条路径要完整；路径之外的东西可以砍。**

## 目录结构

```
src/
├── config.ts            # ★ 站点配置
├── i18n.ts              # 界面文案
├── content.config.ts    # 集合与 front matter 校验
├── content/posts/       # 文章
├── data/links.ts        # 友链
├── layouts/BaseLayout.astro
├── components/          # Navbar / Banner / Board / PostCard / PostList /
│                        # Toc / Pagination / SearchModal / Icon / Footer
├── pages/               # 文件即路由
├── plugins/markdown.js  # 标题锚点 / 代码块工具栏 / 外链
├── scripts/theme.js     # 顶栏、深色模式、目录高亮、复制、回顶
├── scripts/search.js    # 站内搜索
└── styles/main.css      # 全部样式（变量分亮暗两套）
```

## 已知限制

- 封面与 banner 用普通 `<img>` / CSS 背景，不走 `astro:assets` 优化（示例图是 SVG）。想让 Astro 自动转 webp + srcset，把 `content.config.ts` 里的 `indexImg` 改成 `image()` 并用相对路径。
- 目录只取 h2 / h3，与原版默认深度一致。
- 搜索是线性扫描 + 分档权重，没有分词。文章量上千后建议换 [Pagefind](https://pagefind.app/)。
- 界面文案目前只有中文，`src/i18n.ts` 已按字典组织，加语言只需扩一个对象。

## 致谢

设计概念与视觉语言来自 [hexo-theme-fluid](https://github.com/fluid-dev/hexo-theme-fluid)，感谢 Fluid-dev 与所有贡献者。Flux 只重写了实现，没有重新发明观感。

## License

**GPL-3.0-only**，协议全文见 [LICENSE](./LICENSE)。

```
Copyright (C) 2026 capzk <https://github.com/capzk>

Design concepts and visual language originate from hexo-theme-fluid
https://github.com/fluid-dev/hexo-theme-fluid
Copyright (C) Fluid-dev and contributors, licensed under GPL-3.0.
```

Flux 是 hexo-theme-fluid（GPL-3.0）的派生作品，因此沿用同一协议：分发修改后的版本时须同样以 GPL-3.0 开源，并保留上游署名。用 Flux 搭自己的博客不受影响 —— 你产出的站点内容归你。
