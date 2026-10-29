/**
 * Flux · 配置的类型契约
 * ---------------------------------------------------------------------------
 * 只放类型，不放值 —— 值在 `defaults.ts`（主题的默认值）和 `user/`（你自己的值）。
 *
 * 为什么要拆：类型是主题作者维护的「能力清单」，默认值是「出厂设置」，
 * 而使用者真正要改的只有其中几项。三者混在一个文件里，改配置要滚过几百行
 * 类型定义，升级主题时又分不清「哪些是我改的、哪些是主题自带的」。
 *
 * 这里的所有字段都是**必填**的（少数标了 `?` 的除外）：默认值已经把每一项填满，
 * 所以业务代码拿到 `SITE` 时不需要写 `??` 兜底。你在 `user/` 里只需要写
 * 「和默认值不一样的那几项」，其余自动继承。
 */
import type { ImageSource } from '../utils/image';

export interface NavItem {
  /**
   * 菜单文案的覆盖值。写了就用它，不写则取 labelKey 对应的 i18n 文案。
   * 默认的 nav 全部走 labelKey，所以改文案优先改 src/i18n.ts。
   */
  label?: string;
  /** 引用 src/i18n.ts 里的键名，如 'archive' */
  labelKey?: string;
  href: string;
  /** 图标名，见 src/components/Icon.astro */
  icon?: string;
  external?: boolean;
}

/**
 * Waline 客户端从哪加载。
 * ---------------------------------------------------------------------------
 * 三种写法：
 *
 *   `'jsdelivr'` | `'unpkg'` | `'npmmirror'`   预置的公共 CDN（见下方表格）
 *   模板字符串                                  自己的 CDN / 自托管目录
 *
 * 模板里的占位符：
 *   `{name}`     npm 包名，固定是 `@waline/client`
 *   `{version}`  版本号，来自下面的 `version`
 *   `{file}`     包内相对路径，如 `dist/waline.js`、`dist/waline.css`
 *   `{basename}` 文件名主干，如 `waline`
 *   `{ext}`      扩展名，`js` 或 `css`
 *
 * 例子：
 *   自托管、文件平铺在 public/waline/  —— `'/waline/{basename}-{version}.{ext}'`
 *   自托管、按 npm 目录结构放          —— `'/vendor/waline/{file}'`
 *   国内镜像（要写全版本号）           —— `'https://registry.npmmirror.com/{name}/{version}/files/{file}'`
 *   自己的对象存储                      —— `'https://cdn.example.com/npm/{name}@{version}/{file}'`
 *
 * @see https://waline.js.org/guide/get-started/client.html
 */
export type WalineCdn =
  | 'jsdelivr'
  | 'unpkg'
  | 'npmmirror'
  /* 自定义模板；用 string 而不是字面量联合，写错成别的名字会在构建期报错提醒 */
  | (string & {});

/**
 * 一套自定义表情（一个选项卡）。
 * 三种写法里最完整的一种：不用把每个 emoji 文件名都列出来，只要给目录结构和文件名。
 *
 * ```ts
 * { name: '我的表情', icon: 'https://cdn.example.com/emoji/1.png',
 *   folder: 'https://cdn.example.com/emoji', type: 'png', items: ['1', '2', '3'] }
 * ```
 * 展开成 `https://cdn.example.com/emoji/1.png`、`…/2.png`…
 */
export interface WalineEmojiInfo {
  /** 选项卡上显示的名字 */
  name: string;
  /** 图标地址（选项卡按钮的封面） */
  icon: string;
  /** 图片文件名主干列表，按顺序渲染 */
  items: string[];
  /** 所在文件夹地址 */
  folder?: string;
  /** 通用路径前缀（和 folder 二选一，folder 更常用） */
  prefix?: string;
  /** 图片扩展名，默认按 `svg` 处理 */
  type?: string;
}

/**
 * Waline 客户端配置
 * ---------------------------------------------------------------------------
 * 大部分字段都有合适的默认值，真要填的只有 `serverURL` —— 也就是你自己部署
 * 的那个 Waline 服务端地址。其余项的默认值写在这里的注释里，需要时再往
 * config 里加一行即可。
 *
 * @see https://waline.js.org/reference/client/props.html
 */
