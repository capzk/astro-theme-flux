---
title: 站点配置详解：src/config 的每个字段
date: 2026-10-22 09:00:00
description: 站名、菜单、banner、卡片、目录、版权、深色模式、配色 —— 分成「类型 / 默认值 / 你的值」三层，改哪一层一目了然。
tags:
  - 配置
  - config
  - TypeScript
categories:
  - 指南
cover: ../../assets/covers/cover-2.webp
---

主题的配置只有一个入口：**`src/config`**。它导出一个 `SITE` 常量，页面组件只读它，不读别的地方。

但「一个入口」不等于「一个文件」。目录里是这样分工的：

| 文件 | 是什么 | 你会改吗 |
| --- | --- | --- |
| `user/*.ts` | 你的配置，只写和默认值不同的部分 | ✓ 就改这里 |
| `defaults.ts` | 出厂默认值，每一项都有注释 | 读，别改 |
| `types.ts` | 字段类型与详细说明 | 查字段含义 |
| `merge.ts` | 深合并规则，三十行 | 想知道合并细节时看 |
| `index.ts` | 合并 + 体检 + 导出 `SITE` | 不用动 |

这么分是为了**升级主题时不动你的配置**：`user/` 是独立目录，升级只替换其余几个文件，你的站名、导航、配色原样留着。

<div class="note note-info">
字段含义写在 <code>types.ts</code> 的注释里 —— 编辑器里把鼠标悬停在字段上就能看到，和这篇文档同一个来源。
写错字段名会在 <code>npm run check</code> 阶段报错；<code>astro build</code> 不检查类型，别指望它替你发现。
</div>

三条合并规则，记住就不会踩坑：

- **对象逐层合并** —— 同一块配置可以分在两个文件里写
- **数组整体替换** —— 导航、友链写几项就是几项
- **不写就是默认** —— 删掉一行等于恢复出厂设置

## 全景

```ts
// src/config/index.ts 合并出来的最终形状（每一段都标了它该写在哪）
export const SITE = {
  // user/site.ts
  title, subtitle, description, author, lang, avatar, ogImage, since, beian,
  nav: [...],

  // user/appearance.ts
  banner:     { enable, title, img, height, pageHeight, maskAlpha, slogan, typing, parallax, minRatio, scrollDown },
  postBanner: { img, height, maskAlpha },
  darkMode:   { enable, default },
  color:      { navbar, bodyBg, board, accent, navbarScrim },

  // user/content.ts
  index:  { defaultImg, excerptLength, showDate, showCategory, showTags },
  post:   { meta: {...}, toc, copyright, prevNext, related, wpm },
  pageSize, archive: { pageSize }, search,
  rss:    { excerptLength },
};
```

下面按段拆。

## 站点信息

```ts
title: 'Flux',
subtitle: '一个 Material Design 风格的 Astro 博客主题',
description: '丝滑的阅读体验：卡片式首页、全屏 banner、暗色模式、跟随滚动的目录。',
author: 'capzk',
lang: 'zh-CN',
avatar: '/img/avatar.svg',
since: 2026,
beian: '',
```

| 字段 | 落在哪 | 备注 |
| --- | --- | --- |
| `title` | `<title>`、顶栏、页脚 | 也是文章页标题的后缀：`文章名 - 站名` |
| `subtitle` | 首页 `<title>` 的后半段 | 首页标题是 `站名 - 副标题` |
| `description` | `<meta name="description">`、OG、RSS | 单篇有 `description` 时以单篇为准 |
| `author` | 文章 banner 元信息、版权声明、关于页 | |
| `lang` | `<html lang>`、RSS 的 `<language>` | BCP 47，如 `zh-CN` / `en` |
| `avatar` | 关于页头像 | 放 `public/` 下用根路径，也可写完整 URL |
| `since` | 页脚版权年份起点 | 不写则只显示当前年 |
| `beian` | 页脚最下面一行 | 空字符串则不渲染，备案号放这里 |

## 导航菜单

```ts
nav: [
  { label: '首页', href: '/', icon: 'home' },
  { label: '归档', href: '/archives/', icon: 'archive' },
  { label: '关于', href: '/about/', icon: 'user' },
  { label: '旧站', href: 'https://old.example.com', icon: 'link', external: true },
],
```

