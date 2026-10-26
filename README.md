# Flux

[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](./LICENSE)
[![Astro](https://img.shields.io/badge/Astro-7.x-BC52EE.svg?logo=astro&logoColor=white)](https://astro.build)
[![Node](https://img.shields.io/badge/node-%E2%89%A522.23.4-339933.svg?logo=node.js&logoColor=white)](./package.json)

> A Material Design blog theme for **Astro** — card grid, full-screen banner, dark mode, local search, sticky TOC, Waline comments.

**在线预览**：[astro-theme-flux.pages.dev](https://astro-theme-flux.pages.dev)（Cloudflare Pages）

> [!NOTE]
> **关于这个项目**
> Flux 完全由 **AI 迁移并编写**（从 hexo-theme-fluid 移植到 Astro），主要目的是作者自用。
> 作者**不承诺按需求做功能开发，也不承诺长期维护** —— issue 未必及时回复，PR 视情况合并。
> 如果你有特定功能需求或想调整行为，最可靠的做法是 fork 一份自己改，或者直接让 AI 帮你改。
>
> *Built entirely by AI for personal use. No feature requests, no maintenance guarantee — please fork if you need changes.*

**Flux** 是一套 Material Design 风格的 Astro 博客主题。设计概念与视觉语言迁移自 [hexo-theme-fluid](https://github.com/fluid-dev/hexo-theme-fluid)：卡片与阴影、全屏 banner、大留白的阅读区、跟随滚动的目录、深浅色主题 —— 观感对齐原版，而运行时依赖归零。

不引 Bootstrap、iconfont、jQuery、tocbot、clipboard.js、highlight.js、fancybox、nprogress。目录高亮是原生的滚动监听，图标是内联 SVG，代码高亮在构建期由 Shiki 完成，图片灯箱自己写了几十行。唯一的例外是评论：Waline 客户端从 CDN 按需加载，默认关闭，不给不评论的站点增加一个字节。

## 特性

**布局与观感**

- 首页：全屏 banner（背景图 + 黑色蒙版 + 站名大字 + 滚动箭头），下方浮起一张白卡片
- 卡片流：左图右文，封面带投影，摘要固定三行，meta 一行小字（日期 / 分类 / 标签）
- 文章页：banner + 白卡片，正文收窄居中，右侧目录栏跟随滚动（三栏 `2fr 8fr 2fr`，对齐原版 Bootstrap 的 `col-lg-2/8/2`）
- 顶栏：首页透明，滚动后变实色 + 阴影；移动端抽屉菜单

**功能**

| 功能 | 实现 |
| --- | --- |
| 深色模式 | 3 行内联脚本 + 一套 CSS 变量，首帧不闪白；优先级 `localStorage > 站点默认 > 系统` |
| 目录跟随高亮 | 原生滚动监听 + `requestAnimationFrame`（原版是 tocbot + jQuery） |
| 图片灯箱 | 自己写的 60 行，替代 fancybox：ESC / 点遮罩 / 点按钮关闭，焦点归还 |
| 站内搜索 | 构建期生成 `/searchindex.json`，前端分档打分；`/` 或 `Ctrl/⌘+K` 唤起 |
| 代码块 | Shiki 双主题（亮 `github-light` / 暗 `github-dark`）+ 语言标签 + 复制按钮 |
| 归档 / 分类 / 标签 / 友链 / 关于 / 404 | 全部静态生成 |
| 分页 | 首页 `/page/2/`、归档 `/archives/page/2/`、分类与标签同理，形态与 Hexo 一致 |
| 图片优化 | 封面与 banner 走 `astro:assets`：按屏宽生成多档 webp + `srcset`，首屏图 `fetchpriority="high"` |
| 相关文章 | 按标签（3 分）/ 分类（2 分）的重合度取前 3 篇，没有相关的一篇就不显示 |
| 文章 URL | front matter 的 `slug` 或文件路径生成，中文自动转拼音，全小写 ASCII，撞车在构建期报错 |
| 返回顶部、标题锚点、外链新窗口 | 零依赖脚本 / Markdown 插件 |
| 分享卡片与结构化数据 | Open Graph / Twitter 全套 meta + JSON-LD（`WebSite` / `BlogPosting`），封面自动绝对化 |
| 评论 | Waline：填一个服务端地址即开，滚到评论区才加载客户端，配色与深浅色跟随主题 |
| RSS 与 sitemap | `@astrojs/rss` + `@astrojs/sitemap` |

## 开始使用

```bash
git clone https://github.com/capzk/astro-theme-flux.git my-blog
cd my-blog
npm install
npm run dev      # http://localhost:4321
npm run build    # 产物在 dist/
npm run check    # 类型检查（含 .astro 模板），0 error 才算干净
```

要求 **Node ≥ 22.23.4**（Astro 7 的要求）。

也可以用 GitHub 的 **Use this template** 直接开一个新仓库，或 `npx degit capzk/astro-theme-flux my-blog` 拉一份不含 git 历史的副本。

## 示例文章

`src/content/posts/` 自带 13 篇示例，其中「指南」分类的 7 篇就是这份主题的使用文档，同时也充当排版样例：

| 文章 | 讲什么 |
| --- | --- |
| 快速开始 | 环境要求、三步启动、目录结构 |
| 站点配置详解 | `config.ts` 每个字段的取值与效果 |
| 写一篇文章 | front matter、分类与标签、正文可用语法 |
| URL 与 slug | 文章地址怎么生成、中文怎么转拼音、改了地址怎么补救 |
| 换成你自己的样子 | 配色、字体、版心与字号 |
| 部署上线 | GitHub Pages / Vercel / nginx，以及常见坑 |
| 改造与扩展 | 加页面、加图标、加语言、换评论、换搜索 |

fork 之后整批删掉即可，不影响任何功能。

## 配置

几乎全部在 **`src/config.ts`** 一个文件里：站名、副标题、头像、分享封面、菜单、banner（图 / 高度 / 蒙版 / 标语）、文章页 banner、首页卡片（默认封面 / 摘要长度 / meta 开关）、文章 meta（作者 / 日期 / 字数 / 阅读时长）、目录、文末版权、上下篇、相关文章、深色模式默认值、配色（顶栏 / 页面底 / 卡片底 / 强调色）、每页条数、搜索开关。

图片有两套写法，差别只在要不要构建器压图：

```ts
import banner from './assets/banner.webp';   // 本地资源：生成多档 webp + srcset
banner: { img: banner, /* … */ }             // 也可以继续写 '/img/banner.svg' 或外链
```

上线前记得改 **`astro.config.mjs`** 的 `site`，它决定 RSS、sitemap、canonical 与 OG 里的绝对地址。本仓库里它填的是示例站的地址（`https://astro-theme-flux.pages.dev`），fork 之后第一件事就是换成你自己的域名 —— 忘了换，分享出去的链接会指向示例站。

### SEO 与分享

每页都输出 canonical、`og:*`、`twitter:*` 与 JSON-LD；首页是 `WebSite`，文章页是 `BlogPosting`（含发布时间、更新、作者、分类、标签、字数）。这些值全部由页面数据现算，不用手填。

分享缩略图取 `SITE.ogImage`（默认 `public/img/og.png`，1200×630）。**社交媒体不渲染 SVG**，所以文章若配了位图封面（`bannerImg` / `indexImg`）就用那一张，配的是 SVG 就自动回落到站点图 —— 不会把空白卡片发给别人。换成自己的图时也请用 PNG / JPG。

`/robots.txt` 是从 `site` 现算出来的（`src/pages/robots.txt.ts`），不需要另外维护；`public/_headers` 是 Cloudflare Pages 的缓存策略，用别的平台会忽略它。

配色除了可以在 `config.ts` 覆盖，也可以直接改 `src/styles/main.css` 顶部的 CSS 变量 —— 亮色一套、暗色一套，改色不用碰任何组件。

### 评论（Waline）

评论区接的是 [Waline](https://waline.js.org/)，默认**关闭** —— 它需要一个自己的服务端，示例站没有。三步打开：

1. 按[官方教程](https://waline.js.org/guide/get-started/)部署一个服务端（Vercel、Cloudflare Workers、Docker 都行），拿到域名；
2. 把域名填进 `src/config.ts` 的 `comment.waline.serverURL`；
3. 把 `comment.enable` 改成 `true`。

```ts
comment: {
  enable: true,
  type: 'waline',
  waline: {
    serverURL: 'https://comment.example.com',
    locale: { placeholder: '说点什么吧，支持 Markdown…' },
    requiredMeta: ['nick'],   // 昵称必填、邮箱选填；要邮箱也必填就加 'mail'
    pageSize: 10,
    lazy: true,
  },
},
```

单篇想关掉，在 front matter 里写 `comment: false`。

评论是**按 URL 归属**的（Waline 的 `path` 就是文章地址）。所以改文章的 `slug` 或目录名之前先想一下 —— 地址变了，老评论不会跟过去。想让多站（比如旧域名与新域名）共用一份评论数据，就把 `waline.path` 写死成固定字符串。

几个实现上的选择，知道一下有好处：

- **客户端走 CDN**（jsDelivr 上的 `@waline/client@3`），不进依赖树、不进构建产物。想锁版本、换 CDN 或自托管，改 `waline.js` / `waline.css` 两个地址，**两个必须同版本**。
- **滚到评论区附近才加载**（`lazy: true`，提前 600px），首屏不为评论付流量；关掉它就是进页面就加载。
- **深色模式不用配**：切到暗色时 `html` 上带 `data-user-color-scheme="dark"`，Waline 自己认这个选择器。
- **不用维护第二套颜色**：`main.css` 的「评论区」一节把 Waline 的 CSS 变量接到了主题令牌上，改配色、切暗色，评论区跟着走。
- **评论挂了不影响阅读**：脚本加载失败只显示一句话和「重试」，不白屏，也不把正文挤走。
- **评论里默认不能传图**（`imageUpload: false`）。上传是写入型攻击面，服务端没配存储时点上传还会报错；配好 S3 / 图床之后再来配置里打开。

评论数显示在标题右侧（Waline 回填 `.waline-comment-count`）。浏览量统计没接 —— 主题里没有放这个数字的位置。

想把评论放到关于页或留言板，在那一页里 `<Comments />` 即可（`path` 默认取当前页路径）。

**上线前请注意**：`serverURL` 要用 `https://` —— 站点本身是 https，指向 http 的服务端会被浏览器按混合内容拦掉（本地调试指向 `http://127.0.0.1:8360` 是另一回事）。

Waline 服务端那边至少做三件事：

| 事项 | 怎么做 | 为什么 |
| --- | --- | --- |
| 限制来源域 | `SECURE_DOMAINS=你的域名`（**不带协议**，博客和服务端两个地址都写） | 不设的话，别人可以拿你的服务端当免费评论 API |
| 抢占管理员 | 部署完立刻访问 `<serverURL>/ui/register` 注册第一个账号，之后在后台开两步验证 | 第一个注册的人就是管理员，拖着不注册等于把后台敞开 |
| 先审后发 | `COMMENT_AUDIT=true`；频率限制用 `IPQPS`（默认 60 秒一条） | 评论一旦上线，垃圾广告是分钟级的 |

评论的内容、昵称邮箱、IP、UA 都存进**你自己部署的服务端**，不经过第三方 SaaS —— 这是自建方案的好处。不想记录 UA 和归属地，服务端设 `DISABLE_USERAGENT=true` / `DISABLE_REGION=true`。如果给站点加了 CSP，记得放行 `cdn.jsdelivr.net`（script / style）与 `serverURL`（connect）。

## 写文章

放进 `src/content/posts/`，front matter 与 Hexo 基本同名：

```yaml
---
title: 文章标题
date: 2026-10-20 10:00:00
slug: my-post-url              # 可选，自定义 URL；不写则按文件路径生成
updated: 2026-10-22 09:00:00   # 可选，有值时正文顶部显示「最后更新于」
description: 摘要（列表与 SEO 用）
tags: [Astro, 主题]
categories: [公告]
cover: ../../assets/covers/cover-1.webp   # 卡片封面（会优化；兼容写法 indexImg: /img/x.png）
sticky: true                   # 置顶
toc: false                     # 单篇关掉右侧目录；不写则跟随 config.ts
comment: false                 # 单篇关掉评论；不写则跟随 config.ts
draft: false                   # true 则不进列表 / 搜索 / RSS
banner: ../../assets/banner.webp  # 单篇 banner 图（会优化；兼容写法 bannerImg: /img/x.svg）
bannerMaskAlpha: 0.5           # 单篇 banner 蒙版（可选，0~1）
---
```

字段由 Zod 校验，写错会在构建期报错，并指出是哪一篇。`draft: true` 的文章不会进入列表、搜索索引与 RSS。

### URL 怎么生成

地址里只会出现小写字母、数字和 `-`：中文转拼音，空格转 `-`，标点与 emoji 丢掉。

| 文件 | front matter | URL |
| --- | --- | --- |
| `posts/hello-flux.md` | — | `/posts/hello-flux/` |
| `posts/2026/年度总结.md` | — | `/posts/2026/nian-du-zong-jie/` |
| `posts/hello-flux.md` | `slug: hi` | `/posts/hi/` |
| `posts/2026/年度总结.md` | `slug: year-review` | `/posts/2026/year-review/` |
| `posts/2026/年度总结.md` | `slug: life/year-review` | `/posts/life/year-review/` |

- **不写 `slug`**：照抄文件路径（含子目录），逐段规范化。
- **写一段**：只替换文件名那一段，子目录保留。
- **写多段（含 `/`）**：整条路径都由 `slug` 决定，文件所在目录不再参与。
- `slug` 自己也会被清洗，写 `Hello World` 和写 `hello-world` 等价。
- 两篇文章算出同一个 URL 时**构建直接失败**，报错里列出冲突的文件 —— 不会静默丢文章。

多音字按词组取音（`重庆` → `chong-qing`），英文原样保留、只转小写（`Rust 2026` → `rust-2026`）。
转不出任何字符的名字（纯 emoji、纯符号）会报错，需要显式写 `slug`。

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

`slug` 字段也照搬 Hexo 的语义 —— 写了就替换文件名那一段。区别在于主题会把中文转成拼音（Hexo 原样保留中文），
所以**从中文文件名的 Hexo 站迁过来，文章链接会变**，需要在新站配一批 301，或者给每篇补一个和旧链接一致的 `slug`。

## 取舍：原版有哪些，这里为什么没有

| 原版功能 | Flux | 原因 |
| --- | --- | --- |
| 评论（13 种第三方服务） | 只接 Waline | 一个够用；13 套适配是插件该干的活，主题背不动 |
| 浏览量统计（Waline / 不蒜子） | ✕ | 主题里没有放这个数字的位置，接了也是摆设 |
| 文章加密、数学公式、Mermaid | ✕ | 各需一个运行时库，属于插件而非主题核心 |
| 打字机副标题、视差 banner | ✕ | 锦上添花，需要额外 JS；banner 保留静态版 |
| fancybox 图片缩放 | 自写灯箱 | 只要「点开放大」，不需要一个 40KB 的库 |
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
├── assets/              # 参与优化的图片源文件（封面、banner）
├── data/links.ts        # 友链
├── layouts/BaseLayout.astro
├── components/          # Navbar / Banner / Board / PostCard / PostList /
│                        # ArchiveList / Toc / Pagination / SearchModal /
│                        # Comments / Icon / Footer
├── pages/               # 文件即路由
├── plugins/markdown.js  # 标题锚点 / 代码块工具栏 / 外链
├── scripts/theme.js     # 顶栏、深色模式、目录高亮、复制、回顶
├── scripts/search.js    # 站内搜索
├── scripts/comments.js  # 评论区的懒加载与初始化
├── utils/posts.ts       # 取文章 / 排序 / 分页 / 相关文章 / 阅读统计
├── utils/slug.ts        # URL 规范化（含中文转拼音）
├── utils/image.ts       # 图片两种写法的统一处理
├── utils/seo.ts         # 分享封面挑选与 JSON-LD 生成
└── styles/main.css      # 全部样式（变量分亮暗两套）
```

## 已知限制

- 封面与 banner 已走 `astro:assets`（见上方「配置」）。图片要放在 `src/assets/` 并用 `import` 或 `cover:` 引用才会被优化；`public/` 下的图永远原样输出 —— 这是 Astro 的规则，不是主题的限制。
- 目录取 h2 / h3 / h4，h5 以下不收（缩到第五层已经读不清了）。单篇可用 `toc: false` 关掉。
- 搜索是线性扫描 + 分档权重，没有分词。文章量上千后建议换 [Pagefind](https://pagefind.app/)。
- 分享封面不会自动生成：每篇文章共用一张站点图，除非文章自己配了位图封面。想给每篇做单独的卡片图，得自己出图。
- 图片优化只管 `cover` / `banner` / 配置里 `import` 进来的图。写成字符串（`/img/x.png`）的资源会被原样引用 —— 那是留给 Hexo 迁移与 `public/` 里现成图片的兼容路径。
- 相关文章只在有标签或分类重合时才出现。文章很少或从来不打标签时，这一块会一直空着。
- 界面文案目前只有中文，`src/i18n.ts` 已按字典组织，加语言只需扩一个对象。
- 评论的客户端默认从 CDN 加载，离线环境或内网部署会失败（页面上会给出提示与重试）。要完全自托管，把 `waline.js` / `waline.css` 放进 `public/`，再把配置里两个地址改成 `/waline.js` 这一级别的绝对路径即可。

## 更新日志

版本历史与每版的详细改动见 [CHANGELOG.md](./CHANGELOG.md)。主题遵循语义化版本，每个版本打一个 `v*` 标签。

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