export interface WalineConfig {
  /**
   * 服务端地址，例如 `https://comment.example.com`。
   * 部署方式见 https://waline.js.org/guide/get-started/ ——
   * Vercel / Cloudflare Workers / Docker 都行，客户端只认这一个字符串。
   */
  serverURL: string;
  /**
   * 客户端脚本与样式从哪个 CDN 取。默认 `'jsdelivr'`。
   *
   * | 取值 | 实际地址 |
   * | --- | --- |
   * | `'jsdelivr'` | `https://cdn.jsdelivr.net/npm/@waline/client@{version}/{file}` |
   * | `'unpkg'` | `https://unpkg.com/@waline/client@{version}/{file}` |
   * | `'npmmirror'` | `https://registry.npmmirror.com/@waline/client/{version}/files/{file}` |
   *
   * 也可以直接填模板（占位符见上方 WalineCdn 的说明）：
   *
   *   自托管、文件平铺在 public/waline/、文件名带版本号
   *     cdn: '/waline/{basename}-{version}.{ext}', version: '3.16.1'
   *     → /waline/waline-3.16.1.js、/waline/waline-3.16.1.css
   *
   *   自托管、按 npm 的目录结构放（即 public/vendor/waline/dist/waline.js）
   *     cdn: '/vendor/waline/{file}'
   *
   * 国内访问 jsDelivr / unpkg 都不稳，换 `'npmmirror'` 或自己的对象存储最省事。
   * 换 CDN 只改这一行，不用碰组件。
   */
  cdn?: WalineCdn;
  /**
   * 客户端版本。默认 `'3'` —— 跟着 3.x 的最新版走，对 jsDelivr / unpkg 有效。
   * 想锁死就写全（`'3.16.1'`）；**`npmmirror` 不支持 `'3'` 这种范围写法，必须写全**，
   * 写范围会在构建期收到一条警告。
   */
  version?: string;
  /**
   * 评论归属的路径，Waline 用它区分不同文章。
   * - 不写      用当前页路径（`/posts/hello-flux/`），推荐
   * - `'href'`  用完整地址，带查询参数访问会被当成新文章，一般别用
   * - 自定义    写死一段路径，多站共用一份评论数据时用
   */
  path?: string;
  /** 界面语言。不写则按 SITE.lang 推断（zh-CN / zh-TW / en / jp / ru / fr / pt-BR） */
  lang?: string;
  /**
   * 暗色模式。主题靠 `html[data-user-color-scheme="dark"]` 切换，所以默认就传这个
   * 选择器，Waline 会自己盯着它。设成 `false` 关掉它自带的暗色样式 —— 颜色已经由
   * 主题变量桥接，一般不用动这里。
   */
  dark?: string | boolean;
  /**
   * 覆盖 Waline 的具体文案，键名见它的 i18n 文档。
   * 常用的两个：`placeholder`（输入框占位符）、`submit`（提交按钮）。
   */
  locale?: Record<string, string>;
  /** 评论者信息栏：昵称 / 邮箱 / 网址。默认三项都显示 */
  meta?: ('nick' | 'mail' | 'link')[];
  /** 必填项。默认 `[]` 全匿名；`['nick']` 只要求昵称；`['nick','mail']` 还要邮箱 */
  requiredMeta?: ('nick' | 'mail')[];
  /** `enable` 允许登录（默认）/ `disable` 只能匿名 / `force` 必须登录 */
  login?: 'enable' | 'disable' | 'force';
  /**
   * 表情包。三处可选：
   *
   * - **不写**：用 Waline 内置的微博那套（`//unpkg.com/@waline/emojis@1.x/weibo`）
   * - **字符串数组**：元素是表情目录地址，一个元素一个选项卡。官方预设照抄即可
   *   （版本自己跟着换，`@1.4.0` 只是当时的值）：
   *   `https://unpkg.com/@waline/emojis@1.4.0/weibo`（微博）、`/qq`、`/bilibili`、
   *   `/bmoji`（哔哩小黄脸）、`/tieba`、`/tw-emoji`（Twitter）
   * - **对象数组**（`WalineEmojiInfo`）：自己的一套表情，只要给目录和文件名列表
   *
   * `false` 去掉表情按钮；`true` 等同不写。
   */
  emoji?: (string | WalineEmojiInfo)[] | boolean;
  /* 这里刻意没有「GIF 表情搜索」开关：Waline 的 `search` 要传的是一个函数
     （`{ search: (word) => Promise<图片列表> }`），函数过不了 JSON，配置层根本开不了。
     真要用就在 `src/comments/client/waline.js` 里自己传 —— 摆一个能写但无效的
     布尔开关，比没有这个开关更糟。 */
  /**
   * 文末「反应」表情，给一组图片地址才会出现（最多 8 个）；`true` 用内置的那套。
   * 默认不显示。读者不用写评论也能表个态。
   */
  reaction?: string[] | boolean;
  /**
   * 评论字数上限。单个数字是上限，`0` 不限；也可以写 `[最小, 最大]` 限制区间。
   * 默认 0。
   */
  wordLimit?: number | [number, number];
  /** 每页评论条数。默认 10 */
  pageSize?: number;
  /** 评论列表排序：'latest' 最新在前（默认）/ 'oldest' 最早在前 / 'hottest' 按热度 */
  commentSorting?: 'latest' | 'oldest' | 'hottest';
  /**
   * 允许在评论里上传图片（走服务端配置的存储）。
   * 默认**关闭** —— 不开是「不能传」，开了才是「能传」：
   * 服务端没配存储时 Waline 会退回把图片转成 Base64 塞进评论体，
   * 一条评论几十 KB 地进数据库，长期看不划算。
   */
  imageUpload?: boolean;
  /** 隐藏 Waline 页脚的版权署名。默认显示，建议保留以支持上游 */
  noCopyright?: boolean;
  /** 隐藏评论框旁边的 RSS 订阅链接 */
  noRss?: boolean;
  /**
   * Google reCAPTCHA v3。
   *
   * ⚠️ 三处必须**同时**配好，少一处就是「看得见验证码、提交一定失败」：
   *
   * | 在哪 | 配什么 |
   * | --- | --- |
   * | 这里 | `recaptchaV3Key`（网站密钥，公开） |
   * | 服务端 | `RECAPTCHA_V3_KEY`（同一个网站密钥） |
   * | 服务端 | `RECAPTCHA_V3_SECRET`（私密钥，不可泄漏） |
   *
   * 和 Turnstile **只能选一个**：两个都配，服务端会按自己的顺序验，另一个形同虚设。
   */
  recaptchaV3Key?: string;
  /**
   * Cloudflare Turnstile（推荐，不用翻墙就能过验证）。
   *
   * ⚠️ 同样三处配对，缺一不可：
   *
   * | 在哪 | 配什么 |
   * | --- | --- |
   * | 这里 | `turnstileKey`（Site Key，公开） |
   * | 服务端 | `TURNSTILE_KEY`（同一个 Site Key） |
   * | 服务端 | `TURNSTILE_SECRET`（Secret Key，不可泄漏） |
   *
   * 只配客户端、服务端没配 Secret，表现是「验证码能点、点完提交 403」；
   * 反过来只配服务端，页面上根本不出现验证框，评论提交直接被拒。
   *
   * 配了它之后，页面的 CSP 要放行 `challenges.cloudflare.com`
   * （script / frame / connect 三处），主题会自动加 preconnect，但 CSP 得你自己写。
   *
   * Site Key 和 Secret 在 Cloudflare 面板 → Turnstile 里申请。
   */
  turnstileKey?: string;
}