- `href` 结尾**要带斜杠**（`/archives/` 而不是 `/archives`）。站点配置了 `trailingSlash: 'always'`，不带斜杠会多一次跳转。
- `icon` 取值见 `src/components/Icon.astro` 里的图标表，写不存在的名字不报错，只是不显示。
- `external: true` 会给链接加 `target="_blank"` 与 `rel="noopener"`。
- 想跟随界面语言切换文案，用 `labelKey` 代替 `label`，值取自 `src/i18n.ts` 的键名（如 `labelKey: 'archive'`）。

## 首页 banner

首页第一屏。左边是配置，右边是它能做的所有事：

```ts
banner: {
  enable: true,             // 首页要不要这一块；false 则直接从卡片流开始
  title: 'Hi，我是 capz',    // 大标题。不写就用站名；写 '' 则整块不渲染
  img: '/img/banner.webp',  // 背景图。不写 / 写 '' 就是纯色底
  height: '100vh',          // 任意 CSS 长度：60vh / 400px / 32rem
  pageHeight: '50vh',       // 第 2 页起的列表页高度（不写就跟 height 一样）
  maskAlpha: 0.3,           // 0~1，黑色蒙版，越大字越清楚；0 = 不压暗，保持原图亮度
  slogan: [                 // 副标题。给数组 = 多句轮播，给字符串 = 一句
    '丝滑的阅读体验',
    '零依赖 · 卡片式布局 · 暗色模式',
  ],
  typing: {                 // 打字机。不写这一行就是静态文字
    typeSpeed: 90,          // 每个字的间隔（毫秒），越大越慢
    cursor: '|',            // 光标字符，空字符串则不显示
    loop: false,            // 只有一句时要不要反复重打
    startDelay: 300,        // 开始前等待（毫秒）
  },
  parallax: true,           // 视差：往下滚时背景图走得比文字慢
  minRatio: 1,              // 最小宽高比，见下面「手机上」
  scrollDown: true,         // 底部那个上下浮动的向下箭头
},
```

**整块要不要**由 `enable` 决定：设 `false` 后首页和第 2 页起都直接从卡片流开始，顶栏照旧。想做成纯列表风格的博客，改这一个开关就行，不用动页面代码。

**图片**四种写法，差别只在**要不要 Astro 帮你压图**：

| 写法 | 效果 |
| --- | --- |
| `import x from '../../assets/banner.webp'` | 生成 720 / 1080 / 1440 / 1920 四档 webp，浏览器按屏宽挑一张，首屏图还带 `fetchpriority="high"` |
| `'/img/banner.webp'` | public/ 里的文件原样输出；构建时会自动补一条 `<link rel="preload">` 抢 LCP |
| `'https://…/a.jpg'` | 外链，原样用。别处挂了图就没了 |
| 不写 / `''` | 不要图，banner 退化成纯色底（顶栏色），标题和副标题照常显示 |

一句话选：**图放 `public/img/` 就写 `/img/xxx.webp`**，最省事；在意首屏体积再换成 `import`。

`/` 开头的路径写错（文件名大小写、扩展名、图还在 `src/assets` 没搬过来）不会让构建失败，只会静悄悄地少一块 —— 所以构建时会体检一遍，直接告诉你哪个文件找不到：

```
[Flux] 配置检查发现 1 处需要注意的地方：
  1. banner.img 写的是 "/img/banner-9.webp"，但 public/ 下找不到这个文件 —— 那一块会是空白或纯色。
```

`maskAlpha` 是**文字可读性**的唯一旋钮 —— 背景图越花，这个值越要大。设成 `0` 就完全不压暗，
图片保持原始亮度；此时不再输出蒙版那一层。没有图时它相当于把纯色底压暗一点。

**标题**不写就用站名。这两件事经常想分开：站名要出现在标题栏、搜索结果和 RSS 里，而首页第一屏往往想写点别的。设成空字符串 `''` 则标题整块不渲染。

**副标题**给字符串就是一句，给数组就是候选句：

| 配法 | 效果 |
| --- | --- |
| `slogan: '一句话'` + 不开打字机 | 静态显示这一句 |
| `slogan: ['A', 'B']` + 不开打字机 | 只显示第一句 A（确定性输出，不影响缓存和 diff） |
| `slogan: ['A', 'B']` + 打字机 | 打完 A、删掉、打 B，无限轮播 |
| 不配 | 回落到站点配置的 `subtitle` |

**打字机**默认关着（不写 `typing` 就行）。开启后浏览器里逐字打出；读者系统里开了「减少动态效果」时不动画，直接显示第一句 —— 这是无障碍要求，不是可选项。

**视差**默认开：往下滚时背景图以四分之一的速度移动，文字正常滚走。实现上只 `transform` 背景层（`.banner-bg`），不动文字，所以标题不会跟着飘。它和打字机一样尊重「减少动态效果」。

