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
series: 从零建站
seriesOrder: 3
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

`user/` 下面也不是一个文件，是按「你什么时候会想打开它」分的：

| 文件 | 管什么 | 什么时候打开 |
| --- | --- | --- |
| `site.ts` | 站名、描述、作者、语言、头像、分享封面、X 账号、导航菜单 | 建站第一步 |
| `appearance.ts` | 首页 banner、文章页 banner、深色模式、配色 | 想换样子时 |
| `content.ts` | 首页卡片、文章页各组件开关、分页、搜索 | 调「页面上有什么」 |
| `comment.ts` | 评论三选一、懒加载、最新评论 | 配评论时，另见[评论系统](/posts/comments/) |
| `analytics.ts` | 访客统计（GA4 / Umami / Clarity）与站长验证（Search Console / Bing / 百度…） | 想知道谁在看时 |
| `footer.ts` | 页脚：版权文案、站龄、订阅入口、技术栈胶囊、ICP 备案 | 上线前后 |
| `links.ts` | 友链数组 | 加友链时 |
| `pages.ts` | 关于页 / 友链页的开关 | 不要这两个页面时 |

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
  title, subtitle, description, author, lang, avatar, twitter, ogImage, since,
  nav: [...],

  // user/appearance.ts
  banner:     { enable, title, img, height, pageHeight, maskAlpha, slogan, typing, parallax, minRatio, scrollDown },
  postBanner: { img, height, maskAlpha },
  darkMode:   { enable, default },
  color:      { navbar, bodyBg, board, accent, navbarScrim, hue },

  // user/content.ts
  index:  { defaultImg, excerptLength, showDate, showCategory, showTags },
  post:   { meta: {...}, toc, copyright, prevNext, related, wpm },
  pageSize, archive: { pageSize }, search,
  rss:    { excerptLength },

  // user/footer.ts
  footer: {
    copyright: string,                     // 支持 {since} {year} {title}
    runtime:   { enable, since },
    links:     boolean,
    poweredBy: { label, href, icon? }[],    // 技术栈胶囊，空数组 = 不显示
    beian:     { enable, text, link },
  },

  // user/comment.ts —— 单独一篇，见「评论系统」
  comment: { enable, type, lazy, recent, waline?, giscus?, artalk? },

  // user/analytics.ts
  analytics:    { enable, google: {...}, umami: {...}, clarity: {...} },
  verification: { google, bing, other: [...] },
};
```

下面按段拆。每节标题后面标了它写在哪。

## 站点信息

```ts
title: 'Flux',
subtitle: '一个 Material Design 风格的 Astro 博客主题',
description: '丝滑的阅读体验：卡片式首页、全屏 banner、暗色模式、跟随滚动的目录。',
author: 'capzk',
lang: 'zh-CN',
avatar: '/img/avatar.svg',
twitter: '',
ogImage: '/img/og.png',
since: 2026,
```

| 字段 | 落在哪 | 备注 |
| --- | --- | --- |
| `title` | `<title>`、顶栏、页脚 | 也是文章页标题的后缀：`文章名 - 站名` |
| `subtitle` | 首页 `<title>` 的后半段 | 首页标题是 `站名 - 副标题` |
| `description` | `<meta name="description">`、OG、RSS | 单篇有 `description` 时以单篇为准 |
| `author` | 文章 banner 元信息、版权声明、关于页 | 也是结构化数据里 `Person` 的名字 |
| `lang` | `<html lang>`、RSS 的 `<language>` | BCP 47，如 `zh-CN` / `en` |
| `avatar` | 关于页头像 | 放 `public/` 下用根路径，也可写完整 URL |
| `twitter` | `twitter:site` / `twitter:creator`、结构化数据的 `sameAs` | **不带 `@`**。留空则一行都不输出 |
| `ogImage` | 分享卡片的兜底封面 | 见下 |
| `since` | 页脚版权区间、站龄的兜底起点 | 不写则只显示当前年 |

### 分享封面 `ogImage`

文章被转到微信、Telegram、Slack 或者发到 Twitter 时，那张缩略图选的就是它 —— 但只在**文章自己没有位图封面**时才轮到它。

两个要求，都是踩过坑才有的：

- **必须是 PNG / JPG 这类位图，不能是 SVG。** 上面这些平台不渲染 SVG，给了就是一张空白卡片，而且不会报错。构建期会拦这一条。
- **建议 1200×630。** 这是 Open Graph 的标准比例，比例差太多会被平台居中裁掉一条边。

文章如果配了 `cover`（相对路径的 webp / png），构建时会被裁成 1200×630 的 JPEG 另出一张给社交平台 —— 因为 webp 至今仍有平台抓不动。配的是 `indexImg` 这类字符串路径就没法转换，原样用；如果是 SVG，自动回落到 `ogImage`。

`og:image:width/height` 主题**故意不写**：封面尺寸随文章而变，标错比不标更糟（平台会照着错的宽高排版）。`og:image:type` 则从扩展名推，永远推得对。

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

<div class="note note-info">封面与 banner 下面都垫着一层「主色调渐变」：图还没下载完时，那个位置显示的是它大致什么颜色，而不是一块白。颜色由 <code>src/integrations/lqip.mjs</code> 在构建时自动算好（虚拟模块 <code>virtual:flux-lqip</code>），换完图直接构建就行，没有任何需要记得跑的步骤。</div>

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

### 换一整套色相

上面那四项是「一个个调」。还有个更省事的开关：只给一个色相，顶栏和强调色由 oklch 现算。

```ts
color: {
  hue: 165,   // 0~360。不写 = 用上面那四个字面颜色
},
```

| | 亮色 | 暗色 |
| --- | --- | --- |
| 强调色 | `oklch(0.68 0.14 H)` | `oklch(0.76 0.13 H)` |
| 顶栏色 | `oklch(0.35 0.04 H)` | `oklch(0.29 0.035 H)` |

明度和彩度是定值，变的只有色相 —— 所以换到哪个色相，深浅关系都一样，不会出现「某个色相下白字糊在背景里」。这也正是它比 HSL 靠谱的地方：HSL 的「亮」和眼睛感受到的亮不是一回事，同样 L 值下黄的荧光、蓝的发黑。

常用值：**250** 蓝（约等于默认）、**165** 青绿、**35** 橙、**350** 玫红、**285** 紫。

色相在**构建期**就写进 `<html>` 的 `data-hue` 与 `--hue`，页面里没有切换配色的按钮，也没有额外脚本 —— 改一次色相就重新构建一次。这符合主题「零运行时依赖」的前提：配色是站主的决定，不该在读者浏览器里算。

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

## 分页、搜索与 RSS

```ts
pageSize: 6,                     // 首页 / 分类 / 标签，每页文章数
archive: { pageSize: 10 },       // 归档页每页条数（时间线一行一篇，比卡片密，所以单独取值）
search: true,                    // 关掉则不渲染搜索弹窗，也不生成 /searchindex.json
rss: { excerptLength: 300 },     // RSS / Atom 摘要截断字数
```

分页的 URL 形态统一：第 1 页是列表首页，第 N 页是 `<base>/page/N/`。所以归档是 `/archives/` → `/archives/page/2/`，分类是 `/categories/指南/` → `/categories/指南/page/2/`。`archive.pageSize` 写 0 或负数表示归档不分页。

`search: false` 之后，按 `/` 和 `Ctrl/⌘ + K` 不会有任何反应 —— 快捷键监听在搜索脚本里，整段都不会被打包。

`rss.excerptLength` 只管订阅源里的摘要长度，**和首页卡片的 `index.excerptLength` 无关**，两者各调各的。RSS 只输出纯文本摘要、没有全文：全文要渲染 Markdown，得用 Astro 的实验性 Container API，主题不想为这个把实验接口写进依赖面。

## 评论

```ts
comment: {
  enable: false,
  type: 'waline',   // 'waline' | 'giscus' | 'artalk'
  lazy: 600,
},
```

配置在 `user/comment.ts`。字段看着多，真正必填的只有两样：`type` 选哪一套，以及那一套的服务端地址（Giscus 是仓库 id）。三套各自怎么搭起来、配完怎么验证，单独写在[评论系统：三选一](/posts/comments/)里。

这里只提最容易踩的一条：`enable: true` 但服务端地址空着，文章页里连评论区的骨架都不出现 —— 看着像「还没人评论」，其实是没配好。

## 友链

`user/links.ts` 就是个数组，不是配置文件：

```ts
export const LINKS: LinkItem[] = [
  {
    name: 'Astro',
    url: 'https://astro.build/',
    desc: '内容优先的静态站点框架',
    avatar: '/img/links/astro.svg',
  },
];
```

| 字段 | 说明 |
| --- | --- |
| `name` | 必填，显示的名字 |
| `url` | 必填，带协议头（`https://`），别只写域名 |
| `desc` | 一句话介绍，可以不写 |
| `avatar` | 头像地址。**留空也行** —— 会用名字首字母生成一个圆形色块 |