/**
 * 评论 · Giscus
 * ---------------------------------------------------------------------------
 * 把评论存在 GitHub Discussions 里，不需要任何服务端：读者用 GitHub 账号登录后发言。
 * 适合开源项目、技术博客；不适合面向「不玩 GitHub」的中文读者 —— 这一条决定了
 * 它多半只能当备选。
 *
 * 三个 id 都在 https://giscus.app 填完仓库信息后生成，照抄即可。
 */
export interface GiscusConfig {
  /** 仓库，格式 `owner/repo`。必须是公开仓库，且已在设置里开启 Discussions */
  repo: string;
  /** 仓库 ID（`R_kgDO…`） */
  repoId: string;
  /** Discussion 分类名，如 `Announcements`。留空用仓库最近用过的分类 */
  category?: string;
  /** 分类 ID（`DIC_kwDO…`）。填了 `category` 一般也要一起填 */
  categoryId?: string;
  /**
   * 文章与 Discussion 的映射方式。
   * - `'pathname'` 用页面路径（推荐，和 Waline 的 path 行为一致）
   * - `'url'` / `'title'` / `'og:title'` 用地址或标题 —— 改标题／换域名就会丢评论
   * - `'specific'` 全部指到同一个 Discussion，做留言板时用，配合 `term`
   */
  mapping?: 'pathname' | 'url' | 'title' | 'og:title' | 'specific';
  /** `mapping: 'specific'` 时，指向的那个 Discussion 标题 */
  term?: string;
  /** 只有标题与 `term` 完全一致才复用已有 Discussion */
  strict?: boolean;
  /** 显示 reaction（文章底部的表情回应）。默认开 */
  reactionsEnabled?: boolean;
  /** 评论框在上还是在下。默认在下 */
  inputPosition?: 'top' | 'bottom';
  /**
   * 配色。两个值分别对应亮色与暗色，主题切换时 Giscus 会跟着换。
   * 可选值见 https://giscus.app 的 Theme 一栏（也支持 `preferred_color_scheme`）。
   */
  theme?: { light?: string; dark?: string };
  /** 界面语言，如 `'zh-CN'`。留空由 Giscus 按浏览器判断 */
  lang?: string;
}

/**
 * 评论 · Artalk
 * ---------------------------------------------------------------------------
 * 自建服务端的另一家，中文社区维护。和 Waline 的定位最接近（都要自己部署），
 * 差别在取舍：
 *
 *   · 比 Waline 轻 —— 后端是单个 Go 二进制，没有 Node 运行时，小机器跑得动；
 *   · 前端交互比 Waline 朴素，插件生态也小一些（没有 reCAPTCHA）；
 *   · 多站点隔离是内建的（`site` 一项），一个后端挂几个博客不用分库。
 *
 * 没有在这里列出的选项就是没有做成配置项 —— 要么主题管不着（例如 `el`、
 * `pageTitle`、`darkMode` 由组件与脚本自动填），要么得传函数（过不了 JSON）。
 * 全量选项见 https://artalk.js.org/guide/frontend/config.html
 */
export interface ArtalkConfig {
  /** 后端地址，例如 `https://comment.example.com`。必须前端可达 */
  server: string;
  /**
   * 站点名。Artalk 用它在同一个后端里隔离多个站点，**要和后台建站时填的一致**，
   * 否则评论会落到「默认站点」里，后台看不见。
   */
  site?: string;
  /**
   * 评论归属的路径（Artalk 叫 pageKey）。默认取当前页面路径；
   * 填 `'href'` 用完整地址（换域名会丢评论，一般不要）。
   */
  path?: 'href' | string;
  /** 界面语言（BCP 47，如 `'zh-CN'`）。留空跟随站点的 lang */
  locale?: string;
  /** 评论框占位文字 */
  placeholder?: string;
  /**
   * 表情包。默认用 Artalk 官方那套（从 jsDelivr 拉一份 json），
   * 也可以填自己的 OwO 格式地址，设 `false` 关掉。
   */
  emoticons?: string | boolean;
  /** 每页几条。默认 20 */
  pageSize?: number;
  /**
   * 客户端脚本与样式的完整地址。默认走 jsDelivr：
   *   https://cdn.jsdelivr.net/npm/artalk@2/dist/Artalk.mjs
   *   https://cdn.jsdelivr.net/npm/artalk@2/dist/Artalk.css
   *
   * 国内 jsDelivr 不稳时换成镜像或自托管（Artalk 的后端镜像本身就带前端资源，
   * 指向自己的服务端域名是最省心的做法）：
   *   js:  'https://registry.npmmirror.com/artalk/2.10.1/files/dist/Artalk.mjs'
   *   css: 'https://registry.npmmirror.com/artalk/2.10.1/files/dist/Artalk.css'
   */
  js?: string;
  css?: string;
}

/**
 * 评论系统
 * ---------------------------------------------------------------------------
 * 换评论系统只改 `type` 一行，再把对应那一段填好 —— 用不到的段留着不影响构建，
 * 所以「先填两套、随时切」是常态。
 *
 * 内置三个实现：
 *   'waline' —— 自建服务端，功能最全（评论 / 反应 / 登录 / 表情包）
 *   'giscus' —— 寄生在 GitHub Discussions，零服务端，只有评论
 *   'artalk' —— 自建服务端，单个二进制、比 Waline 轻，插件少一些
 *
 * 加第四个见 README「再加一个评论系统」：四步，其中三步是各写一个文件。
 */