**手机上**：竖屏时 `100vh` 比宽度大得多，横图会被裁掉左右两边。`minRatio` 把 banner 高度限制在「宽度 ÷ minRatio」以内 —— `1` 表示最高不超过宽度，`0` 表示不限制（一屏铺满，但裁得狠）。只有手机竖屏会触发，桌面端这个值远大于 `100vh`，等于不生效。

滚动提示箭头由 `scrollDown` 单独控制，首页高度不是 `100vh` 时建议关掉，不然箭头会压在内容上。

## 文章页 banner

```ts
postBanner: {
  img: '/img/banner.webp',  // 同上四种写法；不写就是纯色底
  height: '60vh',
  maskAlpha: 0.35,
},
```

文章页 banner 比首页矮一档，蒙版更深一点 —— 因为上面要压两行元信息（作者/日期、字数/阅读时长），字多了更需要对比度。

这里**没有 `enable` 开关**：标题和元信息都住在 banner 上，关掉就得给它们另找地方，那是改版不是配置。不想要图，把 `img` 去掉即可。

单篇文章可以用 front matter 的 `banner`（相对本文档的图片，会优化）或 `bannerImg`（根路径字符串）覆盖，`bannerMaskAlpha` 同理。

## 首页卡片

```ts
import coverDefault from './assets/covers/cover-default.webp';

index: {
  defaultImg: coverDefault,
  excerptLength: 200,
  showDate: true,
  showCategory: true,
  showTags: true,
},
```

| 字段 | 作用 |
| --- | --- |
| `defaultImg` | 文章没写 `cover` / `indexImg` 时用的封面；两种写法都行，留空则卡片不显示图片区，变成纯文字块 |
| `excerptLength` | 摘要截断字数。优先用 front matter 的 `description`，没有才截正文 |
| `showDate` / `showCategory` / `showTags` | 卡片底部那一行小字的三个开关 |

<div class="note note-warning">摘要长度只影响列表，不影响 SEO —— <code>&lt;meta name="description"&gt;</code> 始终用完整的 <code>description</code>。</div>

## 文章页组件

```ts
post: {
  meta: { author: true, date: true, wordcount: true, min2read: true },
  toc: true,
  copyright: true,
  prevNext: true,
  related: true,
  wpm: 300,
},
```

- `meta` 的四项都渲染在 **banner 上**：作者和日期一行，字数和阅读时长一行。全关掉就是纯标题。
- `toc` 是右侧目录的总开关。单篇可用 front matter 的 `toc: false` 单独关掉。
- `copyright` 控制文末那张灰底版权卡片。
- `prevNext` 控制文末的上一篇 / 下一篇。
- `related` 控制文末的「相关文章」：标签命中 3 分、分类命中 2 分，取前 3 篇；一篇得分为 0 时**整块不显示**，不拿「同一个博客」凑数。
- `wpm` 是阅读速度（字/分钟）。字数统计里中文按字算、英文按词算，所以 300 对中英混排比较准。

## 深色模式

```ts
darkMode: {
  enable: true,
  default: 'auto',   // 'auto' 跟随系统 | 'light' | 'dark'
},
```

优先级是 **用户手动选择（localStorage）> 这里设的默认值 > 系统偏好**。

用户点过顶栏那个月亮按钮之后，就再也不看这里的默认值了 —— 想让他重新跟随系统，得清 `localStorage` 里的 `flux-color-scheme`。

`enable: false` 会把默认值按 `light` 处理，但**不会隐藏切换按钮**。想彻底去掉按钮，还得删 `Navbar.astro` 里那个 `#theme-toggle`。

## 配色

```ts
color: {
  navbar: '#2f4154',
  bodyBg: '#eee',
  board: '#ffffff',
  accent: '#30a9de',
  navbarScrim: 0.35,
},
```

这四项会被写进页面的内联样式，覆盖 CSS 变量：

| 配置项 | CSS 变量 | 影响 |
| --- | --- | --- |
| `navbar` | `--navbar-bg-color` | 顶栏底色（首页透明时看不出来，滚动后才显色） |
| `bodyBg` | `--body-bg-color` | 页面底色，也就是卡片外的那圈背景 |
| `board` | `--board-bg-color` | 白卡片底色、页脚底色、回到顶部按钮底色 |
| `accent` | `--link-hover-color` | 链接悬停、标题里的强调、返回顶部悬停 |
| `navbarScrim` | `--navbar-scrim` | 顶栏透明时顶部那层渐变压暗的深度（0~1，见下） |

