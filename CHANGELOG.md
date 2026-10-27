# Changelog

本项目的所有重要改动都记录在这里。

格式参照 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Fixed

- **首页顶栏在 banner 上的可读性**：未滚动时顶栏是透明的，导航文字直接压在图上，
  而「选中项的 accent 蓝」在浅色照片上几乎看不见（白色也只是勉强）。
  现在给顶栏补了一层从上到下的渐变压暗（`color.navbarScrim`，0~1，默认 0.35），
  透明态下的悬停与选中改成「白色字 + 半透明白底」，滚动变实色后自动回到 accent 蓝。

  用渐变而不是整条实色底，是因为实色会在图上切出一条硬边；这层还和实色顶栏
  做了同速率的交叉淡化，滚过触发点时不会一暗一亮。`navbarScrim: 0` 可以完全关掉，
  此时仍有极浅的文字投影兜底。

## [2.0.0] - 2026-10-27

### Changed

- **BREAKING：配置从单文件改成目录，分成「类型 / 默认值 / 你的值」三层。**

  | 以前 | 现在 |
  | --- | --- |
  | `src/config.ts`（476 行：370 行类型 + 100 行值） | `src/config/types.ts` 类型、`defaults.ts` 默认值、`user/*.ts` 你的值 |
  | `src/data/links.ts` | `src/config/user/links.ts` |

  原来的问题是「一个文件里塞了三件不同的事」：类型定义（主题作者维护）、默认值（出厂设置）、
  实际配置（使用者要改的十几行）。想改站名要滚过 370 行 interface；升级主题时要先把自己的值
  复制出来、整目录覆盖、再贴回去 —— 忘一处就丢配置。

  现在 `src/config/user/` 是使用者的独立目录，主题升级只替换 `types.ts` / `defaults.ts` /
  `merge.ts` / `index.ts`，`user/` 原样保留。**升级不再需要手工还原配置。**

  拆法按「你要解决的问题」而不是配置树：`site.ts`（站名 / 导航 / 头像）、`appearance.ts`
  （banner / 配色 / 暗色）、`content.ts`（卡片 / 文章页开关 / 分页 / 搜索）、`comment.ts`、
  `links.ts`。使用者只写和默认值不同的部分，其余继承。

  迁移旧配置：把 `SITE` 里你改过的项搬到对应的 `user/*.ts`，用
  `export default defineConfig({ ... })` 包起来即可；没改过的项不用搬。

- **对外 API 不变**：仍然是 `import { SITE } from '../config'`（目录的 `index.ts`），
  组件、页面、评论模块一行都没改。类型也照旧从同一个地方导出。

- 默认值不再引用 `src/assets/` 里的示例图，改用 `public/` 路径。以前 `config.ts` 里
  `import bannerAsset from './assets/banner.webp'`，导致**没有 `src/assets/` 目录的站点
  （比如 figma 拷图放 public 的）升级时构建直接失败**，得手工删 import。现在默认值零依赖示例资源，
  想要图片优化就在自己的 `user/appearance.ts` 里 import。

- RSS 摘要长度从写死的 160 字变成配置项 `rss.excerptLength`（默认 300）。

### Added

- **`defineConfig()`**（`src/config/merge.ts`）：配置的类型检查入口。字段名拼错、类型不对、
  `type` 填了不存在的评论系统，`npm run check` 当场报错。这一点很关键 ——
  `astro build` **不做类型检查**，写错的配置会被静默忽略（v1.5.0 升级生产站时，
  `comment.waline.js` 这个字段已被改名，构建照常成功，自托管文件白放了两天）。

- **配置体检**（`src/config/index.ts`）：构建时检查几类「合法但显然不对」的配置，集中在
  构建输出里说一次，不刷屏：评论区开了却没填 `serverURL` / `repo`、`serverURL` 不像地址、
  `ogImage` 指向 SVG（社交平台不渲染）、`pageSize < 1`、`nav` 为空。只提示，不阻断构建。