export interface CommentConfig {
  /** 总开关。关掉后文章页不渲染评论区，也不请求任何评论相关的资源 */
  enable: boolean;
  /** 用哪一套。改这里即可切换 */
  type: 'waline' | 'giscus' | 'artalk';
  /**
   * 懒加载：浏览器滚到「距评论区还有 N 像素」时才开始拉脚本。
   * `0` 表示不懒加载、进页面就拉。默认 600 —— 大约「再滚一屏就到了」。
   *
   * 调大（如 1800）能让读者刚开始往下读就开始预取，滚到评论区时已经就绪；
   * 代价是这一页一定会拉评论脚本，哪怕读者根本不看评论。
   */
  lazy: number;
  /**
   * 文章页底部的「本站最新评论」。只在支持它的评论系统上出现（目前是 Waline，
   * 它有一个现成的公开读接口），其余情况整块不渲染。
   */
  recent?: RecentConfig;
  /** Waline 的私有配置（`type === 'waline'` 时生效） */
  waline?: WalineConfig;
  /** Giscus 的私有配置（`type === 'giscus'` 时生效） */
  giscus?: GiscusConfig;
  /** Artalk 的私有配置（`type === 'artalk'` 时生效） */
  artalk?: ArtalkConfig;
}

/**
 * 最新评论挂件
 * ---------------------------------------------------------------------------
 * 拉「全站最近 N 条」显示在文章页底部，让读者看到「别的地方在聊什么」——
 * 一个只有零星评论的站，评论区本身看起来是死的，这块能让它活一点。
 *
 * 需要评论系统提供公开的「按时间倒序取评论」接口。Waline 有
 * （`/comment?type=recent`），Giscus 与 Artalk 没有，所以那一块在它们下面不出现。
 */
export interface RecentConfig {
  /** 默认关。它要在读者滚到底时多发一个请求，值不值得由站主判断 */
  enable: boolean;
  /** 显示几条。默认 5 */
  count?: number;
  /** 每条正文最多显示多少字，超了截断加省略号。默认 60 */
  length?: number;
}

/**
 * 访客统计 · Google Analytics 4
 * ---------------------------------------------------------------------------
 * 只认 GA4 的衡量 ID（`G-` 开头）。`UA-` 那套 Universal Analytics 已在 2023 年
 * 停服，填了也收不到任何数据，所以不做兼容 —— 构建期会直接点出来。
 *
 * ⚠️ 境内访问 `googletagmanager.com` 基本是不通的，脚本会一直挂到超时。
 * 它是 `async`，不挡渲染，但这一页终究白等一个连接。面向境内读者的站，
 * 用下面的 Umami 更实际。
 *
 * @see https://developers.google.com/analytics/devguides/collection/ga4
 */
export interface GoogleAnalyticsConfig {
  /**
   * 单独开关。**不靠「id 空不空」判断**：想临时停掉就改这个布尔值，
   * id 留着不用再翻一遍后台。
   */
  enable: boolean;
  /**
   * 衡量 ID，形如 `G-XXXXXXXXXX`。
   * 在 GA 后台 → 管理 → 数据流 → 点开你的网站，「衡量 ID」就是那一行。
   *
   * 别填成「数据流 ID」（纯数字），也别填成 `GT-` 开头的容器 ID —— 那两个都不会报错，
   * 只是报表里一条数据都没有。
   */
  measurementId: string;
}

/**
 * 访客统计 · Umami
 * ---------------------------------------------------------------------------
 * 开源的轻量统计，可以自己部署（Docker / 单文件脚本 / Vercel），也可以用官方云。
 * 相对 GA 的三点不同，也正是选它的理由：
 *
 *   · **不用 Cookie、不采集个人数据** —— 不需要 cookie 同意弹窗（GDPR 视角）
 *   · **脚本 2KB 左右**，GA 的 gtag.js 是它的二十多倍
 *   · **可以自己部署**，境内也能跑，数据在自己库里
 *
 * 用法本来就只有一行 `<script async src="…/script.js" data-website-id="…">`，
 * 下面这些字段就是给那一行凑属性的。
 *
 * @see https://umami.is/docs/tracker-configuration
 */
export interface UmamiConfig {
  /** 单独开关（理由同 GoogleAnalyticsConfig.enable） */
  enable: boolean;
  /**
   * 统计脚本的完整地址：
   *
   *   自托管   `https://umami.你的域名/script.js`
   *   官方云   `https://cloud.umami.is/script.js`
   *   同源反代 `/stats/script.js`（把 umami 反代到主域下，省一次跨域握手）
   *
   * 以 `/` 开头时按站内路径处理，构建期不会当成外链去猜域名。
   */
  src: string;
  /**
   * 站点 ID（一串 UUID）。Umami 后台 → 网站 → 点进你的站 → 「网站 ID」。
   *
   * 填错的后果很安静：脚本正常下载、`umami` 对象正常挂上，只是数据记到了
   * 一个不存在的站点上 —— 报表永远是空的。所以构建期会拦一道。
   */
  websiteId: string;
  /**
   * 只在这些域名上统计，逗号分隔，如 `'capzk.com,www.capzk.com'`。
   *
   * 不写 = 不限制。填了之后 localhost、预览部署（`*.pages.dev`）都不会污染数据。
   * 主题另外还在构建期做了「只在生产构建里输出」的判断，两层都挡。
   */
  domains?: string;
  /**
   * 自动记录页面浏览。默认 true。
   * 设 false 之后脚本只挂载不记账，要自己在代码里调 `umami.track()` 才会上报 ——
   * 一般只有做「混合统计」时才这么用。
   */
  autoTrack: boolean;
  /**
   * 页面路径里不带查询参数（`?from=rss`）。默认 false（带上）。
   *
   * 开着的好处是 RSS / 分享链接的 utm 不会把同一篇文章拆成几十个页面；
   * 代价是看不到来源参数了 —— 但来源本来该由 referrer 记录。
   */
  excludeSearch: boolean;
  /** 页面路径里不带 hash（`#标题`）。默认 false */
  excludeHash: boolean;
  /**
   * 数据发到哪个地址（`data-host-url`）。**不写就跟 `src` 同源**，绝大多数情况不用填。
   *
   * 只有一种场景需要：脚本从公共 CDN 拿，但数据要进自己的实例 ——
   *
   *   src:     'https://cdn.jsdelivr.net/npm/@umami/script/script.js'
   *   hostUrl: 'https://analytics.你的域名'
   *
   * 反代到主域（`src: '/stats/script.js'`）时也不需要它，同源就是对的。
   */
  hostUrl?: string;
  /**
   * 收集真实用户的 Core Web Vitals（`data-performance`，Umami 3.1+）。默认 false。
   *
   * 打开后 Umami 会记下访客浏览器实测的 LCP / CLS / INP / TTFB —— 那是 Lighthouse
   * 给不了的东西：Lighthouse 跑在模拟环境里，这个是你读者的真实网络与设备。
   * 代价是每页多一次上报请求（复用同一个连接，可以忽略）。
   */
  performance: boolean;
  /**
   * 收集访客浏览器里的 JS 异常（`data-errors`，Umami 3.5+）。默认 false。
   *
   * 对博客来说通常用不上（页面上本来就没几个脚本），但它是**唯一能看到
   * 「读者那边脚本挂了」的途径** —— 自己的浏览器永远是好的。
   * 打开后可以在上报里带版本号，见 `errorRelease`。
   */
  errors: boolean;
  /**
   * 异常上报里附带的版本号（`data-release`，限 100 字符，`errors` 开启时才有意义）。
   * 留空则上报里的 release 是空的，排查时看不出是哪个版本出的问题。
   * 常见写法是跟着 package.json 的版本走，例如 `'web@4.0.0'`。
   */
  errorRelease?: string;
  /** 构建期回读统计数据（阅读量 / 访客数）。详见下方 UmamiStatsConfig */
  stats: UmamiStatsConfig;
}

