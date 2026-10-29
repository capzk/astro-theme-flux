# Flux

[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](./LICENSE)
[![Astro](https://img.shields.io/badge/Astro-7.x-BC52EE.svg?logo=astro&logoColor=white)](https://astro.build)
[![Node](https://img.shields.io/badge/node-%E2%89%A522.23.4-339933.svg?logo=node.js&logoColor=white)](./package.json)

> A Material Design blog theme for **Astro** — card grid, full-screen banner, dark mode, local search, sticky TOC, pluggable comments (Waline / Giscus / Artalk).

**在线预览**：[astro-theme-flux.pages.dev](https://astro-theme-flux.pages.dev)（Cloudflare Pages）

> [!NOTE]
> **关于这个项目**
> Flux 完全由 **AI 迁移并编写**（从 hexo-theme-fluid 移植到 Astro），主要目的是作者自用。
> 作者**不承诺按需求做功能开发，也不承诺长期维护** —— issue 未必及时回复，PR 视情况合并。
> 如果你有特定功能需求或想调整行为，最可靠的做法是 fork 一份自己改，或者直接让 AI 帮你改。
>
> *Built entirely by AI for personal use. No feature requests, no maintenance guarantee — please fork if you need changes.*

**Flux** 是一套 Material Design 风格的 Astro 博客主题。设计概念与视觉语言迁移自 [hexo-theme-fluid](https://github.com/fluid-dev/hexo-theme-fluid)：卡片与阴影、全屏 banner、大留白的阅读区、跟随滚动的目录、深浅色主题 —— 观感对齐原版，而运行时依赖归零。

不引 Bootstrap、iconfont、jQuery、tocbot、clipboard.js、highlight.js、fancybox、nprogress。目录高亮是原生的滚动监听，图标是内联 SVG，代码高亮在构建期由 Shiki 完成，图片灯箱自己写了几十行。唯一的例外是评论：客户端从 CDN 按需加载，默认关闭，不给不评论的站点增加一个字节（连加载器本身都不会出现在产物里）。

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
| 代码块 | Shiki 双主题（亮 `github-light` / 暗 `github-dark`）+ 语言标签 + 复制按钮 + 行号；围栏 meta 写 `{1,3-5}` 高亮指定行、写 `nolinenos` 关掉行号 |
| 归档 / 分类 / 标签 / 友链 / 关于 / 404 | 全部静态生成 |
| 分页 | 首页 `/page/2/`、归档 `/archives/page/2/`、分类与标签同理，形态与 Hexo 一致 |
| 图片优化 | 封面与 banner 走 `astro:assets`：按屏宽生成多档 webp + `srcset`，首屏图 `fetchpriority="high"` |
| 图片占位色 | 构建期把每张图缩成 2×2 取出主色调（一张图 18 个字符），垫在图片下面 —— 图没到时不会先白一块 |
| 配色 | 四个字面颜色，或者一个 `hue` 让 oklch 派生整套（构建期定好，不带运行时） |
| 页面开关 | 关于 / 友链可关，导航、sitemap、页面本身三处一起变（301 回首页） |
| 上下篇 | 默认按时间相邻；文章写了 `series` 就改成系列内前后，文章页顶部再列一份系列清单 |
| 反抓取小件 | `mailto:` 降级成 `me [at] example.com`（脚本还原成链接）；防盗链图床的图自动补 `referrerpolicy` |
| 相关文章 | 按标签（3 分）/ 分类（2 分）的重合度取前 3 篇，没有相关的一篇就不显示 |
| 索引卫生 | 分页 / 单个标签页 / 单个分类页输出 `noindex, follow` 且不进 sitemap —— 它们的内容是文章清单，进索引只是重复 |
| 中文排版 | `text-spacing-trim` 压行首标点、`text-autospace` 在中西文之间留气口、`orphans`/`widows` 防孤行。都是渐进增强，老浏览器无副作用 |
| 页脚 | 两端渐隐的分割线；版权与站龄一行（天数按访问当天算），RSS / Atom / Sitemap 三个入口，ICP 备案默认关、开了才带链接 |
| 文章 URL | front matter 的 `slug` 或文件路径生成，中文自动转拼音，全小写 ASCII，撞车在构建期报错 |
| 返回顶部、标题锚点、外链新窗口 | 零依赖脚本 / Markdown 插件 |
| 分享卡片与结构化数据 | Open Graph / Twitter 全套 meta（含 `og:image:type`）+ JSON-LD 实体图：`WebSite` / `Organization` / `Person` / `BlogPosting` / `BreadcrumbList` 用 `@id` 串成一套 |
| 评论 | 可插拔：Waline / Artalk（自建服务端）或 Giscus（GitHub Discussions）改一行切换；滚到评论区才加载，配色与深浅色跟随主题 |
| 访客统计 | 三家各自开关、可并存：GA4 / Umami（访问统计）、Clarity（热图与会话回放）；`async` 加载 + `dns-prefetch`，只在生产构建里输出；另有一段站长认领（Search Console / Bing / 百度…） |
| 最新评论 | 文章页底部一行「本站最新评论」（Waline 的公开读接口），滚到附近才拉；只用 `textContent` 渲染，不执行访客写的 HTML |
| RSS 与 sitemap | `@astrojs/rss` + `@astrojs/sitemap`；文章条目带 `lastmod`（取 front matter 的 `updated`，不是构建时间），feed 带 `atom:link rel="self"` 与可验证的 `lastBuildDate` |
| Atom 与 llms.txt | `/atom.xml` 补 RSS 没有的 `<updated>` 与 `<id>`；`/llms.txt` 给 AI 爬虫一份带摘要的目录，`/llms-full.txt` 再给一份全站正文 |
| AI 爬虫策略 | `robots.txt` 里一行 `Content-Signal`（允许引用、不允许训练）+ 一段注释掉的分机器人模板，想单独拒绝某一家就取消注释 |
| 配置 | 三层：类型 / 出厂默认值 / 你的值。`defineConfig` 保类型检查，构建期体检静默失效的配置，升级主题不覆盖你的配置 |
| CI | push 与 PR 都跑 `astro check` + `astro build` —— `astro build` 自己不查类型，这条是唯一的关卡 |

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

`src/content/posts/` 自带 14 篇示例，其中「指南」分类的 8 篇就是这份主题的使用文档，同时也充当排版样例：

| 文章 | 讲什么 |
| --- | --- |
| 快速开始 | 环境要求、三步启动、目录结构 |
| 站点配置详解 | `src/config/` 的结构、每一项的取值与效果 |
| 写一篇文章 | front matter、分类与标签、正文可用语法 |
| 评论系统 | Waline / Giscus / Artalk 怎么搭起来、配置填哪几行、配完怎么验证 |
| URL 与 slug | 文章地址怎么生成、中文怎么转拼音、改了地址怎么补救 |
| 换成你自己的样子 | 配色、字体、版心与字号 |
| 部署上线 | GitHub Pages / Vercel / nginx，以及常见坑 |
| 改造与扩展 | 加页面、加图标、加语言、换评论、换搜索 |

fork 之后整批删掉即可，不影响任何功能。

## 配置

配置分三层，各管各的：

| 位置 | 是什么 | 你要动吗 |
| --- | --- | --- |
| `src/config/user/` | **你的配置**，只写和默认值不一样的部分 | ✓ 就改这里 |
| `src/config/defaults.ts` | 主题的出厂默认值，每一项都有注释 | 读，但别改（升级时被替换） |
| `src/config/types.ts` | 字段的类型契约与详细说明 | 查某个字段什么意思时读 |

**为什么拆成三层。** 配置和主题代码混在一个文件里，升级主题时就得分清「哪几行是我改的」——
以前的流程是：把定制复制出来、整目录覆盖、再贴回去，每次升级都要重来一遍，忘一处就丢配置。
现在 `user/` 是个独立目录，升级只替换主题文件，你的配置原样留着，不用备份也不用还原。

顺带解决的另一件事：默认值不再依赖 `src/assets/` 里的示例图（改用 `public/` 路径），
所以「按图优化」不再是主题的硬前提 —— 想要就自己 `import`，不想要也没有任何东西会断。

`user/` 里八个文件，按「你要解决的问题」分，而不是按配置树的层级分：

| 文件 | 管什么 |
| --- | --- |
| `site.ts` | 站名、副标题、描述、作者、头像、分享封面、X 账号、导航菜单 |
| `appearance.ts` | 首页 banner（开关 / 图 / 高度 / 蒙版 / 标语 / 打字机 / 视差）、文章页 banner、配色、暗色模式 |
| `content.ts` | 首页卡片（默认封面 / 摘要长度 / meta 开关）、文章页开关（目录 / 版权 / 上下篇 / 相关文章 / 阅读速度）、每页条数、搜索、RSS 摘要长度 |
| `comment.ts` | 评论系统（Waline / Giscus / Artalk） |
| `analytics.ts` | 访客统计（GA4 / Umami）与站长验证（Search Console / Bing / 其他） |
| `footer.ts` | 页脚：站龄、RSS / Atom / Sitemap 入口、ICP 备案（默认关） |
| `links.ts` | 友链 |
| `pages.ts` | 页面开关：关于 / 友链。关掉后导航、sitemap 与页面本身一起变 |

写法就是普通 TS 对象，外面包一层 `defineConfig`：

```ts
// src/config/user/site.ts
import { defineConfig } from '../merge';

export default defineConfig({
  title: '我的博客',
  // 其余全都不用写 —— subtitle、avatar、nav… 继承默认值
});
```

`defineConfig` 只做一件事：**让 TypeScript 在这里检查字段名**。写错一个字母、往不存在的
字段里塞值、`type` 填了没有的评论系统，`npm run check` 当场报错。

这一点不是洁癖。`astro build` **不做类型检查**，写错的配置会被静默忽略 —— 真实发生过：
某次升级后 `comment.waline.js` 这个字段在新版里已不存在，构建照常成功、页面照常出，
只是自托管的客户端文件白放了，直到有人去翻产物才发现。现在这类问题在 `check` 阶段就拦住；
CI（`.github/workflows/ci.yml`）在每次 push 时跑一遍 `check` + `build`，PR 也跑。

三条合并规则：

- **对象逐层合并** —— 同一块配置可以分在两个文件里写（banner 的图在 `appearance.ts`，高度用默认值）
- **数组整体替换** —— 导航、友链写几项就是几项，不会和默认值拼起来变成 8 项
- **不写就是默认** —— `undefined` 不会覆盖默认值，删掉一行配置等于恢复出场设置

图片有三套写法，差别只在要不要构建器压图：

```ts
banner: {
  img: '/img/banner.webp',   // ① public/ 里的文件：原样输出（构建自动补 preload）
  // img: banner,            // ② import 进来的本地资源：多档 webp + srcset
  // img: 'https://…/a.jpg', // ③ 外链
  // 不写 / ''               // ④ 不要图：纯色底，标题照常显示
}
```

`/` 开头的路径打错不会报错，只会静默少一块，所以构建时会体检一遍并直接指出哪个文件找不到。
首页整块 banner 还能用 `banner.enable: false` 关掉，不用改页面代码。

### 图片占位色（LQIP）

卡片封面与 banner 都垫了一层「这张图的主色调」渐变：图片还没下载完时，那个位置显示的是
它大致什么颜色，而不是一块白。

**不需要任何命令。** `src/integrations/lqip.mjs` 在 `astro:config:setup` 里把每张图的颜色算好，
挂成虚拟模块 `virtual:flux-lqip`，构建和开发时自动生效 —— 换完图直接构建即可。

因为是集成而不是脚本，它跟命令行入口无关：`npm run build`、`astro build`、
CI 里写 `npx astro build`，走的都是同一条路。算不出来时（比如 sharp 的原生二进制拉不到）
只打一行警告，页面照旧，只是没有那层底色，不会让构建失败。

也没有中间文件要提交 —— 颜色直接内联进构建结果，不存在「忘了重新生成」这种状态。

查不到占位色就直接不输出 `style`，不猜、不留半成品；外链图不参与（它不在扫描目录里）。

### 页面开关

`src/config/user/pages.ts` 里两个布尔值：`about` / `links`。设成 `false` 之后：

1. 顶栏与移动端菜单里那一条自动消失（按 href 匹配，不用动 `nav`）
2. `sitemap` 里不再出现
3. 页面本身不输出内容，返回 301 跳到首页

归档、分类、标签没有开关 —— 它们是博客的骨架，关掉就不是同一个站了。
`pages.ts` 是**唯一一个不用 `defineConfig` 的配置文件**：`astro.config.mjs` 要直接 import 它来
过滤 sitemap，而配置文件由 esbuild 单独打包、不认识图片导入，所以它必须保持零依赖。
类型仍是显式的（`SiteConfig['pages']`），写错类型 `npm run check` 照样报。

上线前记得改 **`astro.config.mjs`** 的 `site`，它决定 RSS、sitemap、canonical 与 OG 里的绝对地址。本仓库里它填的是示例站的地址（`https://astro-theme-flux.pages.dev`），fork 之后第一件事就是换成你自己的域名 —— 忘了换，分享出去的链接会指向示例站。

### 访客统计与站长验证

这两件事经常被混为一谈，其实完全不同，所以配置里也分成两段（都在 `src/config/user/analytics.ts`）：

| 你想要的 | 配哪 | 填什么 |
| --- | --- | --- |
| 多少人看了哪篇文章 | `analytics` | GA4 的 `G-XXXXXXXXXX`，或 Umami 的站点 ID |
| 读者怎么点、滚到哪、卡在哪 | `analytics.clarity` | Clarity 的项目 ID |
| 搜索里哪些词带来流量 | `verification.google` | Search Console 的验证串 |
| Bing 的收录与抓取情况 | `verification.bing` | `msvalidate.01` 的验证串 |

`analytics` 是**脚本**（每页下载、会上报数据），`verification` 是**一行 meta**（认领所有权，不发任何请求）。

统计有三家，**每家一个开关，可以同时开**：

```ts
analytics: {
  enable: true,                                  // 总开关，一家都没开时用来一键关
  google:  { enable: true,  measurementId: 'G-XXXXXXXXXX' },
  umami:   { enable: false, src: 'https://umami.example.com/script.js', websiteId: '3f2a…' },
  clarity: { enable: false, projectId: 'abcdefghij' },
},
```

| | 定位 | 脚本 | Cookie | 境内可达 |
| --- | --- | --- | --- | --- |
| Google Analytics 4 | 访问统计 | gtag.js 约 100KB | 有 | 基本不通 |
| Umami | 访问统计 | 约 2KB | **无** | 自托管即可 |
| Microsoft Clarity | 热图 / 会话回放 | 自注入约 30KB | 有（`_clck` / `_clsk`） | 一般可用 |

**为什么是三个开关而不是一个「用哪家」的单选框。** GA 与 Umami 确实同类，同时开会把同一份流量记两次 —— 但 Clarity 不是同类东西，它录的是行为，不是访问量。「Umami 看流量 + Clarity 看热图」是正常组合，单选表达不了。所以结构上允许并存，而把「别重复统计」变成构建期的一句提醒：GA 和 Umami 同时开着时会告诉你「两边报表永远对不上，对比完记得关一个」。

**只在生产构建里输出。** `astro dev` 打开页面时连脚本都不下载，不会往真实报表里灌 localhost 的访问 —— 比去后台配「排除 localhost」省事。Umami 还能再加一层 `domains: 'example.com,www.example.com'`，挡住「同一份产物部署到测试域名」的情况。

**Umami 的几个附加项**（都不用，默认关）：

| 字段 | 对应属性 | 作用 |
| --- | --- | --- |
| `performance: true` | `data-performance` | 收集真实用户的 Core Web Vitals（LCP / CLS / INP）。Lighthouse 跑在模拟环境，这个是读者真实的网络与设备 |
| `errors: true` | `data-errors` + `data-release` | 上报访客浏览器的 JS 异常。博客脚本少，一般不会报错，但这是唯一能看到「读者那边挂了」的途径 |
| `hostUrl` | `data-host-url` | 脚本走公共 CDN、数据要进自己实例时才填 |
| `excludeSearch` / `excludeHash` | 同名 | 查询参数 / hash 算不算进页面路径 |

**Bing 没有访问统计脚本。** 它不像 GA 那样给你一段 `gtag.js` —— Bing 的访问数据并进了 Microsoft Clarity（要的就是上面 `clarity` 那一段，只是得去 Clarity 后台单独申请）。所以 `verification.bing` 那一项是站点认领，用来看搜索关键词与抓取情况，不是统计。

两个实现细节：脚本是 `async` 的，另外给它的域名各补一条 `dns-prefetch`（只查 DNS，不做完整握手 —— 统计不是首屏关键资源，不该跟 banner 图抢连接）。填错 id 不会报错、只会让报表永远空着，所以构建期会检查格式并点名：`UA-` 开头（2023 年已停服）、纯数字的数据流 ID、带连字符的 Clarity ID、整段 `<meta>` 粘进 content 字段，都会被指出来。

`verification.other` 留给其他平台，有几条写几条：

```ts
verification: {
  other: [
    { name: 'baidu-site-verification', content: 'codeva-xxxxxxxx' },
    { name: 'yandex-verification', content: 'xxxxxxxx' },
  ],
},
```

### SEO 与分享

每页都输出 canonical、`og:*`（含 `og:image:type`）、`twitter:*` 与 JSON-LD，值全部由页面数据现算，不用手填。

**结构化数据按「实体」写，不是攒字段**：首页一个 `@graph` 里声明 `WebSite`、`Organization`（站点）、`Person`（作者）三个节点，各带稳定 `@id`；文章页的 `BlogPosting` 用 `@id` 指回同一个作者与发布方，`isPartOf` 指向 `WebSite`，另附一条 `BreadcrumbList`（首页 › 分类 › 标题）。这样「各页的 capzk 是同一个人」说得一致 —— E-E-A-T 判的就是这个。

`SITE.twitter` 填了才会输出 `twitter:site` / `twitter:creator`，也会作为 `sameAs` 进 `Person` 节点；不填一行都不输出。头像只有本身是位图时才当 `Organization.logo` 用（Google 不收 SVG logo）。

索引策略只写在 `src/layouts/BaseLayout.astro` 一处：

| 页面 | `robots` 内容 | 为什么 |
| --- | --- | --- |
| 分页 / 单个标签页 / 单个分类页 | `noindex, follow` | 内容是一份文章清单，进索引只是重复；链接照跟，权重才能流向文章 |
| 其余页面 | `max-image-preview:large` | 不写就只有默认的标准缩略图；它只是摘要指令，不带 index/noindex |
| 404 | `noindex, follow` | 正常返回 404 码本来就进不去；万一被谁改成 200，也不至于变成软 404 |

**刻意不写 `nosnippet` / `max-snippet:0`**：这两项会让页面失去被 AI 摘要引用的资格，而 AI Overviews 只引用「能出摘要」的页面。

分享缩略图的挑选顺序是 **`cover` → `banner` → `indexImg` → 站点图**（`SITE.ogImage`，默认 `public/img/og.png`，1200×630）。前两个如果是 `import` 进来的位图，构建期会按 1.91:1 裁成 1200×630 的 JPEG 再给出去 —— **社交媒体不渲染 SVG，webp/avif 也偶有平台抓不动**，转一版 JPEG 一并解决。字符串路径（`/img/x.jpg`、外链）没法参与裁剪：是位图就直接引用，是 SVG 就跳过。四步全落空才用站点图，不会把空白卡片发给别人。

`og:image:width/height` 只在**我们自己裁**的那条路上写（尺寸确定是 1200×630），落到站点图或原图的页面不写：尺寸随图而变，标错比不标更糟（平台会照着错的宽高裁）。`og:image:type` 从扩展名推，永远能推对。

#### robots.txt 与 AI 爬虫

`/robots.txt` 由 `src/pages/robots.txt.ts` 从 `site` 现算，除了 `Sitemap:` 还带一行 `Content-Signal`：

```
User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=no
Allow: /
```

三类用途见 [contentsignals.org](https://contentsignals.org)：`search` 建索引、`ai-input` 把内容喂给模型当回答依据、`ai-train` 训练。现在的取值是「允许被引用、不允许拿去训练」—— `ai-input=yes` 是 AI 搜索能引用到你的前提，关掉等于自己选择隐身。

文件里还留了一段**注释掉的分机器人模板**：想单独拒绝某一家就取消注释。注意给某个 UA 建了分组，它就不再读上面的 `*` 组，`Content-Signal` 要一起抄过去，否则那一家会「不受任何用途限制」。

这些行目前只有 Cloudflare 真的读，别的爬虫直接忽略 —— 写了没有副作用，但别指望它立刻生效。

> ⚠️ **部署在 Cloudflare Pages 的话**：一旦开了 Managed robots.txt，CF 会接管这个文件，并且**默认挡掉 GPTBot / ClaudeBot / CCBot / Bytespider / Google-Extended** —— 站点会在 AI 搜索里整个消失。上线后 `curl https://你的域名/robots.txt` 看一眼实际返回的内容，别只看仓库里这份。

#### 订阅源

`/rss.xml` 带 `atom:link rel="self"`（告诉聚合器这份 XML 的真身就是它）与 `lastBuildDate`（取全站最新一次改动的时间，**不是构建时刻** —— 否则每次构建都显示「刚更新」，同样的内容也会构建出不同字节，CDN 的 ETag 次次失效）。`/atom.xml` 是手写的 Atom 1.0，补 RSS 没有的 `<updated>` 与 `<id>`。

`public/_headers` 是 Cloudflare Pages 的缓存策略，用别的平台会忽略它。

### 配色

两层，按「你想要的自由度」选：

**一、四个字面颜色**（`src/config/user/appearance.ts` 的 `color`）—— 顶栏、页面底、卡片底、强调色。
给什么用什么，观感完全可控，也是默认方式。

**二、一个色相，整套派生**（`color.hue`，0~360）—— 写了它，顶栏与强调色就交给 oklch 现算：

| | 亮色 | 暗色 |
| --- | --- | --- |
| 强调色 | `oklch(0.68 0.14 H)` | `oklch(0.76 0.13 H)` |
| 顶栏色 | `oklch(0.35 0.04 H)` | `oklch(0.29 0.035 H)` |

明度和彩度是定值，变的只有色相 —— 所以整套配色永远保持同一种「深浅关系」，
不会出现某个色相下白字糊在背景里。参考值：250 蓝（约等于默认）、165 青绿、35 橙、350 玫红、285 紫。

色相在构建期就落定（`<html data-hue --hue>`），没有运行时切换，也没有额外脚本。
浏览器不支持 oklch（2023 年以前的版本）时这组规则整体不生效，配色退回第一层的字面值。

再往下还有一层：直接改 `src/styles/main.css` 顶部的 CSS 变量 —— 亮色一套、暗色一套，
改色不用碰任何组件。

### 评论

评论是**可插拔**的：主题内置三个实现，改 `type` 一行就换，页面模板、样式、加载逻辑都不用动。

| `type` | 服务端 | 适合 | 最新评论 |
| --- | --- | --- | --- |
| `'waline'` | 要自己部署（Vercel / Cloudflare Workers / Docker） | 面向中文读者，功能最全 | ✓ |
| `'artalk'` | 要自己部署（Go 单二进制，Docker / 二进制 / 包管理器） | 机器小、想少一个 Node 运行时 | ✕ |
| `'giscus'` | 不要，评论存在 GitHub Discussions | 开源项目、读者都用 GitHub | ✕ |

三段配置都在 `src/config/user/comment.ts` 里，用不到的留着不影响构建 —— 所以「三套都填好、随时切」是常态，切的时候只改 `type`。

「最新评论」是文章页底部那一行：拉全站最近几条，让读者看到别处在聊什么。它需要评论系统有公开的「按时间倒序取评论」接口，目前只有 Waline 有 —— 换到别家这一块自动不出现，不会留一个转圈的空壳。

#### Waline

默认**关闭**，因为它需要一个自己的服务端，示例站没有。三步打开：

1. 按[官方教程](https://waline.js.org/guide/get-started/)部署一个服务端（Vercel、Cloudflare Workers、Docker 都行），拿到域名；
2. 把域名填进 `src/config/user/comment.ts` 的 `comment.waline.serverURL`；
3. 把 `comment.enable` 改成 `true`。

```ts
comment: {
  enable: true,
  type: 'waline',          // 换 Giscus 就改成 'giscus'
  lazy: 600,               // 滚到距评论区 600px 时开始加载；0 = 进页面就加载
  waline: {
    serverURL: 'https://comment.example.com',
    locale: { placeholder: '说点什么吧，支持 Markdown…' },
    requiredMeta: ['nick'],   // 昵称必填、邮箱选填；要邮箱也必填就加 'mail'
    pageSize: 10,
  },
  giscus: { /* … */ },
},
```

单篇想关掉评论区，在 front matter 里写 `comment: false`。

评论是**按 URL 归属**的（Waline 的 `path` 就是文章地址）。所以改文章的 `slug` 或目录名之前先想一下 —— 地址变了，老评论不会跟过去。想让多站（比如旧域名与新域名）共用一份评论数据，就把 `waline.path` 写死成固定字符串。

**Waline 的功能都能开**，配置名和[官方客户端选项](https://waline.js.org/reference/client/props.html)一一对应，常用几个：

| 想要 | 配什么 |
| --- | --- |
| 表情包 | `emoji: ['https://unpkg.com/@waline/emojis@1.4.0/weibo', '…/bmoji']`，官方预设地址见[文档](https://waline.js.org/guide/features/emoji.html)；也可以给 `WalineEmojiInfo` 对象用自己的一套 |
| 文末「反应」 | `reaction: true`（或给一组图片地址，最多 8 个） |
| 评论排序 | `commentSorting: 'latest' \| 'oldest' \| 'hottest'` |
| 字数限制 | `wordLimit: 500`；也可以 `[10, 500]` 同时限制下限 |
| 只允许登录后评论 | `login: 'force'` |
| 匿名不许留邮箱 / 网址 | `meta: ['nick']`、`requiredMeta: ['nick']` |
| 人机验证 | `turnstileKey` 或 `recaptchaV3Key` —— **客户端和服务端要配对配**，见下面「反垃圾与人机验证」 |
| 评论里传图 | `imageUpload: true` —— 默认**关**：服务端没配存储时会退回把图片转成 Base64 塞进评论体，一条评论几十 KB 进库 |

函数型选项（`imageUploader` / `texRenderer` / `search`）过不了 JSON，要用就得在 `src/comments/client/waline.js` 里自己传 —— 这是刻意的：配置只承载数据，代码留在代码里。

所以**「GIF 表情搜索」没有开关**：它要传的是一个函数（`{ search: (word) => Promise<图片列表> }`），写成布尔值只会让人以为开了、实际什么都不发生。摆一个能写但无效的配置项，比没有它更糟。

#### 反垃圾与人机验证

评论一上线，垃圾广告是分钟级的。这几件事全在**服务端**，主题这边只负责客户端那一半：

| 事项 | 环境变量 | 说明 |
| --- | --- | --- |
| 先审后发 | `COMMENT_AUDIT=true` | 评论经管理员审核后才显示 |
| 频率限制 | `IPQPS=60` | 同一 IP 60 秒一条（默认值），`0` 不限制 |
| 反垃圾服务 | `AKISMET_KEY` | 默认自带一个公共 key，建议换成自己的；不想要设 `false` |
| 限制来源域 | `SECURE_DOMAINS` | 博客域名和评论服务端域名都写，**不带 `https://`** |

**人机验证是三处配对，少一处就打不通**：

| 在哪 | Turnstile | reCAPTCHA v3 |
| --- | --- | --- |
| 主题配置 | `waline.turnstileKey`（Site Key，公开） | `waline.recaptchaV3Key`（网站密钥，公开） |
| 服务端 | `TURNSTILE_KEY`（同一个 Site Key） | `RECAPTCHA_V3_KEY`（同一个网站密钥） |
| 服务端 | `TURNSTILE_SECRET`（Secret，保密） | `RECAPTCHA_V3_SECRET`（私钥，保密） |

三种配错的后果，症状完全不同：

- 只配客户端、服务端没配 Secret：**验证框能点，点完提交 403** —— 最容易误判成「Waline 坏了」
- 只配服务端、客户端没配 Key：页面上根本不出现验证框，评论提交直接被拒
- 两个都配：服务端按自己的顺序只验一个，另一个白配 —— 主题会在构建期警告

Turnstile 国内可直连、不用翻墙，推荐它。Site Key / Secret 在 Cloudflare 面板 → Turnstile 里申请。

配了验证码之后，如果站点有 CSP，还要额外放行：

| 验证码 | 需要放行 |
| --- | --- |
| Turnstile | `challenges.cloudflare.com`（`script-src` / `frame-src` / `connect-src`） |
| reCAPTCHA v3 | `www.google.com` 与 `www.gstatic.com` |

主题会自动给这些域名加 `<link rel="preconnect">`（`CommentProvider.origins()`），但 CSP 得你自己写在托管平台那侧。

构建期体检会拦下三类必然出问题的组合：两个验证码同时配、`requiredMeta` 里有 `meta` 里没有的项（字段不显示却要求必填，评论永远提交不了）、评论区开着却没填服务端地址。

几个实现上的选择，知道一下有好处：

- **客户端由 `comment.waline.cdn` 决定**（默认 jsDelivr 上的 `@waline/client@3`），不进依赖树、不进构建产物。换 CDN、锁版本、自托管都只改这一行，详见下面「客户端从哪加载」。
- **滚到评论区附近才加载**，首屏不为评论付流量。距离由 `comment.lazy` 控制：调大（如 `1800`）能让脚本在读者刚开始往下读时就开始预取，滚到评论区已经就绪；代价是这一页一定会拉脚本。
- **深色模式不用配**：切到暗色时 `html` 上带 `data-user-color-scheme="dark"`，Waline 自己认这个选择器。
- **验证码的生命周期由主题接管**：Waline 自己不给 Turnstile 收尾 —— 同一个容器第二次
  `render` 会被 Cloudflare 直接拒绝（并且不回调），于是第二条评论和「回复」会一直卡在
  发送中、验证框也赖在页面上不消失。`src/comments/client/turnstile.js` 包了一层
  `render`：渲染前 `remove` 掉上一个 widget，拿到 token 后再 `remove` 一次；顺手换成
  `size: 'flexible'` + `appearance: 'interaction-only'`，多数读者根本看不到验证框。
- **不用维护第二套颜色**：`main.css` 的「评论区」一节把 Waline 的 CSS 变量接到了主题令牌上，改配色、切暗色，评论区跟着走。
- **评论挂了不影响阅读**：脚本加载失败只显示一句话和「重试」，不白屏，也不把正文挤走。
- **什么都不配就什么都不渲染**：`enable: false` 或 `serverURL` 为空时，页面里连骨架屏和配置 JSON 都不出现，构建产物里也找不到评论脚本。

#### 客户端从哪加载

`comment.waline.cdn` 一行决定脚本和样式从哪儿取，默认 `'jsdelivr'`：

| `cdn` | 展开成（以 `waline.js` 为例） |
| --- | --- |
| `'jsdelivr'` | `https://cdn.jsdelivr.net/npm/@waline/client@3/dist/waline.js` |
| `'unpkg'` | `https://unpkg.com/@waline/client@3/dist/waline.js` |
| `'npmmirror'` | `https://registry.npmmirror.com/@waline/client/3.16.1/files/dist/waline.js` |

`version` 默认 `'3'`（跟着 3.x 最新版走），锁死就写 `'3.16.1'`。npmmirror 的 `/files/` 只认确定版本，写 `'3'` 这种范围会在构建期收到一条警告 —— 别的 CDN 支持范围，所以只在指向 npmmirror 时才拦。

想换到自己托管的目录或别的 CDN，把 `cdn` 写成模板。占位符：`{name}`（`@waline/client`）、`{version}`、`{file}`（包内路径 `dist/waline.js`）、`{basename}`（`waline`）、`{ext}`（`js`）：

| 场景 | 配置 | 展开成 |
| --- | --- | --- |
| 自托管，文件平铺、名字带版本 | `cdn: '/waline/{basename}-{version}.{ext}'`<br>`version: '3.16.1'` | `/waline/waline-3.16.1.js`<br>`/waline/waline-3.16.1.css` |
| 自托管，按 npm 的目录结构 | `cdn: '/vendor/waline/{file}'` | `/vendor/waline/dist/waline.js` |
| 自己的对象存储 | `cdn: 'https://cdn.example.com/npm/{name}@{version}/{file}'` | `https://cdn.example.com/npm/@waline/client@3.16.1/dist/waline.js` |

自托管就两步：`waline.js`、`waline.css` 丢进 `public/waline/`（文件名带版本号，`_headers` 里给这段路径 `immutable`），然后写 `cdn` + `version`。不用改组件。换回公共 CDN 同样是改这一行。

`{version}` 也可以不出现在模板里（`/waline/{basename}.{ext}`），那就是「文件名不带版本」的放法。名字既不是预置值、又不含占位符时（比如手抖写成 `'jsdelivr-npm'`），构建期会警告并回落到默认 CDN —— 免得悄悄拼出一串 404。

为什么做成配置而不是把文件塞进主题的 `public/`：塞进去等于让每个用主题的人都白背 300KB 第三方代码，升级 Waline 还得跟着发主题版本。模板法把「从哪取」留在使用者的配置里，主题只负责算地址。

#### 最新评论

文章页底部那一行，拉全站最近几条评论。默认关：

```ts
comment: {
  enable: true,
  recent: { enable: true, count: 5, length: 60 },  // length = 每条最多几个字
},
```

它读的是 Waline 的公开接口 `GET <serverURL>/comment?type=recent`，不需要鉴权。几个取舍：

- **滚到附近才发请求**（`rootMargin` 400px）。它是附加信息，不该和正文抢首屏的那一个往返；
- **只用 `textContent` 渲染**。评论正文是访客写的 HTML，这里一律当纯文本 —— 一块「最近在聊什么」的预览不需要富文本，省掉的正是最容易出事的那部分；
- **失败或零条就整块消失**。转圈和「暂无评论」比没有更冷清。

换到 Giscus / Artalk 时这一块自动不出现：`CommentProvider` 的 `recent` 是可选方法，没实现就返回 `null`，组件直接不渲染。

#### Artalk

和 Waline 一样要自己部署，但后端是**单个 Go 二进制**，没有 Node 运行时 —— 一台 1 核 512MB 的小机器就能跑。代价是插件生态小一些（没有人机验证），所以主题这边也不为它渲染「本站最新评论」挂件。

1. 按[官方文档](https://artalk.js.org/guide/deploy.html)部署后端，拿到地址；
2. 在 Artalk 后台「站点」里建一个站点，记住填的名字；
3. 填 `src/config/user/comment.ts`：

```ts
comment: {
  enable: true,
  type: 'artalk',
  artalk: {
    server: 'https://comment.example.com',
    site: '我的博客',          // 必须和后台建站时填的一致，否则评论落进「默认站点」
  },
},
```

`site` 这一项值得强调：Artalk 用它在同一个后端里隔离多个站点，名字对不上不会报错，评论会安静地进到另一个站点的列表里 —— 后台看不见，前端却能看到自己刚发的评论，最难查的那一类。

客户端默认从 jsDelivr 取 `artalk@2` 的 **`.mjs`** 而不是 `Artalk.js`：后者是 UMD，动态 `import()` 拿不到导出，只会往 `window` 上挂全局。国内 jsDelivr 不稳时换镜像（或直接指向自己的服务端 —— Artalk 的镜像本身就带前端资源）：

```ts
artalk: {
  js: 'https://registry.npmmirror.com/artalk/2.10.1/files/dist/Artalk.mjs',
  css: 'https://registry.npmmirror.com/artalk/2.10.1/files/dist/Artalk.css',
},
```

深色模式由主题的挂载器处理：构建期算不出「读者此刻是不是暗色」，所以挂载时读一次 `<html data-user-color-scheme>`，之后用 `MutationObserver` 盯住这个属性跟着切 —— 比在主题的切换按钮里埋一个「通知所有第三方」的钩子便宜，评论是唯一的外部依赖，不值得为它改全局逻辑。

#### Giscus

评论存在 GitHub Discussions 里，不需要服务端，但读者要有 GitHub 账号才能发言。三个 id 在 [giscus.app](https://giscus.app) 填完仓库信息后生成：

```ts
comment: {
  enable: true,
  type: 'giscus',
  lazy: 600,
  giscus: {
    repo: 'owner/repo',
    repoId: 'R_kgDO…',
    category: 'Announcements',
    categoryId: 'DIC_kwDO…',
    mapping: 'pathname',        // 和 Waline 的 path 一样按路径归属，换域名不丢评论
    reactionsEnabled: true,
    theme: { light: 'light', dark: 'dark' },   // 切深浅色时 iframe 会跟着换
  },
},
```

Giscus 没有公开的评论读接口，所以选它时最新评论挂件自动不渲染 —— 不需要额外开关。

#### 再加一个评论系统

主题把评论拆成「构建期算配置」和「运行期挂载」两层，中间只过一份 JSON。加一个系统要动四处，其中三处是各写一个文件：

1. `src/config/types.ts` —— 加一段 `XxxConfig`，在 `CommentConfig` 里加 `xxx?: XxxConfig`，`type` 联合里加 `'xxx'`，再到 `user/comment.ts` 填值；
2. `src/comments/xxx.ts` —— 实现 `CommentProvider`：`ready` 判断配好没有、`build` 把配置翻成下发 JSON，有「按时间倒序取评论」的公开接口就实现 `recent`；
3. `src/comments/client/xxx.js` —— 导出 `mount({ el, section, attempt, loadModule })`，负责把脚本拉下来挂到 `el` 上；
4. 两个注册表各加一行：`src/comments/index.ts` 的 `LIST`、`src/comments/client/index.js` 的 `MOUNTERS`。

契约在 `src/comments/types.ts`。三个现成样板各代表一种形态：Waline（ES 模块 + 自定义样式 + 计数小插件 + 公开读接口）、Giscus（传统脚本 + iframe + postMessage 换肤）、Artalk（ES 模块 + 实例方法换肤 + 全局 `MutationObserver`），照着抄就行。

想把评论放到关于页或留言板，在那一页里 `<Comments />` 即可（`path` 默认取当前页路径）。

**上线前请注意**：`serverURL` 要用 `https://` —— 站点本身是 https，指向 http 的服务端会被浏览器按混合内容拦掉（本地调试指向 `http://127.0.0.1:8360` 是另一回事）。

Waline 服务端那边至少做三件事：

| 事项 | 怎么做 | 为什么 |
| --- | --- | --- |
| 限制来源域 | `SECURE_DOMAINS=你的域名`（**不带协议**，博客和服务端两个地址都写） | 不设的话，别人可以拿你的服务端当免费评论 API |
| 抢占管理员 | 部署完立刻访问 `<serverURL>/ui/register` 注册第一个账号，之后在后台开两步验证 | 第一个注册的人就是管理员，拖着不注册等于把后台敞开 |
| 先审后发 | `COMMENT_AUDIT=true`；频率限制用 `IPQPS`（默认 60 秒一条） | 评论一旦上线，垃圾广告是分钟级的 |

评论的内容、昵称邮箱、IP、UA 都存进**你自己部署的服务端**，不经过第三方 SaaS —— 这是自建方案的好处。不想记录 UA 和归属地，服务端设 `DISABLE_USERAGENT=true` / `DISABLE_REGION=true`。如果给站点加了 CSP，记得放行当前 `cdn` 指向的域名（script / style，默认 `cdn.jsdelivr.net`）与 `serverURL`（connect）；用 Giscus 则要放行 `giscus.app`（script / frame）。

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
toc: false                     # 单篇关掉右侧目录；不写则跟随站点配置
comment: false                 # 单篇关掉评论；不写则跟随站点配置
draft: false                   # true 则不进列表 / 搜索 / RSS
banner: ../../assets/banner.webp  # 单篇 banner 图（会优化；兼容写法 bannerImg: /img/x.svg）
bannerMaskAlpha: 0.5           # 单篇 banner 蒙版（可选，0~1）
series: 从零建站              # 可选，系列名；同名的文章会连成一个系列
seriesOrder: 3                 # 系列里的次序（从 1 开始）；不写就按发布时间排
---
```

字段由 Zod 校验，写错会在构建期报错，并指出是哪一篇。`draft: true` 的文章不会进入列表、搜索索引与 RSS。

### 系列

写了 `series` 之后，那一篇的文章页会多两处东西：

1. **正文之前一份清单**，列出整个系列并标出「第 3 / 5 篇」，当前这篇不可点；
2. **底部的上下篇改成系列内的前后**，标签也变成「系列上一篇 / 系列下一篇」—— 读教程读到一半，读者想知道的是这个系列的下一步，而不是时间上更晚的那篇随笔。

同名文章只有**一篇**时不算系列，两处都不出现。`seriesOrder` 可以不写：写了序号的按序号走，没写的按发布时间排在它们后面（所以「懒得编号、只关心顺序」也能用）。

系列名直接给人看，不做 slug 化 —— 它不进 URL，改名字不会影响任何链接。

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
| `_config.yml` | `src/config/user/*.ts` |
| `_data/links.yml` | `src/config/user/links.ts` |
| `layout/*.ejs` | `src/pages/*.astro` + `src/components/*.astro` |
| `languages/*.yml` | `src/i18n.ts` |
| `hexo-generator-searchdb` | `src/pages/searchindex.json.ts` |

URL 形态保持一致（`/posts/<文件名>/`、`/tags/<名称>/`、`/page/2/`），旧链接不会 404。

`slug` 字段也照搬 Hexo 的语义 —— 写了就替换文件名那一段。区别在于主题会把中文转成拼音（Hexo 原样保留中文），
所以**从中文文件名的 Hexo 站迁过来，文章链接会变**，需要在新站配一批 301，或者给每篇补一个和旧链接一致的 `slug`。

## 取舍：原版有哪些，这里为什么没有

| 原版功能 | Flux | 原因 |
| --- | --- | --- |
| 评论（13 种第三方服务） | 内置 3 种（Waline / Artalk / Giscus），可插拔 | 13 套适配是插件该干的活；这里给的是接口 + 三个样板，要第四种照着抄 |
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
├── config/              # ★ 配置
│   ├── index.ts         #   总出口：合并默认值 + 你的值，导出 SITE
│   ├── types.ts         #   字段类型与说明
│   ├── defaults.ts      #   出厂默认值（升级时被替换）
│   ├── merge.ts         #   深合并规则（30 行）
│   └── user/            #   ★ 你的配置：site / appearance / content / comment /
│                        #     analytics / footer / links / pages
├── i18n.ts              # 界面文案
├── content.config.ts    # 集合与 front matter 校验
├── content/posts/       # 文章
├── assets/              # 参与优化的图片源文件（封面、banner）
├── integrations/lqip.mjs # 占位色集成：算每张图的主色调 → virtual:flux-lqip
├── layouts/BaseLayout.astro
├── components/          # Navbar / Banner / Board / PostCard / PostList /
│                        # ArchiveList / Toc / Pagination / SearchModal /
│                        # Comments / RecentComments / Icon / Footer
├── pages/               # 文件即路由（外加 llms.txt / llms-full.txt / atom.xml /
│                        # rss.xml / searchindex.json / robots.txt 六个端点）
├── plugins/markdown.js  # 标题锚点 / 代码块工具栏 / 外链 / 邮箱混淆 / 防盗链
├── plugins/shiki.js     # 围栏 meta：行高亮 {1,3-5}、nolinenos
├── scripts/theme.js     # 顶栏、深色模式、目录高亮、复制、回顶、邮箱还原
├── scripts/search.js    # 站内搜索
├── scripts/comments.js  # 评论区加载器（懒加载 / 失败重试，不认具体哪一家）
├── scripts/recent.js    # 最新评论挂件（滚到附近才拉，只用 textContent）
├── comments/            # 评论系统抽象层
│   ├── types.ts         #   契约：CommentProvider / CommentPayload / RecentCommentsSpec
│   ├── index.ts         #   注册表 + resolveComments()
│   ├── waline.ts        #   Waline 的构建期实现
│   ├── giscus.ts        #   Giscus 的构建期实现
│   ├── artalk.ts        #   Artalk 的构建期实现
│   └── client/          #   浏览器里怎么挂（每家一个文件）
├── utils/posts.ts       # 取文章 / 排序 / 分页 / 相关文章 / 阅读统计（含构建期缓存）
├── utils/slug.ts        # URL 规范化（含中文转拼音）
├── utils/image.ts       # 图片两种写法的统一处理
├── utils/lqip.ts        # 图片 → 占位色渐变（读 virtual:flux-lqip）
├── utils/list-pages.ts  # 哪些路径算「列表页」（sitemap 与 noindex 共用，零依赖）
├── utils/pages.ts       # 页面开关 → 路径 / 导航项
├── utils/seo.ts         # 分享封面挑选与 JSON-LD 生成
└── styles/main.css      # 全部样式（变量分亮暗两套）

```

## 性能

没有第三方运行时依赖：图标是内联 SVG，字体走 `system-ui` 栈（零字体请求），没有图标字体，也没有内置的分析脚本 —— 访客统计是可选的，默认关（见上文「访客统计与站长验证」）。首屏必须的请求只有 5 个：HTML、一份 CSS、banner 图、主题脚本、预取脚本；卡片封面是 `loading="lazy"`，滚到才取。

| 资源 | 原始 | gzip | 请求数 |
| --- | --- | --- | --- |
| 首页 HTML（6 张卡片，含内联 CSS） | 63 KB | 14 KB | 1 |
| 文章页 HTML（含内联 CSS） | 86 KB | 20.5 KB | 1 |
| 样式表（内联进 HTML，不再单独请求） | 37 KB | 7.9 KB | 0 |
| 主题脚本（顶栏 / 深浅色 / 目录 / 复制 / 灯箱） | 8.7 KB | 3.4 KB | 1 |
| 预取脚本 | 2.4 KB | 1.1 KB | 1 |
| 评论脚本（懒加载，不参与首屏） | 4.4 KB | 2.0 KB | 0 |
| 搜索索引（悬停才取，不参与首屏） | 61 KB | 28 KB | 0 |
| banner 默认图（SVG） | 2.5 KB | 0.8 KB | 1 |

几个刻意的取舍：

- **导航用悬停预取**（`astro.config.mjs` 的 `prefetch`）。鼠标停在链接上就把目标页取回来，点击几乎是即时的。用 `hover` 不用 `viewport`：后者会在每个页面加载后把所有站内链接拉一遍，归档页就是一百多个请求。不想预取某条链接，在 `<a>` 上写 `data-astro-prefetch="false"`。**唯一的例外**是文章页底部的「下一篇」，它单独标了 `viewport` —— 理由见下面几条。
- **文章页预连接评论服务端**，握手（跨境约 100~300ms）不算在「滚到评论区」那一刻里。
- **评论是懒加载的**：从 CDN / 自托管取，`lazy` 控制提前多少像素开始。
- **搜索索引不参与首屏**：鼠标移到搜索按钮或弹层打开时才开始取，敲字时索引通常已经就位。
- **CSS 内联进 HTML**（`build.inlineStylesheets: 'always'`）。样式表是渲染阻塞的，外链意味着首屏要多一个完整往返：文章页 HTML 才 12KB，省下的从来不是带宽，是那一跳。内联后 HTML 到手即可绘制。代价是每页 HTML 多 8KB（gzip 后）—— 但 HTML 设的是 `max-age=0, must-revalidate`，回访时 304 不带正文，内联的 CSS 也不会真的重传。**样式表长到几十 KB 时应当改回 `'auto'` 并改做「关键 CSS 内联 + 其余异步」**，这套做法只适合现在这个体量。
- **首屏大图的 preload 覆盖所有页面**，不只是首页。banner 写成字符串路径（`/img/x.webp`）时图是 CSS 背景加载的，浏览器要等 CSSOM 建好才发现它，比 `<img>` 晚一拍，所以 head 里补一条 `<link rel="preload" as="image">`；用 `import` 引入的图由 `<Image>` 输出 `<img fetchpriority="high">`，不走这条。文章页会把自己的封面传进来，否则会 preload 一张这页根本不用的图，白占首屏带宽。
- **「下一篇」用 `viewport` 预取**（文章页底部那一条）。手机上不会触发 hover，而「读到底 → 点下一篇」是文章页最确定的下一步：滚到它就取，其余链接仍然只在悬停时取，不会误伤流量。
- **统计脚本只做 `dns-prefetch`，不做 `preconnect`**。后者要立刻完成一次 TCP + TLS 握手，会占掉一条连接，而统计是 `async` 的非关键资源 —— 那几毫秒更该留给 banner 图。`dns-prefetch` 只花一次域名查询，代价接近零。
- **没启用 experimental 的 `clientPrerender`**（用 Speculation Rules 把目标页在后台完整渲染）。它确实更快，但会执行目标页的脚本 —— 评论区可能提前发请求、统计也会被多记一次。预取 HTML 已经能消掉大部分等待，不值得为这点差距换来副作用。

## 已知限制

- 封面与 banner 已走 `astro:assets`（见上方「配置」）。图片要放在 `src/assets/` 并用 `import` 或 `cover:` 引用才会被优化；`public/` 下的图永远原样输出 —— 这是 Astro 的规则，不是主题的限制。
- 目录取 h2 / h3 / h4，h5 以下不收（缩到第五层已经读不清了）。单篇可用 `toc: false` 关掉。
- 搜索是线性扫描 + 分档权重，没有分词。文章量上千后建议换 [Pagefind](https://pagefind.app/)。
- 分享封面不会「生成」：挑一张现成的图裁成 1200×630 的 JPEG 给出去（社交平台只认 1.91:1，
  原图会被居中裁掉一条）。挑的顺序是 **`cover` → `banner` → `indexImg` → 站点图**，
  前两个要是 `import` 进来的位图才会参与裁剪，字符串路径（含 SVG）直接原样用或跳过。
  **没有做「标题卡片」** ——
  在图上画标题需要一个能把中文字形转成路径的渲染器，外加一份 5~10MB 的中文字体：
  sharp 自己画 SVG 文本靠系统字体，在 CI 上会变成一排方框。这个功能值得做，但不该以
  「主题多背一份字体」为代价，等它做成可选（自己提供字体 + 开关）再说。
- 图片优化只管 `cover` / `banner` / 配置里 `import` 进来的图。写成字符串（`/img/x.png`）的资源会被原样引用 —— 那是留给 Hexo 迁移与 `public/` 里现成图片的兼容路径。
- 相关文章只在有标签或分类重合时才出现。文章很少或从来不打标签时，这一块会一直空着。
- 界面文案目前只有中文，`src/i18n.ts` 已按字典组织，加语言只需扩一个对象。
- 访客统计内建三家（GA4 / Umami / Clarity），够用但不打算做成「什么统计都支持」。想加第四家（Plausible、百度统计、51.LA、Fathom…）：`config/types.ts` 加个类型 + `config/defaults.ts` 和 `user/analytics.ts` 填值 + `BaseLayout.astro` 里补一段标签，三处合计十几行 —— 它们本质上就是一段 `<script>`，套一层注册表反而比直接写更绕。Bing 没有客户端统计脚本，它那一项是站点认领，不是统计。
- 评论的客户端默认从公共 CDN 加载，离线环境或内网部署会失败（页面上会给出提示与重试）。要完全自托管，把 `waline.js` / `waline.css` 放进 `public/waline/`，然后 `cdn: '/waline/{basename}-{version}.{ext}'` + `version: '3.16.1'` —— 见上文「客户端从哪加载」。`_headers` 里给这段路径 `immutable` 缓存，升级只换文件、不失效缓存。

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