写几项就显示几项，删空就是空页面。这个文件导出了 `LinkItem` 类型，字段名写错 `npm run check` 会报 —— 它不走 `defineConfig`（`astro.config.mjs` 要直接读它来过滤 sitemap），代价是没有字段名提示，但类型还在。

不想要友链这个页面，把 `pages.links` 设成 `false`，见下一节。

## 页面开关

关于页和友链页不是每个站都要的。与其删文件（升级主题时又会被加回来），不如关开关 ——
开关写在 `src/config/user/pages.ts`：

```ts
const PAGES = {
  about: true,
  links: false,   // 关掉友链
};
```

关掉之后三处一起变，不用手工同步：

| 位置 | 变化 |
| --- | --- |
| 顶栏 / 移动端菜单 | 那一项消失（按 href 匹配，不用动 `nav`） |
| `sitemap` | 不再列出 |
| 页面本身 | 返回 301 跳首页，带 `noindex`，不让读者撞上空白页 |

静态站没有「拒绝访问」这个动作：文件要么生成、要么不生成，而文件路由总是会生成。
所以这里用「跳首页 + noindex」表达「这个页面下线了」，而不是假装 404 —— 一个 200 状态的
404 页面，在搜索引擎眼里是软 404，比明确的跳转更糟。

归档、分类、标签没有开关，它们是博客的骨架。

