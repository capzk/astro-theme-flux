---
title: 换成你自己的样子：配色与排版
date: 2026-10-23 10:00:00
description: 三种改法分别管什么 —— 站点配置换颜色、CSS 变量换整套配色、选择器改版心与字号。附全部设计令牌清单。
tags:
  - CSS
  - 配色
  - 定制
categories:
  - 指南
cover: ../../assets/covers/cover-4.webp
---

Flux 的样式全在一个文件里：`src/styles/main.css`。没有 Stylus / Sass，所以也没有编译步骤和变量作用域的问题 —— 改完存盘，刷新就能看到。

改样式前先想清楚改的是哪一层，不然会出现「改了一处，暗色模式崩了」这种事。

## 三层，从上到下

| 层 | 位置 | 管什么 | 影响范围 |
| --- | --- | --- | --- |
| 一 | `src/config/user/appearance.ts` 的 `color` | 四个主色 | 只亮色 |
| 二 | `main.css` 的 CSS 变量 | 全部颜色与字体 | 亮暗两套 |
| 三 | `main.css` 的选择器 | 版心、字号、行高、间距 | 具体某个组件 |

原则：**能在上层改就别动下层。** 上层是「配置」，下层是「实现」。

## 第一层：四个主色

```ts
color: {
  navbar: '#2f4154',
  bodyBg: '#eee',
  board: '#ffffff',
  accent: '#30a9de',
},
```

顶栏、页面底、卡片底、强调色。改这四项能覆盖 90% 的「换个感觉」需求，而且不用碰 CSS。

`accent` 是唯一值得挑一下的：它同时是链接悬停色、引用块左边线、目录当前项的颜色。挑一个饱和度中等的，太亮会在深色卡片上刺眼。

<div class="note note-warning">这四个值只作用于亮色模式。暗色那套写在 <code>main.css</code> 的 <code>[data-user-color-scheme="dark"]</code> 里，两套是独立的 —— 想连暗色一起换，见下一层。</div>

## 第二层：设计令牌

`main.css` 开头是一个 `:root` 块，里面全是 CSS 变量。这是整套视觉的「调色板」：

| 变量 | 亮色 | 暗色 | 用途 |
| --- | --- | --- | --- |
| `--body-bg-color` | `#eee` | `#181c27` | 页面底色 |
| `--board-bg-color` | `#ffffff` | `#252d38` | 卡片、页脚、回顶按钮 |
| `--text-color` | `#3c4858` | `#c4c6c9` | 通用文字 |
| `--sec-text-color` | `#718096` | `#a7a9ad` | 次要文字（日期、meta） |
| `--post-text-color` | `#2c3e50` | `#c4c6c9` | 正文 |
| `--post-heading-color` | `#1a202c` | `#c4c6c9` | 正文标题 |
| `--link-hover-color` | `#30a9de` | `#30a9de` | 强调色 |
| `--link-hover-bg-color` | `#ebedef` | `#364151` | 链接悬停底色 |
| `--line-color` | `#eaecef` | `#435266` | 分割线、表格边框 |
| `--navbar-bg-color` | `#2f4154` | `#1f3144` | 顶栏 |
| `--navbar-text-color` | `#ffffff` | `#d0d0d0` | 顶栏文字 |
| `--highlight-bg-color` | `#f6f8fa` | `#2d333b` | 代码块底 |
| `--inlinecode-bg-color` | `rgba(175,184,193,.2)` | `rgba(99,110,123,.4)` | 行内代码底 |
| `--button-bg-color` | `#f6f8fa` | `#2f4154` | 按钮、工具栏底 |

还有几个不涉及颜色的：

```css
--font-family-sans-serif: system-ui, -apple-system, "Segoe UI", Roboto, …;
--font-family-monospace: ui-monospace, SFMono-Regular, "SF Mono", Menlo, …;
--board-radius: 0.5rem;
--img-shadow: 0 5px 11px 0 rgba(0,0,0,.18), 0 4px 15px 0 rgba(0,0,0,.15);
--board-shadow: 0 12px 15px 0 rgba(0,0,0,.24), 0 17px 50px 0 rgba(0,0,0,.19);
--navbar-shadow: 0 2px 5px 0 rgba(0,0,0,.16), 0 2px 10px 0 rgba(0,0,0,.12);
```