/**
 * 从 Umami 回读统计数据
 * ---------------------------------------------------------------------------
 * 前面的 `analytics` 是**往外发**（埋点脚本），这一段是**往里取** —— 构建时调
 * Umami 的只读 API，把「这篇被读了多少次」「全站多少访客」写进 HTML。
 *
 * 为什么在构建期取，而不是让浏览器去请求：
 *
 *   · 静态站没有后端，UMAMI_API_KEY 一旦下发到浏览器就等于公开了；
 *   · 每页多两个跨域请求，还都要等 API —— 数字小、延迟大，不值；
 *   · 构建期取一次是**零运行时开销**，与主题「页面到手即完整」的取舍一致。
 *
 * 代价是**数字是构建那一刻的**：今天发的文章，明天访问量不会自己涨，得等下次
 * 重新构建（推一次代码、或手动触发部署）。对一个个人博客够用了 —— 如果哪天
 * 需要实时数字，正确做法是加一层自己的边缘函数代理，而不是把密钥塞进页面。
 *
 * ## 凭证从哪来（**不进配置文件**）
 *
 * 两个环境变量，任选其一：
 *
 *   UMAMI_API_KEY     推荐。Umami 后台 → Settings → API keys 生成的 `umami_…`
 *   UMAMI_SHARE_ID    退路。网站编辑页里「Share URL」那段的 id，无需密钥
 *
 * 前者能拿到全部数据；后者走公开分享，等于把整站报表公开可读 —— 自己权衡。
 * 本地构建可以写在 `.env.local`（已在 .gitignore 里），Cloudflare Pages 则配在
 * 项目的环境变量里。两个都没有时，这一段整块不生效，页面照常构建。
 */
export interface UmamiStatsConfig {
  /**
   * 总开关。**关掉时连请求都不发**，构建完全不依赖网络。
   * 默认关：不想让构建因为第三方接口超时而变慢或失败。
   */
  enable: boolean;
  /**
   * API 基址。不写则从 `src` 推：`https://analytics.example.com/script.js`
   * → `https://analytics.example.com/api`。
   *
   * 只有在「脚本和 API 不同域」（反代、CDN 分发脚本）时才需要手写。
   */
  apiUrl?: string;
  /**
   * 文章页 banner 上显示这篇的阅读量（`阅读 1,234 次`）。
   * 没有数据的文章**不显示**，而不是显示 0 —— 「阅读 0 次」比不显示更劝退。
   */
  postViews: boolean;
  /** 页脚显示全站累计（`12,345 次浏览 · 6,789 位访客`） */
  siteTotal: boolean;
  /**
   * 一次最多取多少条路径。默认 500。
   *
   * Umami 的「按路径」接口是分页返回的，这里只取第一页 —— 文章上千篇时
   * 超出的部分只是没有阅读量，不影响其余功能，所以不值得为它加翻页逻辑。
   */
  limit: number;
}

/**
 * 访客统计 · Microsoft Clarity
 * ---------------------------------------------------------------------------
 * 和 GA / Umami **不是同一类东西**：它做的是热图、点击分布和会话回放（把访客
 * 在你页面上的操作录成一段可回放的视频），不是「多少人看了哪篇文章」。
 * 所以它可以和上面两家同时开着 —— 那些是访问统计，这个是行为分析。
 *
 * 免费、没有流量上限，微软的隐私政策下数据保留 13 个月。
 *
 * ⚠️ **它用 Cookie**（`_clck` / `_clsk`），和 Umami 的「无 Cookie」正好相反。
 * 面向欧盟读者时，按 GDPR 这类数据得先拿到同意 —— 主题不会替你弹窗，
 * 要么用 CSP/脚本层面做好同意门禁，要么干脆只在不需要同意的地区开。
 *
 * 隐私上还有一层：会话回放会录到页面内容。Clarity 默认对输入框做遮罩，
 * 也可以在它的面板里设置「屏蔽某些元素」。真要放读者留言、邮箱之类的
 * 敏感内容，先在那边把遮罩规则配好再上线。
 *
 * @see https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-detection-code
 */