<div class="note note-info">这个文件是<strong>唯一不用 <code>defineConfig</code> 的配置</strong>。<code>astro.config.mjs</code> 要直接读它来过滤 sitemap，而配置文件由 esbuild 单独打包、不认识 <code>.webp</code> 这类资源导入 —— 它必须保持零依赖（连 <code>import</code> 都只能写 <code>import type</code>），否则构建会在「加载配置」那一步就失败。代价是这里没有字段名检查，但类型仍是显式的，写错类型 <code>npm run check</code> 照样报。</div>

## 页脚

```ts
footer: {
  copyright: '',            // 留空自动「© 起始年–今年 站点标题」
  runtime: {
    enable: true,
    since: '2024-03-15',
  },
  links: true,
  poweredBy: [
    { label: 'Built with Astro', href: 'https://astro.build/', icon: 'astro' },
    { label: 'Hosted on Cloudflare', href: 'https://www.cloudflare.com/', icon: 'cloudflare' },
    { label: 'Theme Flux', href: 'https://github.com/capzk/astro-theme-flux', icon: 'flux' },
  ],
  beian: {
    enable: false,
    text: '',
    link: 'https://beian.miit.gov.cn/',
  },
},
```

页脚从上到下三行，整体居中：订阅入口 / 技术栈胶囊 / 版权与备案。可展示的文字全部来自这份配置，组件本身不写死正文。上面那条分割线是 CSS 画的（两端渐隐，不是 `border-top`），宽度跟着版心走，没有可配的东西。

### 版权

`copyright` 是第三行的主文案，支持 `{since}`、`{year}`、`{title}` 三个占位符：

```ts
copyright: '© {since} {title} · 保留所有权利',
```

**留空则自动生成**「© 起始年–今年 站点标题 · 保留所有权利」；起始年与今年相同时只显示一个年份。

### 站龄

`since` 是建站日期，写 `'2024-03-15'`。

**不写就退到 `site.since` 那一年的 1 月 1 日。** 大多数人记不清具体哪一天开始写，只记得哪一年 —— 那就别逼着填一个精确日期。