暗色令牌在 `[data-user-color-scheme="dark"]` 里，**同名变量覆盖一遍**。想给暗色换个底，改那一块就行。

### 换掉字体

只改一个变量，全站生效（代码块和行内代码走 monospace，不受影响）：

```css
:root {
  --font-family-sans-serif: "Inter", system-ui, "PingFang SC", "Microsoft YaHei", sans-serif;
}
```

字体文件建议自己托管在 `public/fonts/` 下，用 `@font-face` 声明。别引 Google Fonts —— 国内访问不稳定，而且会多一次阻塞渲染的请求。

<div class="note note-info">中文站点别用只有一个字重的可变字体做正文。「思源黑体」「霞鹜文楷」这类覆盖完整、有多个字重的更稳；只给 400 和 700 两个字重是够用的。</div>

## 第三层：版心与字号

这一层是具体选择器，改之前最好知道当前值。

### 版心宽度

容器宽度照抄 Bootstrap 4 的分档，四个断点：

```css
.container { max-width: 1140px; }
@media (max-width: 1199.98px) { .container { max-width: 960px } }
@media (max-width: 991.98px)  { .container { max-width: 720px } }
@media (max-width: 767px)     { .container { max-width: 540px } }
```

想让内容更宽，把 `1140` 改大即可，其余三档建议保持等比（960 / 720 / 540 大约是它的 84% / 63% / 47%）。

文章页是三栏栅格，对应原版的 `col-lg-2 / 8 / 2`：

```css
.board-shell.has-rails {
  grid-template-columns: 2fr 8fr 2fr;
}
```

`2fr 8fr 2fr` 里中间占了 2/3。想让正文更宽，可以改成 `1fr 9fr 2fr` 或者固定像素 —— 但要同时看 `#board` 的 `max-width: 1108px`，那个才是真正的上限。

### 正文留白

正文不是靠固定像素收窄的，而是百分比内边距：

```css
.board-inner { padding: 0 10%; }   /* 与原版 .post-content 一致 */
```

宽屏时 10% 很舒展，窄屏（<768px）会降到 `2rem`，再窄降到 `1rem` —— 不然手机上正文会被挤成一条。

### 字号与行高

```css
html { font-size: 16px; letter-spacing: 0.02em; }
.markdown-body { font-size: 1rem; line-height: 1.6; }
```

- 改 `html` 的 `font-size` 等于**整体缩放**：所有 `rem` 单位跟着变，包括标题、间距、卡片尺寸。手机上已经自动降到 `15px`。
- 只改 `.markdown-body` 的 `font-size` 是**只动正文**，标题仍按自己的 `em` 层级走，层级关系不会乱。
- 行高 `1.6` 是中文长文的下限。想更松可以到 `1.75`，到 `2.0` 就开始散架了。

标题字号用的是 `em` 相对单位（`2 / 1.5 / 1.25 / 1 / .875 / .85`），所以改正文大小，标题会等比跟着变。

### banner 高度与标题

```css
.banner-title { font-size: 2rem; font-weight: 600; letter-spacing: 0.04em; }
```

高度不在 CSS 里，在 `src/config/user/appearance.ts` 的 `banner.height`（写 `100vh`、`60vh`、`400px` 都行），通过内联样式传给组件。

标题本身没有单独的移动端字号 —— 它跟着 `html` 的 `font-size` 走（手机上是 `15px`，所以 `2rem` 变成 30px）。站名超过 12 个字的话，建议直接把 `font-size` 调到 `1.75rem`，比让它换行好看。

## 改完怎么验证

```bash
npm run build
```

样式不影响构建成败，所以更实用的办法是**在浏览器里把亮暗两套都过一遍**：切到暗色，看有没有哪个元素还是白底、哪段文字对比度不够。这类问题 90% 出现在「只硬编码了颜色、没用变量」的地方。

如果你要加自己的样式，建议**追加在 `main.css` 末尾**，而不是插在中间 —— 一是避免样式表内部的顺序突然变化，二是下次从上游同步改动时冲突更少。

## 想改结构而不只是颜色

颜色和字号之上还有一层：组件。那部分见《改造与扩展》，讲清楚每个 `.astro` 组件负责哪块区域、加一个页面要动哪些文件。