export interface ClarityConfig {
  /** 单独开关 */
  enable: boolean;
  /**
   * 项目 ID。Clarity 后台 → 设置 → 概览里那串 10 位左右的字母数字
   * （形如 `abcdefghij`，全是小写、没有连字符）。
   *
   * 填错的症状和 Umami 一样安静：脚本正常加载，只是数据进了一个不存在的项目。
   * 注意别把「安装代码」整段粘进来。
   */
  projectId: string;
}

/**
 * 访客统计
 * ---------------------------------------------------------------------------
 * 三家，**每家一个开关**，互不干扰，可以同时开：
 *
 *   `google`   GA4 —— 访问统计，生态最全，境内基本连不上
 *   `umami`    Umami —— 访问统计，可自托管、不用 Cookie、2KB
 *   `clarity`  Microsoft Clarity —— 热图 / 会话回放，和上面两个不是一类东西
 *
 * **为什么不做一个 `type: 'google' | 'umami'` 的单选题**（3.x 是这样）：
 * 那样默认了「这些厂商只能选一个」，可 Clarity 这类工具是**正交**的 ——
 * 「用 Umami 看流量 + 用 Clarity 看热图」是完全正常的组合，单选题表达不了。
 * 而且每加一家都要改一次联合类型，越加越僵。
 *
 * 那种设计想守住的东西还在，只是从「结构限制」换成了「构建期提醒」：
 * GA 和 Umami 同时开着，说明同一份流量会被记两次 —— 那多半是迁移期对比，
 * 也可能只是忘关了一个，所以照常输出、但构建时点一句。
 *
 * 总开关 `enable` 关掉后一行标签都不输出，也不下载任何第三方脚本。
 */
export interface AnalyticsConfig {
  /** 总开关。一键全关，不用逐家去改 */
  enable: boolean;
  /** GA4 */
  google: GoogleAnalyticsConfig;
  /** Umami */
  umami: UmamiConfig;
  /** Microsoft Clarity（热图 / 会话回放） */
  clarity: ClarityConfig;
}

/**
 * 站长验证
 * ---------------------------------------------------------------------------
 * 这一段**不是统计**，是「证明这个站是我的」：输出一行 `<meta>`，搜索引擎的站长
 * 平台读到就把后台权限开给你。数据（点击、曝光、抓取错误）都在对方后台看，
 * 站点这边不放任何脚本，也不产生任何请求。
 *
 * 所以两个「Google」别混：
 *
 *   | 想要什么 | 在哪配 | 填什么 |
 *   | --- | --- | --- |
 *   | 访问统计（多少人看） | `analytics` 段 | `G-XXXXXXXXXX` |
 *   | Search Console（搜索表现） | 这一段 `google` | 验证串 |
 *
 * **Bing 只有验证，没有访问统计脚本。** 它没有类似 gtag.js 的东西 ——
 * Bing 的访问数据早年间有过（Bing Webmaster 的「流量」报表），如今那块并入
 * Microsoft Clarity，要的是另一段脚本、在 Clarity 后台单独生成。所以这里给的是
 * `msvalidate.01`，用来认领站点、看搜索关键词与抓取情况。
 *
 * ⚠️ 填的是**content 的值**，不是整段标签。把
 * `<meta name="msvalidate.01" content="ABC123" />` 整行粘进来是这一段最常见的错，
 * 验证必然不过，而平台上只显示「验证失败」、不告诉你为什么 —— 构建期会点出来。
 */
export interface VerificationConfig {
  /** Search Console 的验证串（`<meta name="google-site-verification" content="…">`） */
  google: string;
  /** Bing Webmaster Tools 的验证串（`msvalidate.01`） */
  bing: string;
  /**
   * 其他平台的验证 meta，如百度 `baidu-site-verification`、Yandex
   * `yandex-verification`、Pinterest `p:domain_verify`。
   *
   * 写成 `{ name: 'baidu-site-verification', content: 'codeva-xxxx' }`，
   * 有几条写几条；`name` 或 `content` 为空的条目会被跳过（不会输出空标签）。
   *
   * 不做成 `baidu` / `yandex` 这样的具名字段，是因为这类平台太多、增删又频繁，
   * 逐个加字段只会让类型越来越长，而值本身没有任何可校验的结构。
   */
  other: { name: string; content: string }[];
}

/**
 * 打字机效果。
 * ---------------------------------------------------------------------------
 * 对应原版 Fluid 的 `fun_features.typing`。零依赖手写，约 60 行。
 *
 * 行为：
 *   · `slogan` 是单句且 `loop: false` → 打一遍就停（光标继续闪）
 *   · `slogan` 是数组，或 `loop: true` → 打完停顿、退回、再打下一句，无限轮播
 *   · 读者系统里开了「减少动态效果」（`prefers-reduced-motion`）→ 直接显示完整文字，不动画
 */
export interface TypingConfig {
  /** 每个字的间隔，毫秒。越大越慢。默认 70 */
  typeSpeed?: number;
  /** 光标字符。默认 `'|'`；不想要就设空字符串 */
  cursor?: string;
  /** 循环播放。默认 false */
  loop?: boolean;
  /** 开始前等多久（毫秒），给首屏动画留点时间。默认 300 */
  startDelay?: number;
}