- **深合并**（`src/config/merge.ts`，零依赖）：对象逐层合并、数组整体替换、`undefined`
  不覆盖默认值、图片资源对象整体替换。同一块配置可以分在两个文件里写。

- **首页 banner 补齐**（`banner` 段）：打字机副标题（`typing`，可调速度 / 光标 / 循环 / 延迟）、
  视差滚动（`parallax`）、移动端最小宽高比（`minRatio`，防竖屏把横图裁得太狠）、
  多句轮播（`slogan` 给数组）。两个动画都是手写零依赖（`src/scripts/banner.js`），
  并且**尊重系统的「减少动态效果」**：读者开了这个偏好就整段跳过，不做动画。

  同时把 banner 彻底变成「配出来的」而不是「改出来的」：`enable` 控制整块要不要、
  `pageHeight` 给第 2 页起的列表页单独设高度（原来写死在模板里的 `50vh`）、
  `img` 不写即纯色底。以后调整首页第一屏，不用再动 `Banner.astro` 或页面文件。

- **`/` 开头的图片路径纳入构建体检**：`banner.img`、`postBanner.img`、`ogImage`、
  `index.defaultImg` 指向的文件在 `public/` 里不存在时，构建输出会直接点名是哪个字段。
  这类错误原本是静默的 —— 页面照常生成，只是那一块空着（banner 退化成纯色），
  要肉眼比对才发现。

- **首屏图 preload**：banner 用字符串路径（`/img/x.webp`）时，图是 CSS background 加载的，
  浏览器要等 CSSOM 解析完才发现它，比 `<Image>` 生成的 `<img>` 晚一拍。现在按需补一条
  `<link rel="preload" as="image" fetchpriority="high">`，只出现在带 banner 的列表页。

- **CI**（`.github/workflows/ci.yml`）：push 到 main 和每个 PR 都跑 `npm ci` →
  `npm run check` → `npm run build`。类型问题在合并前暴露，而不是部署后发现。

- **sitemap 输出 `lastmod`**（`scripts/sitemap-lastmod.mjs`）：取文章 front matter 的
  `updated`（没有则取 `date`），不是构建时间 —— 所以每天重建不会把日期刷成今天。
  页面清单仍由 `@astrojs/sitemap` 生成（它认得所有分页路由），我们只补一列时间。
  URL 匹配不上就跳过，最坏情况退回 v1.5.0 的行为，不会漏条目。

### Fixed

- `main.css` 的分节编号断了（9 之后直接跳到 11），重新编号为 1–21。