天数在浏览器里算，不是构建期定死的：静态站可能几个月不重新构建，定死的话页脚会一直挂着构建那天的数字。一个写着「已运行 3 天」却天天在更新的博客，比不显示更糟。构建期还是会算一份写进 HTML，那是给禁用 JS 的读者的兜底。

粒度到天，没有秒级跳动。秒级更新会让页脚文字宽度一直变、读起来在抖，而「运行了多少天」本来也没有秒级的信息量。

`enable: false` 整块不出现。日期写坏了（比如写成 `'2024年3月'`）就是这一项不显示，同时构建期会点名。

### 订阅入口

RSS / Atom / Sitemap 三个链接，默认开。它们是对外接口，藏着没好处；想做成极简页脚就设 `links: false`。

### 技术栈胶囊

`poweredBy` 是第二行那排圆角标签，每项 `{ label, href, icon? }`：

```ts
poweredBy: [
  { label: 'Built with Astro', href: 'https://astro.build/', icon: 'astro' },
  { label: 'Hosted on Cloudflare', href: 'https://www.cloudflare.com/', icon: 'cloudflare' },
  { label: 'Theme Flux', href: 'https://github.com/capzk/astro-theme-flux', icon: 'flux' },
],
```

`icon` 可选 `astro` / `vercel` / `cloudflare` / `flux` / `github` / `link`，不写就用通用链接图标。默认新窗口打开，指向站内地址时加 `external: false`。**空数组就整行不显示**；数组整体替换、不做合并。站龄那个「已运行 N 天」的胶囊跟这一行一起出现。

### 备案

**默认关。** 境内托管才需要，海外托管和写给自己看的站都没有 —— 默认摆一行空的「京ICP备」是脏数据。

要开就三件事一起做：

```ts
beian: {
  enable: true,
  text: '京ICP备12345678号-1',   // 带 -1 的要把后缀写全
  link: 'https://beian.miit.gov.cn/',
},
```

网页上的备案号必须**可点击跳到工信部**，纯文本挂着不算。所以这一项从结构上就是个链接，`link` 一般不用改。`enable` 开了却忘了填 `text`，页脚不会出现那一行 —— 构建期会提醒。

## 访客统计与站长验证

这两件事经常被当成一件，其实完全不同，所以配置里也分成两段 —— 都在 `src/config/user/analytics.ts`：

| 你想要的 | 配哪 | 填什么 |
| --- | --- | --- |
| 多少人看了哪篇文章 | `analytics` | GA4 的 `G-XXXXXXXXXX`，或 Umami 的站点 ID |
| 读者怎么点、滚到哪、卡在哪 | `analytics.clarity` | Clarity 的项目 ID |
| 搜索里哪些词带来流量 | `verification.google` | Search Console 的验证串 |
| Bing 的收录与抓取情况 | `verification.bing` | `msvalidate.01` 的验证串 |

`analytics` 是**脚本**：每页下载、会上报数据。`verification` 是**一行 meta**：只认领所有权，不发任何请求，也不下载任何东西。

### 统计

```ts
analytics: {
  enable: true,                                  // 总开关
  google:  { enable: true,  measurementId: 'G-XXXXXXXXXX' },
  umami:   { enable: false, src: 'https://umami.example.com/script.js', websiteId: '3f2a…' },
  clarity: { enable: false, projectId: 'abcdefghij' },
},
```

**三家各自一个开关，可以同时开。** 打开某一家要两步：总开关 `enable: true`，那一家的 `enable` 也改 true 并填上 id。只改一家不改总开关，什么都不会输出 —— 这是最容易踩的一步。

| | 定位 | 脚本 | Cookie | 境内可达 |
| --- | --- | --- | --- | --- |
| Google Analytics 4 | 访问统计 | gtag.js 约 100KB | 有，欧盟需要同意弹窗 | `googletagmanager.com` 基本不通 |
| Umami | 访问统计 | 约 2KB | **无**，不需要弹窗 | 自托管即可，随便哪台机器 |
| Microsoft Clarity | 热图 / 会话回放 | 自注入约 30KB | 有（`_clck` / `_clsk`） | 一般可用 |

读者主要在国内的话选 Umami。选 GA 也不是不行，但要知道那个脚本会挂到超时 —— 它是 `async`，不会挡住渲染，可这一页终究白等一个连接。