/** 首页 banner */
export interface BannerConfig {
  /**
   * 首页要不要这一块。`false` 时直接从顶栏进入卡片流 ——
   * 想做成纯列表风格的博客就关掉它，不用去改页面代码。
   */
  enable: boolean;
  /**
   * 首页大标题。**不写就用站点名**（`SITE.title`）。
   *
   * 单独设它是因为这两件事经常不一样：站点名要出现在浏览器标题栏、
   * 搜索结果、RSS 里（「capz 的博客」），而首页第一屏往往想写点别的
   * （「Hi，我是 capz」）。写空字符串则整个大标题不出现，只剩背景图。
   */
  title?: string;
  /**
   * 背景图。**三种写法**：
   *
   *   1. `import` 进来的本地图 → 会被优化（多档宽度 + webp/avif）
   *   2. `'/img/x.webp'`        → public/ 里的文件，原样输出
   *   3. `https://…`            → 外链，原样用
   *
   * **不写（或写空字符串）＝ 不要图片**：banner 用顶栏色作纯色底，
   * 标题和副标题照常显示。这是「有图 / 无图」的唯一开关，不需要改组件。
   */
  img?: ImageSource;
  /** 高度：如 '100vh'、'60vh'、'400px' */
  height: string;
  /**
   * 第 2 页起的列表页（`/page/2/`）用的高度。
   * 不写就跟 `height` 一样 —— 但首页 100vh、翻页还铺满一屏会很烦，
   * 所以默认给了个矮的（见 defaults.ts）。
   */
  pageHeight?: string;
  /** 黑色蒙版透明度 0~1，越大字越清楚 */
  maskAlpha: number;
  /**
   * 大标题下面那行字。留空则用 `SITE.subtitle`。
   *
   * **可以给数组**：开启打字机时按顺序轮播；不开打字机则只显示第一句
   * （不随机 —— 静态站每次构建出不同内容会让缓存和 diff 都变脏）。
   * 对应原版 Fluid 的 `slogan.text` 支持列表。
   */
  slogan?: string | string[];
  /**
   * 打字机效果。`true` 用默认参数，给对象可细调。
   * 不写就关闭，直接显示静态文字。
   */
  typing?: boolean | TypingConfig;
  /**
   * 视差滚动：往下滚时背景图以更慢的速度移动，文字层正常滚走。
   * 默认开启（与原版 `banner.parallax: true` 一致），首页和文章页都生效。
   * 读者开了「减少动态效果」时不启用。
   */
  parallax?: boolean;
  /**
   * 最小宽高比，防移动端竖屏把图横向裁得太狠。默认 1。
   *
   * 作用是把 banner 高度限制在「宽度 ÷ minRatio」以内：
   * 手机竖屏 390×844、`height: 100vh` 时，1.0 会让 banner 最高 390px，
   * 图片基本不被裁边。想要整屏铺满就设 0（关闭限制）。
   */
  minRatio?: number;
  /** 底部滚动提示箭头 */
  scrollDown: boolean;
}

export interface SiteConfig {
  title: string;
  subtitle: string;
  description: string;
  author: string;
  /** BCP 47，决定界面文案语言 */
  lang: string;
  /** 头像（相对 public/ 或完整 URL），关于页与页脚用 */
  avatar: string;
  /**
   * X（Twitter）账号，**不带 @**，如 `'capzk'`。整条主页地址也认（会归一化）。
   *
   * 填了才输出 `twitter:site` / `twitter:creator`，并作为 `sameAs` 写进
   * 结构化数据的 Person 节点 —— 那是 Google 用来把「各处的 capzk 是同一个人」
   * 连起来的字段。不填就一行都不输出（比留一个空 content 干净）。
   *
   * 只在分享卡片与结构化数据里用到，页面上不显示社交图标。
   */
  twitter?: string;
  /**
   * 社交分享封面（微信 / Twitter / Slack 等抓取的缩略图）。
   * 必须是 PNG、JPG 这类位图，建议 1200×630：这些平台不渲染 SVG。
   * 文章自己配了位图封面时优先用文章的，否则回落到这张。
   */
  ogImage: string;
  /**
   * 建站年份。两个用途：页脚版权写成 `© 2024–2026`，以及「已运行 N 天」的兜底起点
   * （`footer.runtime.since` 没写时用这一年的 1 月 1 日）。不设则用当前年。
   */
  since?: number;

  /** 导航菜单 */
  nav: NavItem[];

  /** 首页 banner */
  banner: BannerConfig;

  /**
   * 文章页默认 banner（单篇可用 front matter 的 `banner` / `bannerImg` 覆盖）。
   *
   * 和首页 banner 一样，`img` 不写就是纯色底 —— 标题和作者/日期/字数
   * 那两行元信息都住在 banner 上，所以这里**没有「整个关掉」的开关**：
   * 关了就得给标题另找地方，那是改版不是配置。
   */
  postBanner: {
    /**
     * 同 `banner.img`：不写 = 纯色底；字符串 = public/ 路径或外链；
     * `import` 的资源会被优化。
     */
    img?: ImageSource;
    height: string;
    maskAlpha: number;
  };

  /** 首页卡片 */
  index: {
    /** 没有封面图时用的默认图；留空则卡片不显示图片区 */
    defaultImg: ImageSource;
    /** 摘要截断字数 */
    excerptLength: number;
    /** 卡片底部显示日期 / 分类 / 标签 */
    showDate: boolean;
    showCategory: boolean;
    showTags: boolean;
  };

  /** 文章页 */
  post: {
    /** 顶部信息：作者 / 日期 / 字数 / 预计阅读（都显示在 banner 上） */
    meta: { author: boolean; date: boolean; wordcount: boolean; min2read: boolean };
    /** 右侧目录（取正文 h2~h4；宽屏才显示，窄屏自动隐藏） */
    toc: boolean;
    /** 文末版权声明 */
    copyright: boolean;
    /** 上一篇 / 下一篇 */
    prevNext: boolean;
    /**
     * 文末「相关文章」：按标签 / 分类的重合度打分取前 3 篇，
     * 一篇相关的都没有时整块不显示（不会拿「同一个博客」凑数）。
     */
    related: boolean;
    /** 每页字数换算阅读时长的速度（字/分钟） */
    wpm: number;
  };

  /** 评论（Waline）。详见上方 WalineConfig 的字段说明 */
  comment: CommentConfig;

  /** 访客统计：GA4 / Umami / Clarity，每家一个开关，可并存。详见上方 AnalyticsConfig */
  analytics: AnalyticsConfig;