<div class="note note-warning">前四项<strong>只作用于亮色模式</strong>。暗色那套变量写在 <code>main.css</code> 的 <code>[data-user-color-scheme="dark"]</code> 里，如果这里无条件覆盖会连暗色一起盖掉。想连暗色一起定制，直接改 CSS 变量，见《换成你自己的样子》。<code>navbarScrim</code> 是例外 —— 它压的是照片，不分亮暗。</div>

### 顶栏压在图上时怎么保证看得清

首页刚打开、还没滚动时，顶栏是透明的，导航文字直接躺在 banner 图上。**这件事不能指望「白色字恰好压得住」**，因为图可以换成任何一张：浅色天空上白字发虚，深色夜景里深色图又吃掉一半对比度。

做法是给顶栏加一层**自上而下的渐变压暗**（scrim），而不是给整条加实色底：

- 用渐变而不是实色，是因为实色会在图片中间切出一条硬边，一眼就看出是「贴了根条」；渐变从顶栏顶部开始、几十像素内收干净，看起来像照片自带的暗角。
- 深色顶栏和透明顶栏之间是**叠化**的：滚动时实色淡入、压暗层淡出，两者交叉过渡，不会先变灰再变深跳一下。
- 透明态下，导航的悬停和选中**不再用 `accent` 蓝**，改成「白色字 + 半透明白底」。蓝色压在浅色照片上等于隐形，而白底在深色图、浅色图上都成立；滚动之后自动回到 `accent`。

`navbarScrim` 就是压暗的深度：

| 值 | 效果 |
| --- | --- |
| `0` | 完全不压暗，图片原样（文字仍带一层极浅投影兜底） |
| `0.35` | 默认值，浅色图也够用 |
| `0.6` 以上 | 图特别花时才需要，代价是顶部明显发暗 |

它只影响**顶栏那一条**的顶部，和 banner 自己的 `maskAlpha` 是两回事 —— 后者压的是整张图。

## 分页与搜索

```ts
pageSize: 6,                  // 首页 / 分类 / 标签，每页文章数
archive: { pageSize: 10 },    // 归档页每页条数（时间线一行一篇，比卡片密，所以单独取值）
search: true,                 // 关掉则不渲染搜索弹窗，也不生成 /searchindex.json
```

分页的 URL 形态统一：第 1 页是列表首页，第 N 页是 `<base>/page/N/`。所以归档是 `/archives/` → `/archives/page/2/`，分类是 `/categories/指南/` → `/categories/指南/page/2/`。`archive.pageSize` 写 0 或负数表示归档不分页。

`search: false` 之后，按 `/` 和 `Ctrl/⌘ + K` 不会有任何反应 —— 快捷键监听在搜索脚本里，整段都不会被打包。

## 一个完整的改法示例

把站点改成自己的，通常是这样一套改动：

```ts
export const SITE: SiteConfig = {
  title: '半山吧',
  subtitle: '写代码，也写别的',
  description: '一个关于工程、阅读和长期主义的地方。',
  author: 'capzk',
  lang: 'zh-CN',
  avatar: '/img/me.jpg',
  since: 2024,
  beian: '京ICP备00000000号',

  nav: [
    { label: '首页', href: '/', icon: 'home' },
    { label: '归档', href: '/archives/', icon: 'archive' },
    { label: '分类', href: '/categories/', icon: 'category' },
    { label: '标签', href: '/tags/', icon: 'tag' },
    { label: '关于', href: '/about/', icon: 'user' },
  ],

  banner: { enable: true, title: '半山腰上', img: '/img/banner.jpg', height: '80vh', pageHeight: '40vh', maskAlpha: 0.4, slogan: '写点别的', scrollDown: true },
  postBanner: { img: '/img/banner.jpg', height: '50vh', maskAlpha: 0.45 },

  index: { defaultImg: '/img/cover-default.svg', excerptLength: 160, showDate: true, showCategory: true, showTags: false },
  post: { meta: { author: false, date: true, wordcount: true, min2read: true }, toc: true, copyright: false, prevNext: true, wpm: 300 },

  darkMode: { enable: true, default: 'auto' },
  color: { navbar: '#2f4154', bodyBg: '#f2f2f2', board: '#ffffff', accent: '#c0392b', navbarScrim: 0.35 },

  pageSize: 8,
  search: true,
};
```

改完 `npm run dev` 会自动重载。上线前记得另外把 `astro.config.mjs` 里的 `site` 换成真实域名。