**为什么不是「用哪家」的单选框。** GA 和 Umami 是同类，同时开会把同一份流量记两次，这点没错；但 Clarity 录的是行为不是访问量，「Umami 看流量 + Clarity 看热图」是正常组合。所以结构上允许并存，把「别重复统计」做成构建期的一句提醒：GA 和 Umami 同时开着时，构建会告诉你「两边报表永远对不上，对比完记得关一个」。

**只在生产构建里输出。** `astro dev` 打开页面时连脚本都不下载，不会往真实报表里灌 `localhost` 的访问 —— 这比去报表后台配「排除 localhost」省事，也不会因为忘了配而把数据弄脏。

Umami 还能再加一层 `domains: 'example.com,www.example.com'`，挡住「同一份产物部署到测试域名」的情况。构建期那道闸管的是 `dev`，这一道管的是同一个产物换了个域名跑。

Umami 还有几个附加项，都不用、默认关：

| 字段 | 作用 |
| --- | --- |
| `performance: true` | 收集真实用户的 Core Web Vitals（LCP / CLS / INP）。Lighthouse 跑在模拟环境，这个是读者真实的网络与设备，想知道优化有没有落到实处比看分数有用 |
| `errors: true` | 上报访客浏览器的 JS 异常（Umami 3.5+）。博客脚本少、一般不会报错，但这是唯一能看到「读者那边挂了」的途径；配合 `errorRelease: 'web@1.0.0'` 能分清是哪个版本 |
| `hostUrl` | 脚本走公共 CDN、数据要进自己实例时才填（`data-host-url`） |

两个实现细节：脚本带 `async`，另外给每家的域名各补了一条 `dns-prefetch`。只预解析不做 `preconnect` —— 后者要立刻完成一次 TCP + TLS 握手，会占掉一条连接，而统计不是首屏关键资源，那几毫秒更该留给 banner 图。

<div class="note note-warning">填错 id 不会报错，脚本照常下载，只是报表里一条数据都没有 —— 而报表是「没人天天盯着」的东西，可能一个月后才发现。所以构建期会检查格式：<code>UA-</code> 开头（2023 年已停服的 Universal Analytics）、纯数字的数据流 ID、<code>GT-</code> 容器 ID、带连字符的 Clarity ID，都会被点名。</div>

### 站长验证

```ts
verification: {
  google: 'xxxx',        // Search Console
  bing: 'xxxx',          // Bing Webmaster Tools（msvalidate.01）
  other: [
    { name: 'baidu-site-verification', content: 'codeva-xxxxxxxx' },
  ],
},
```

**填的是 content 的值，不是整段标签。** 从平台复制时只取引号里那串：

```html
✗ <meta name="msvalidate.01" content="ABC123" />
✓ ABC123
```

粘整段进来验证必然不过，而平台上只显示「验证失败」、不告诉你原因 —— 构建期会把这种写法点出来。

<div class="note note-info"><strong>Bing 没有客户端访问统计脚本。</strong>它不像 GA 那样给你一段 <code>gtag.js</code>。Bing 的访问数据并进了 Microsoft Clarity（另一段脚本，在 Clarity 后台单独申请），所以这里给的 <code>bing</code> 是站点认领：用来看搜索关键词、收录与抓取错误，不是看访问量。</div>

`other` 留给其他平台，有几条写几条（Yandex、Pinterest 之类）。`name` 或 `content` 为空的条目会被跳过，不会输出空标签。

## 界面文案

界面上那些看得见的字（「回到顶部」「本文最后更新于」「第 2 / 5 篇」）全在 `src/i18n.ts` 的一个对象里。改文案不用翻组件，也不用碰配置。

```ts
export const T = {
  home: '首页',
  backTop: '回到顶部',
  updatedPrefix: '本文最后更新于',
  seriesPart: (i: number, n: number) => `第 ${i} / ${n} 篇`,
};
```

三条约定：

- 导航项用的是 `labelKey`，值就是这里的键名。想给某一项单独起名，在**那个 nav 项**上写 `label` 覆盖，别去改字典 —— 一改，全站那个词都跟着变了。
- 带参数的词（上面的 `seriesPart`）是函数，直接改里面的模板字符串。
- 这里的字不进 `<head>`。`<title>`、description、OG 走的是配置里的 `title` / `description` / `subtitle`。