  /** 站长验证：Search Console / Bing Webmaster 等。详见上方 VerificationConfig */
  verification: VerificationConfig;

  /** 暗色模式：默认跟随系统还是固定 */
  darkMode: {
    enable: boolean;
    /** 'auto' 跟随系统 | 'light' | 'dark' */
    default: 'auto' | 'light' | 'dark';
  };

  /** 配色（对应 Fluid 的 color.* 项） */
  color: {
    /** 顶栏底色 */
    navbar: string;
    /** 页面底色 */
    bodyBg: string;
    /** 卡片 / 内容区底色 */
    board: string;
    /** 链接悬停与强调色 */
    accent: string;
    /**
     * 顶栏「透明态」顶部那层黑色渐变的深度，0~1，默认 0.35。
     *
     * 首页刚打开、还没滚动时顶栏是透明的，导航文字直接压在 banner 图上。
     * 这一步就是用来保证文字在哪张图上都读得清的：
     *
     *   - 0    不压暗，图片原样。图很亮时白字会发虚（文字自带极浅投影兜底）
     *   - 0.35 默认值，浅色图也够用
     *   - 0.6+ 图特别花时才需要，代价是顶部明显发暗
     *
     * 只影响「顶栏那一条」的顶部，不影响 banner 本身的 `maskAlpha`。
     */
    navbarScrim: number;
    /**
     * 色相，0~360。**不写（null）＝ 用上面那四个字面颜色**，观感与以前完全一致。
     *
     * 写了之后，顶栏底色与强调色不再取 `navbar` / `accent`，而是由这个色相现算：
     *
     *   强调色  亮 oklch(0.68 0.14)  暗 oklch(0.76 0.13)
     *   顶栏色  亮 oklch(0.35 0.04)  暗 oklch(0.29 0.035)
     *
     * 明度与彩度是固定的，变的是色相 —— 所以整套配色永远是同一种「深浅关系」，
     * 不会出现某个色相下字糊在背景里。页面底色与卡片底色不动（它们本来就接近中性灰）。
     *
     * 参考值：250 蓝（接近默认）、165 青绿、35 橙、350 玫红、285 紫。
     */
    hue: number | null;
  };

  /** 每页文章数（首页 / 分类 / 标签的卡片流） */
  pageSize: number;

  /**
   * 页面开关
   * ---------------------------------------------------------------------------
   * 只对「可选页面」生效：关于页和友链页。归档 / 分类 / 标签是博客的骨架，没有开关。
   *
   * 关掉一个页面 = 三件事一起变，不用手工同步：
   *   1. 顶栏和移动端菜单里那一条自动隐藏（按 href 匹配，不用改 nav）
   *   2. sitemap 里不再出现
   *   3. 页面本身不输出内容，改成跳回首页（静态站没有「返回 404」这个动作，
   *      生成一个 301 会让部署平台与 sitemap 各说一套；跳首页是最省事且不会
   *      让人撞上空白页的做法）
   *
   * 为什么不做成「删文件」：主题升级会把你删掉的文件加回来，开关写在配置里
   * 才能活过升级。
   */
  pages: {
    /** 关于页 `/about/` */
    about: boolean;
    /** 友链页 `/links/` */
    links: boolean;
  };

  /** 归档页 */
  archive: {
    /**
     * 每页条数。归档是一行一篇的时间线，比卡片加密得多，所以和 pageSize 分开取值。
     * 取 0 或负数表示不分页，整份归档铺在一页里。
     */
    pageSize: number;
  };

  /** 站内搜索（构建期生成索引） */
  search: boolean;

  /** RSS 输出 */
  rss: {
    /**
     * 摘要字数上限。RSS 只输出纯文本摘要，没有全文 ——
     * 全文要渲染 Markdown，得用 Astro 的 experimental Container API，
     * 主题不想为了这个把实验性接口写进依赖面。300 是个折中：
     * 够读者判断值不值得点进来，又不至于让订阅器变成全文阅读器。
     */
    excerptLength: number;
  };

  /**
   * 页脚
   * ---------------------------------------------------------------------------
   * 页脚是整个站点唯一「不需要滚动就能反复看到」的地方，所以这里的东西
   * 只在真的想展示时才出现：站龄默认开、订阅入口默认开、备案默认关。
   *
   * 备案为什么默认关：ICP 备案是境内托管才需要的东西，海外托管、个人玩具站
   * 都没有。默认摆一行空白的「京ICP备」是脏数据，不如让需要的人自己打开。
   */
  footer: {
    /**
     * 「已运行 N 天」。天数是客户端算的 —— 构建期算的那一份会在站点长期不重建时
     * 停在旧数上（静态站一年不重新构建很常见），所以页面上先给出构建当天的结果
     * （无脚本时的兜底），再由脚本校正到访问当天。
     */
    runtime: {
      /** 默认开。设 false 就整块不出现 */
      enable: boolean;
      /**
       * 建站日期，`'YYYY-MM-DD'`（也认 `'YYYY-MM-DD HH:mm:ss'`）。
       * **不写就用 `since` 那一年的 1 月 1 日** —— 大多数人不记得精确到天，
       * 只记得哪一年开始写，那就别逼着填。
       */
      since: string;
    };
    /**
     * 订阅源与 sitemap 的入口（RSS / Atom / Sitemap 三个链接）。
     * 默认开：它们是对外接口，藏着没好处；想做成极简页脚再关。
     */
    links: boolean;
    /**
     * ICP 备案信息。**默认关**。
     *
     * 打开后整行变成「备案号」指向 `link` —— 工信部要求备案号必须链接到
     * beian.miit.gov.cn，纯文本挂着不算合规。
     */
    beian: {
      enable: boolean;
      /** 备案号原文，如 `'京ICP备12345678号-1'`。`enable` 为 true 时必填 */
      text: string;
      /** 备案号指向的地址。默认工信部备案查询页，一般不用改 */
      link: string;
    };
  };
}