- **Waline 的客户端配置补齐到官方 props 表**，对着
  [官方文档](https://waline.js.org/reference/client/props.html)逐项核过：

  | 项 | 之前 | 现在 |
  | --- | --- | --- |
  | `wordLimit` | 只接受数字 | `number \| [最小, 最大]` |
  | `emoji` | 只接受地址字符串 | 也接受 `WalineEmojiInfo` 对象（自己的一套表情，给目录 + 文件名列表即可） |
  | `search` | 有个布尔开关 | **删掉** —— 它要传的是函数，写 `true` 什么都不会发生 |
  | `lang` 映射 | 缺西班牙语 | 补 `es` |

- **人机验证的域名补齐 preconnect**：配了 Turnstile 时提前连
  `challenges.cloudflare.com`，配了 reCAPTCHA v3 时连 `www.google.com` + `www.gstatic.com`。
  这两个脚本是评论区渲染后才注入的，等那时再握手，读者已经点开评论框了。

- **构建期体验新增两条**（都是「合法但必然出问题」的组合）：
  - `turnstileKey` 与 `recaptchaV3Key` 同时配 —— 服务端只按自己的顺序验一个，另一个白配
  - `requiredMeta` 里有 `meta` 里没有的项 —— 字段不显示却要求必填，评论永远提交不了

- README 补「反垃圾与人机验证」小节：四件服务端防护（审核 / 限速 / Akismet / 来源域）+
  验证码**三处配对**表（主题配置 / 服务端 KEY / 服务端 SECRET）+ CSP 要放行的域名。


## [1.5.0] - 2026-10-26

### Added

- **评论系统改成可插拔，新增 Giscus 实现**。`config.ts` 的 `comment` 段多了一个 `type`
  字段，改一行就换评论系统，页面模板、样式、加载逻辑一律不动：

  | `type` | 服务端 | 评论数 | 浏览量 |
  | --- | --- | --- | --- |
  | `'waline'` | 要自己部署 | ✓ | ✓ |
  | `'giscus'` | 不要，存在 GitHub Discussions | ✕ | ✕ |

  做法是把评论拆成两层，中间只过一份 JSON：构建期由 `src/comments/<name>.ts` 把配置翻成
  `{ js, css, init, lazy }` 写进页面，运行期由 `src/scripts/comments.js` 负责懒加载、
  骨架屏、失败重试（它不认识任何一家），再按 `type` 派发给 `src/comments/client/<name>.js`
  去挂载。加第三个系统是四步：配置加一段、写一个 provider、写一个 mounter、两个注册表各加一行，
  契约在 `src/comments/types.ts`。

  顺带解决了两处「模板里写死 Waline 类名」的地方：评论数徽标的占位 class 改由 provider 给
  （`countClass`，不给就说明这家不暴露评论数，徽标整枚不渲染）；样式里那条「计数空着就藏起来」
  的规则也从 `.waline-comment-count` 改成了通用的 `:has(span:empty)`。

- **浏览量统计**。`waline.pageview: true` 后，文章页「最后更新于」下面多一行「阅读 N 次」。
  用的是 Waline 单独的 `pageview.js`（gzip 不到 1KB），在 `window.load` 之后才发请求。
  **和评论区解耦**：评论关掉、懒加载从没触发，阅读数照样统计 —— 所以「不要评论、只要阅读数」
  这种配法是成立的。地址由 `cdn` 模板一并算出，不用单独指。

- **客户端地址可配置**（`comment.waline.cdn` + `version`）。以前脚本地址是写死的
  jsDelivr 链接，想换国内镜像或自托管得改组件。现在只改配置一行：

  | `cdn` | 展开成 |
  | --- | --- |
  | `'jsdelivr'`（默认）/ `'unpkg'` | `https://cdn.jsdelivr.net/npm/@waline/client@3/dist/waline.js` |
  | `'npmmirror'` | `https://registry.npmmirror.com/@waline/client/3.16.1/files/dist/waline.js` |
  | 模板字符串 | 占位符 `{name}` `{version}` `{file}` `{basename}` `{ext}`，见 README |

  自托管就是 `cdn: '/waline/{basename}-{version}.{ext}'` + `version: '3.16.1'`，
  `waline.js` / `waline.css` / `pageview.js` 由同一个模板展开。名字写错（既不是预置值、
  又不含占位符）或 npmmirror 配了范围版本，构建期会警告并在必要时回落到默认 CDN。
  这样主题里不再有任何写死的第三方地址，也不用把 300KB 的客户端塞进 `public/` 让所有
  使用者一起背。

- Waline 的选项补齐到官方那一套：`commentSorting`、`noRss`、`recaptchaV3Key`、
  `turnstileKey`；`emoji` / `reaction` 现在也接受 `true`（用内置那套）。函数型选项
  （`imageUploader` / `texRenderer` / 自定义 `search`）过不了 JSON，仍然要改 mounter。

### Changed

- **导航改成悬停预取**（`prefetch: { prefetchAll: true, defaultStrategy: 'hover' }`）。
  静态站导航的感知延迟不是带宽，是「点下去才开始拿文档」那一两个往返；悬停到点击之间
  通常有 100~300ms，正好够把目标页的 HTML 取回来，其余资源本来就在长缓存里。
  代价是每页多一个 1.1KB（gzip）的预取脚本。不想预取某条链接就在 `<a>` 上写
  `data-astro-prefetch="false"`。

  用 `hover` 而不是 `viewport`：后者会在页面加载后把所有站内链接拉一遍，归档页
  一百多篇就是一百多个请求。

- **文章页预连接评论服务端**。`<link rel="preconnect">` 由 provider 的 `origins()`
  给出（Waline 是服务端 + 客户端 CDN，Giscus 是 `giscus.app`），只出现在真正会用到的
  文章页。评论脚本是懒加载的，等它开始下载再握手就白等一个 RTT（跨境约 100~300ms）。

- **搜索索引提前一步取**。原先要等读者敲下第一个字才 `fetch('/searchindex.json')`
  （中文站动辄几十 KB）；现在鼠标移到搜索按钮上、或弹层一打开就开始取，
  第一次搜索不会卡在等索引上。

- **`comment.waline.lazy` 搬到 `comment.lazy`，并从布尔改成像素数**（默认 `600`）。
  `0` 表示不懒加载。调大（如 `1800`）能让读者刚开始往下读就预取脚本，滚到评论区时已经就绪；
  原先只能二选一「进页面就拉」或「600px」，中间没有档位。
  **升级注意**：老配置里 `waline.lazy` 不会报错，会被忽略 —— 默认值仍是 600，行为不变；
  想改距离就把它挪到外面。

- 文章页的评论区判定收敛到 `hasCommentForm()`，不再在模板里写
  `SITE.comment.type === 'waline' && Boolean(SITE.comment.waline.serverURL)`；
  少配一项时构建期会打印一条明确的警告，而不是静默不渲染。

### Fixed

- 评论区标题的计数徽标在 Waline 回填数字后仍可能不显示 —— 上一版靠 `:has()` 判断「数字空着
  就藏起来」，规则盯的是具体类名，换评论系统就失效。现在只判断「里面的 span 还空着」。

## [1.4.0] - 2026-10-26

### Added

- **评论区接入 Waline**。文章页文末现在可以挂一个真正的评论区：配置在 `config.ts` 的
  `comment` 段，填 `waline.serverURL` 并打开 `enable` 即生效，单篇可用 front matter
  的 `comment: false` 单独关掉。原版 Fluid 支持 13 种评论服务，这里只接 Waline ——
  多出来的 12 套适配属于插件市场，不属于主题。

  几个刻意的取舍：

  - **客户端从 CDN 加载，不进依赖树**（`@waline/client@3` 的 `waline.js` / `waline.css`）。
    地址写在配置里，锁版本、换 CDN、自托管都只改两行；两个地址必须同版本。
  - **滚到评论区附近才加载**（IntersectionObserver，提前 600px）。评论是主题里唯一的
    运行时外部依赖，首屏不该为它付流量；`lazy: false` 可以关掉这套。
  - **颜色不另起一套**。`main.css` 新增「评论区」一节，把 Waline 的 CSS 变量桥接到主题
    令牌上：改配色、切暗色，评论区自动跟随，不用维护第二份色板。暗色也不需要额外规则 ——
    Waline 往 `<html>` 上写变量，而我们在 `.comment-section` 上直接赋值，直接赋值恒赢继承值。
  - **加载中给骨架屏，失败给重试**。CDN 挂掉时显示一句话和一个「重试」按钮，不白屏、
    不把正文挤走；重试会带 `?retry=N` 换个模块 key，否则浏览器会复用上一次失败的 Promise。
  - **评论里默认不能传图**（`imageUpload: false`）。上传是写入型攻击面，服务端没配存储时
    点了还会报错，要用再开。
  - 评论区标题右侧显示评论数（Waline 回填 `.waline-comment-count`）；浏览量统计没接，
    主题里没有放这个数字的位置。

- 新增 `src/components/Comments.astro`、`src/scripts/comments.js`，以及 `comment` 图标。

### Fixed

- `npm run check` 终于能跑了。`package.json` 里早就挂着这条脚本，但 `@astrojs/check`
  和 `typescript` 从来没装过 —— 一执行就静默退出，等于没有类型检查。现在补上这两个
  devDependency，当前 **0 error / 0 warning**（39 个文件）。

### Changed

- `main.css` 节号重排：评论区插在「文末版权 / 上下篇」之后成为第 12 节，后续各节顺延一位。
- 示例文章〈改造与扩展〉的「接评论」一章改写为「换评论系统」：先讲内置的 Waline 怎么开，
  再讲换成 giscus 时动哪一行。

## [1.3.2] - 2026-10-25

### Fixed

- **页脚不再浮在半空**。友链、分类、标签、归档，以及内容不满一屏的分页页，页脚此前
  紧跟着内容末尾，页面底下露出一大块背景色。现在 `body` 是纵向 flex 容器、`main`
  吃掉剩余高度（`flex: 1 0 auto`），页脚被压到视口底部，页脚自身也不参与压缩。

  原版 Fluid 并没有这套机制：它的 `html, body` 只是 `height: 100%`，页脚同样在正常
  文档流里，全靠每页的 banner（首页 100vh、其他页 40vh）把内容撑高才看不出来。
  换句话说这不是「对齐原版」，而是把标准的 sticky footer 补上，顺带让 banner 高度
  变成一个可以自由调小的参数。打印样式里改回普通块流，避免多出空白页。

## [1.3.1] - 2026-10-25

### Fixed

- 分享图改成 **1200×630 的 JPEG**。1.3.0 直接把文章的 webp 封面塞进 `og:image`：
  格式上仍有个别平台抓不动 webp，比例上 3:2 / 16:9 的原图会被平台居中裁掉一条，
  标题恰好压在边缘时很难看。现在构建期按 `fit: cover` 裁一版 1200×630 的 JPEG
  专供社交平台，页面里的 banner 依旧是 webp —— 读者走快的那条路，爬虫走兼容的那条。

## [1.3.0] - 2026-10-25

### Added

- 补齐社交分享与结构化数据。此前页面只有半套 Open Graph：没有封面图、没有 locale，
  Twitter 卡片声明了 `summary_large_image` 却没有 `twitter:image`，分享出去是一张纯文字卡。
  现在 `og:*` / `twitter:*` 成对输出，封面与地址一律绝对化。
- 新增 JSON-LD：首页输出 `WebSite`，文章页输出 `BlogPosting`（发布时间、更新时间、
  作者、分类、标签、字数、`mainEntityOfPage`），搜索引擎能直接拿到结构化信息。
- 文章页补 `article:published_time` / `article:modified_time` / `article:author` /
  `article:section` / `article:tag`，补 `<meta name="author">`。
- 补 `theme-color`（亮暗各一条），移动端浏览器地址栏跟随主题。
- 新增配置项 `SITE.ogImage` 与 `public/img/og.png`（1200×630 分享封面）。
  社交平台不渲染 SVG，所以只有位图封面会被采用，SVG 一律回落到这张站点图。
- 新增 `src/utils/seo.ts`：绝对地址补全、分享封面挑选、JSON-LD 生成三个纯函数。
- **分页补齐到归档 / 分类 / 标签**。归档此前把整份时间线铺在一页里，分类页则把某个
  分类的所有文章一口气排下来 —— 文章一多就是无穷滚动。URL 形态沿用 Hexo：第 1 页是
  列表首页，第 N 页是 `<base>/page/N/`（`/archives/page/2/`、`/categories/指南/page/2/`）。
  归档条数由新配置 `archive.pageSize` 单独控制（时间线一行一篇，比卡片密），写 0 表示不分页。
- **文末「相关文章」**：标签命中计 3 分、分类命中计 2 分，同分按时间倒序，取前 3 篇。
  一篇得分为 0 时整块不渲染 —— 与其拿「都发在这个博客」当相关性，不如不显示。
  开关是 `SITE.post.related`。
- front matter 新增 `cover` / `banner` 两个 `image()` 字段，写相对本文档的图片路径即可
  参与优化（见下方 Changed）。

### Changed

- `BaseLayout` 的支持面扩大：新增 `image`（分享封面）、`article`（文章的分享元信息）、
  `jsonLd`（结构化数据）三个可选 prop，页面不传时行为与之前完全一致。
- **封面与 banner 改走 `astro:assets`**：构建时按需生成多档宽度的 webp（卡片 240/400/560，
  banner 720/1080/1440/1920）并补上 `srcset`，移动端不再下载桌面尺寸的大图；首屏 banner
  还带上了 `fetchpriority="high"`。配置里的 `banner.img` / `postBanner.img` /
  `index.defaultImg` 现在也接受 `import` 进来的本地资源。
- 旧的 `indexImg` / `bannerImg` 字符串写法保留，用于 `public/` 里现成的图片与 Hexo
  迁移场景 —— 代价是不参与优化，原图多大就发多大。
- 示例文章全部改用 `cover` 字段，示例图从 SVG 换成位图源文件放在 `src/assets/`。
  唯独 `guide/url-and-slug` 故意留着 `indexImg`，让两条路径都出现在构建产物里。

### Fixed

- 分页组件的 `base` 语义改为「列表首页地址」（`/`、`/archives/`、`/categories/前端/`），
  不再靠 `/page` 后缀做字符串替换 —— 后者在中文分类名带编码时拼不出正确地址。

## [1.2.0] - 2026-10-25

### Added

- 文章 URL 可以用 front matter 的 `slug` 指定了。写一段只替换文件名（子目录保留），
  写多段（含 `/`）接管整条路径；不写就沿用文件路径 —— 有子目录时子目录照样进 URL。
  此前 URL 完全由文件名决定，想改地址只能改文件名。
- URL 统一规范化：全小写，中文按词组转拼音（`重庆` → `chong-qing`），空格转 `-`，
  标点与 emoji 丢弃，地址里只剩 `[a-z0-9-/]`。中文名文件不再生成
  `/posts/%E4%B8%AD%E6%96%87/` 这种地址。整段转写不出任何字符时会报错并提示写 `slug`。
- 两篇文章算出同一个 URL 时**构建失败**，报错列出冲突的文件与路径。
  以前是后一篇静默覆盖前一篇：两篇都进列表和 sitemap，点进去却只有一个页面。
- 新增构建期依赖 `pinyin-pro`（只跑在构建里，浏览器产物仍为零依赖）。
- 新增示例文章《URL 与 slug》，放在 `src/content/posts/guide/` 子目录下，本身就在演示
  「目录进 URL，`slug` 只替换最后一段」—— 地址是 `/posts/guide/post-url/`。

### Fixed

- `id` 不再被 front matter 的 `slug` 劫持。Astro 的 glob loader 默认在检测到 `slug`
  时直接拿它当 entry id，目录信息因此丢失（`2026/a.md` + `slug: b` 会让 id 变成 `b`），
  依赖路径计算的 URL 规则会少一层前缀。现在 `generateId` 强制 id 只由文件路径决定。

## [1.1.3] - 2026-10-25

清理 i18n 里的半成品接口：有一批文案键从定义起就没被任何地方引用，
还有一个 `NavItem.labelKey` 字段只存在于类型里、组件从来没读过。

### Changed

- `config.ts` 的 `nav` 改用 `labelKey` 引用 `i18n.ts` 的文案，
  `Navbar` 也真的会读 `labelKey` 了（`label` 仍可用于单项覆盖）。
  之前这个字段是个假 API —— 类型里写着、注释里说着，代码里没人处理。
- 移动端菜单按钮展开时换成叉形图标，`aria-label` 同步变成「关闭菜单」。
  两套文案由组件通过 `data-label-open` / `data-label-close` 注入，
  和搜索框的 `data-text-*` 是同一套做法。
- `i18n.ts` 补充 `friends` / `about` 两个键，让导航完全走字典。

### Removed

- `i18n.ts` 里五个从未被引用的键：`readMore`、`searchClose`、`searchHint`、
  `copyrightHeading`、`copyrightLink`。对应的界面本来就没做，留着只会误导后来改的人。

### Fixed

- 删掉 `Navbar.astro` 里那段控制主题图标显隐的 scoped style。它**从来没生效过** ——
  Astro 会给组件 `<style>` 的选择器加上作用域属性，而图标是 `<Icon>` 子组件渲染的 `<svg>`，
  不带父组件的 scope，`.icon-sun { display: none }` 匹配不到，亮色下太阳和月亮才同时露出来。
  1.1.2 已经在 `main.css` 用全局规则补齐了功能，这一版把组件里那份失效的重复实现清掉，
  并在注释里写明「这类规则不能写在组件样式里」。

## [1.1.2] - 2026-10-25

### Changed

- 去掉中文名「流变」，全站统一用 **Flux**。README 标题、首段与关于页同步，
  连带删掉「名字取自拉丁语 fluxus」那句解释。
- 搜索框的两条提示文案（「输入关键词开始搜索」「没有找到相关文章」）原来写死在
  `scripts/search.js` 里，改为由 `SearchModal.astro` 通过 `data-*` 注入 `i18n.ts` 的文案，
  脚本里只保留兜底默认值。

### Fixed

- 顶栏的主题切换按钮里，太阳和月亮两个图标一直同时显示、并排挤在一起。
  补上显隐规则：亮色显示月亮（点了进暗色），暗色显示太阳（点了回亮色），
  靠根元素的 `data-user-color-scheme` 切换，无 JS 参与、无首帧闪烁。
- 关于页有两个 `<h1>`（banner 标题与作者名各一个），改为 banner 用 `div`，只留作者名；
  404 页则相反 —— 缺 `<h1>`，把「404」那行改成标题标签。
- 关于页的 `.about-avatar` / `.about-name` / `.about-bio` 只有 class 名、没有对应样式，
  头像不居中、署名用浏览器默认字号。补齐：头像圆形居中带投影、署名 1.5rem、
  简介灰字，正文恢复左对齐。

## [1.1.1] - 2026-10-25

### Fixed

- 目录里出现超长标题时，右侧栏会按内容的 min-content 顶宽栅格轨道，把中间的正文卡片挤窄；
  滚动高亮到该条目时，`.is-active` 加粗改变文字宽度，列宽跟着变，表现为左右抖动。
  三栏改为 `minmax(0, 2fr) minmax(0, 8fr) minmax(0, 2fr)`，并给 `#board` 与 `.sidebar`
  补上 `min-width: 0` —— 轨道宽度只由 fr 决定，长标题在栏内以省略号截断。

### Changed

- `astro.config.mjs` 的 `site` 指向示例站 `https://astro-theme-flux.pages.dev`（Cloudflare Pages）。
  RSS、sitemap、canonical、OG 从此输出正确的绝对地址。
- 新增 `/robots.txt`：由 `site` 现算，带 sitemap 地址，域名只维护一处。
- 新增 `public/_headers`：Cloudflare Pages 的缓存策略 —— `_astro/*` 带 hash 永久缓存，
  HTML 每次回源校验，图片 30 天，RSS 与搜索索引 1 小时。
- README 顶部加在线预览入口，并说明 fork 后要改 `site`。

## [1.1.0] - 2026-10-25

这一版的主题是「把文章页补齐到原版的水准」：右侧目录回来了，元信息搬到了 banner 上，
版心、字号、行高全部对齐 hexo-theme-fluid。运行时依赖数量仍然是 0。

### Added

- **文章页右侧目录**：构建期用 content collections 的 `headings` 生成，取 h2~h4，
  扁平列表 + `data-depth` 控制缩进；高亮用滚动监听 + `requestAnimationFrame` 节流，
  从最后一个标题往前扫，滚到页底时最后一个章节也能被选中。窄屏自动隐藏。
- **banner 承载全部元信息**：作者、日期一行，字数、阅读时长一行，与原版的排布一致。
- **图片灯箱**：替代 fancybox，零依赖。懒建遮罩、`aria-modal`、ESC / 点遮罩 / 点按钮三种关闭、
  关闭后焦点归还、`body` 锁滚动；只接管没有被 `<a>` 包着的图。
- **提示块** `.note`：`note-info` / `note-success` / `note-warning` / `note-danger` 四种配色。
- **文末版权卡片** `.license-box`：标题、链接、作者、日期、协议，右下角一个大号淡色 ©。
- **脚注**：GFM 原生语法，编号由 CSS 计数器生成，不用插件。
- **代码块行号**：同样用 CSS 计数器，`::before` 的内容不进 `innerText`，复制不会带上行号。
- **单篇 front matter 的 `toc` 字段**：可以单独关掉某篇文章的目录。
- 六篇「指南」示例文章，覆盖安装、配置、写作、定制、部署、扩展，同时充当排版样例。
- `CHANGELOG.md` 与本文件。

### Changed

- **版心与栅格对齐原版**：容器宽度按 Bootstrap 4 分档（1140 / 960 / 720 / 540），
  文章页改为 `2fr 8fr 2fr` 三栏（对应 `col-lg-2 / 8 / 2`），正文改用 10% 百分比内边距。
- **正文排版对齐 github-markdown-css**：字号 1rem、行高 1.6、段落 16px、
  标题用 em 梯度（2 / 1.5 / 1.25 / 1 / .875 / .85）、图片 90% 宽居中、表格去掉斑马纹。
- **banner 标题**从 3rem 调到 2rem（原版用的是 Bootstrap 的 `.h2`）。
- **回到顶部按钮**与**滚动提示箭头**按原版重写：4px 圆角、双层阴影、悬停时图标上下浮动。
- **`config.ts` 的 `color` 段真正生效**了。之前它只是声明、没人读；现在会注入内联样式，
  只覆盖亮色那组变量（暗色仍由 `main.css` 的 `[data-user-color-scheme="dark"]` 负责）。
- 文章页的「分类」「标签」标签改用 `i18n.ts` 的文案，不再写死中文。
- README 的 front matter 示例补全了 `updated` / `toc` / `draft` / `bannerImg` / `bannerMaskAlpha`。

### Fixed

- 回到顶部箭头指向左上（多余的 `rotate(-90deg)`）。
- 代码块的语言名与复制按钮重叠。
- `.markdown-body figure` 的特异性压过 `.highlight`，给每个代码块凭空加了 1.5rem 上边距。
- 卡片里标题出现两次：现在 banner 是唯一的视觉标题，`#seo-header` 只服务 SEO 与打印。
- 文档与实现脱节的若干处（目录深度、目录宽度、目录高亮方式、图片缩放是否保留）。
- 中文长文里 `li` 之间没有间距、`h5`/`h6` 字号缺失、标题内行内代码字号过大等排版细节。

### Removed

- `src/utils/toc.ts` —— 目录改由构建期 `headings` 直接产出，不再需要运行时解析 DOM。
- 旧的 `.post-header` / `.post-title` / `.post-meta-row` / `.copyright` 样式与对应结构。

## [1.0.0] - 2026-10-20

首个版本。从 hexo-theme-fluid 迁移到 Astro：卡片式首页、全屏 banner、深色模式、
站内搜索、归档 / 分类 / 标签 / 友链 / 关于 / 404、RSS 与 sitemap，运行时依赖为 0。

[Unreleased]: https://github.com/capzk/astro-theme-flux/compare/v1.1.3...HEAD
[1.1.3]: https://github.com/capzk/astro-theme-flux/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/capzk/astro-theme-flux/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/capzk/astro-theme-flux/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/capzk/astro-theme-flux/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/capzk/astro-theme-flux/releases/tag/v1.0.0