想加一整种语言（英文站、多语言切换）不是改这个文件能解决的，见[改造与扩展](/posts/extend/)里那节。

## 改完怎么检查

三步，顺序别换：

```bash
npm run check     # 类型：字段名拼错、类型不对
npm run build     # 真构建：内容、路由、图片
npm run preview   # 本地起 dist，比 dev 更接近线上
```

`npm run check` 是**必须跑的一步**，因为 `astro build` 不检查配置类型 —— 顶层写成 `titl:` 会静默用默认值，构建照样成功，站点看着也正常，只是站名不是你写的那一个。这类错只有类型检查能拦。

构建完还会打印一段体检结果，专挑「能跑，但有东西静默失效」的情况：

```
[Flux] 配置检查发现 2 处需要注意的地方：
  1. banner.img 写的是 "/img/banner-9.webp"，但 public/ 下找不到这个文件 —— 那一块会是空白或纯色。
  2. site 还是示例地址（https://astro-theme-flux.pages.dev）—— RSS、canonical、og:url 里的绝对链接都会指向它。
  改完重新构建即可，这些提示不影响当前构建。
```

它们不拦构建是有意的：文件名大小写错、域名还是示例值，都不影响页面生成。但也正因为不拦，不跑一次就永远不会发现。**把这段警告清零再部署。**

## 一个完整的改法示例

把示例站改成自己的，实际动的是四个文件。下面是「改完之后」的样子：

```ts
// src/config/user/site.ts
import { defineConfig } from '../merge';

export default defineConfig({
  title: '半山吧',
  subtitle: '写代码，也写别的',
  description: '一个关于工程、阅读和长期主义的地方。',
  author: 'capzk',
  lang: 'zh-CN',
  avatar: '/img/me.jpg',
  twitter: 'capzk',
  since: 2024,

  nav: [
    { label: '首页', href: '/', icon: 'home' },
    { label: '归档', href: '/archives/', icon: 'archive' },
    { label: '分类', href: '/categories/', icon: 'category' },
    { label: '标签', href: '/tags/', icon: 'tag' },
    { label: '关于', href: '/about/', icon: 'user' },
  ],
});
```

```ts
// src/config/user/appearance.ts
import { defineConfig } from '../merge';

export default defineConfig({
  banner: {
    title: '半山腰上',
    img: '/img/banner.jpg',
    height: '80vh',
    pageHeight: '40vh',
    maskAlpha: 0.4,
    slogan: '写点别的',
  },
  postBanner: { img: '/img/banner.jpg', height: '50vh', maskAlpha: 0.45 },
  color: { accent: '#c0392b', hue: 350 },
});
```

```ts
// src/config/user/content.ts
import { defineConfig } from '../merge';

export default defineConfig({
  index: { excerptLength: 160, showTags: false },
  post: { copyright: false },
  pageSize: 8,
});
```

```ts
// src/config/user/footer.ts
import { defineConfig } from '../merge';

export default defineConfig({
  footer: {
    runtime: { since: '2024-03-15' },
    poweredBy: [
      { label: 'Built with Astro', href: 'https://astro.build/', icon: 'astro' },
      { label: 'Hosted on Cloudflare', href: 'https://www.cloudflare.com/', icon: 'cloudflare' },
    ],
    beian: { enable: true, text: '京ICP备12345678号-1' },
  },
});
```

注意这四份都只写了**要改的那几项**：`banner` 里没写的 `typing`、`color` 里没写的 `navbar`、`footer` 里没写的 `links`，都还是默认值。这就是「对象逐层合并」的实际用法 —— 同一块配置可以分在两个地方写，不写的自动继承。反过来说，**想恢复某一项就把那行删掉**，不是改成默认值再写一遍。

最后还有两件不在这四个文件里的事：

1. 把 `astro.config.mjs` 的 `site` 换成你的域名 —— RSS、sitemap、canonical、`og:url` 全靠它拼。
2. `npm run check && npm run build`，把体检警告清零。

改 `user/` 下的文件时 `npm run dev` 会自动重载，不用重启。
