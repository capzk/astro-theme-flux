---
title: 站点配置详解：config.ts 的每个字段
date: 2026-10-22 09:00:00
description: 站名、菜单、banner、卡片、目录、版权、深色模式、配色 —— 全部集中在一个带类型校验的文件里，逐段说明取值与效果。
tags:
  - 配置
  - config
  - TypeScript
categories:
  - 指南
cover: ../../assets/covers/cover-2.webp
---

主题的配置只有一个入口：**`src/config.ts`**。它导出一个 `SITE` 常量，页面组件只读取它，不读别的地方。

好处是：改配置不需要翻组件，也不需要记 YAML 缩进。写错字段名、把字符串塞进数字位，`npm run build` 会当场报错并指出位置。

<div class="note note-info">这份文件用 TypeScript 的 <code>interface</code> 描述了每个字段的类型和含义。编辑器里把鼠标悬停在字段上，就能看到对应注释 —— 和这篇文档是同一份信息来源。</div>

## 全景

```ts
export const SITE: SiteConfig = {
  title, subtitle, description, author, lang, avatar, since, beian,
  nav: [...],
  banner:    { img, height, maskAlpha, slogan, scrollDown },
  postBanner:{ img, height, maskAlpha },
  index:     { defaultImg, excerptLength, showDate, showCategory, showTags },
  post:      { meta: {...}, toc, copyright, prevNext, wpm },
  darkMode:  { enable, default },
  color:     { navbar, bodyBg, board, accent },
  pageSize,
  search,
};
```

下面按段拆。

## 站点信息

```ts
title: 'Flux',
subtitle: '一个 Material Design 风格的 Astro 博客主题',
description: '流体般的阅读体验：卡片式首页、全屏 banner、暗色模式、跟随滚动的目录。',
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

```ts
import bannerImg from './assets/banner.webp';

banner: {
  img: bannerImg,           // import 进来的图会被优化；也可以写 '/img/banner.svg' 或完整 URL
  height: '100vh',          // 任意 CSS 长度：60vh / 400px / 32rem
  maskAlpha: 0.3,           // 0~1，黑色蒙版，越大字越清楚
  slogan: '流体般的阅读体验',
  scrollDown: true,
},
```

`img` 有两种写法，差别只在**要不要 Astro 帮你压图**：

| 写法 | 效果 |
| --- | --- |
| `import x from './assets/banner.webp'` | 生成 720 / 1080 / 1440 / 1920 四档 webp，浏览器按屏宽挑一张，首屏图还会带上 `fetchpriority="high"` |
| `'/img/banner.svg'` 或外链 | 原样输出，不处理 |

`img` 留空则退化成纯色底，标题照样显示。`maskAlpha` 是**文字可读性**的唯一旋钮 —— 背景图越花，这个值越要大。

`slogan` 不写字就用 `SITE.subtitle`。

滚动提示箭头（那块会上下浮动的向下箭头）由 `scrollDown` 单独控制，首页高度不是 `100vh` 时建议关掉，不然箭头会压在内容上。

## 文章页 banner

```ts
postBanner: {
  img: bannerImg,   // 同上，本地资源会被优化
  height: '60vh',
  maskAlpha: 0.35,
},
```

文章页 banner 比首页矮一档，蒙版更深一点 —— 因为上面要压两行元信息（作者/日期、字数/阅读时长），字多了更需要对比度。

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
},
```

这四项会被写进页面的内联样式，覆盖 CSS 变量：

| 配置项 | CSS 变量 | 影响 |
| --- | --- | --- |
| `navbar` | `--navbar-bg-color` | 顶栏底色（首页透明时看不出来，滚动后才显色） |
| `bodyBg` | `--body-bg-color` | 页面底色，也就是卡片外的那圈背景 |
| `board` | `--board-bg-color` | 白卡片底色、页脚底色、回到顶部按钮底色 |
| `accent` | `--link-hover-color` | 链接悬停、标题里的强调、返回顶部悬停 |

<div class="note note-warning">这四项<strong>只作用于亮色模式</strong>。暗色那套变量写在 <code>main.css</code> 的 <code>[data-user-color-scheme="dark"]</code> 里，如果这里无条件覆盖会连暗色一起盖掉。想连暗色一起定制，直接改 CSS 变量，见《换成你自己的样子》。</div>

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

  banner: { img: '/img/banner.jpg', height: '80vh', maskAlpha: 0.4, slogan: '半山腰上', scrollDown: true },
  postBanner: { img: '/img/banner.jpg', height: '50vh', maskAlpha: 0.45 },

  index: { defaultImg: '/img/cover-default.svg', excerptLength: 160, showDate: true, showCategory: true, showTags: false },
  post: { meta: { author: false, date: true, wordcount: true, min2read: true }, toc: true, copyright: false, prevNext: true, wpm: 300 },

  darkMode: { enable: true, default: 'auto' },
  color: { navbar: '#2f4154', bodyBg: '#f2f2f2', board: '#ffffff', accent: '#c0392b' },

  pageSize: 8,
  search: true,
};
```

改完 `npm run dev` 会自动重载。上线前记得另外把 `astro.config.mjs` 里的 `site` 换成真实域名。
