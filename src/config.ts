/**
 * Flux · 站点配置 —— 主题使用者的唯一入口
 * ---------------------------------------------------------------------------
 * 这里对应 Hexo 版 `_config.yml` 的常用项，但只保留核心：改站名、菜单、banner、
 * 配色、文章元信息开关、评论，全在这一个文件里，不用碰任何组件。
 *
 * 配色是普通 CSS 变量（见 src/styles/main.css 顶部的 T 段），覆盖 `color` 即可。
 *
 * 图片有两套写法（详见 src/utils/image.ts）：写字符串是「原图直接用」，
 * 写 `import` 进来的本地图是「交给 Astro 优化」。下面三条演示用的是后者。
 */
import type { ImageSource } from './utils/image';
/* 示例图带优化：src/assets 下的图会被处理成多档宽度 + webp。
   换成自己的图时，把文件放进 src/assets 再 import，或者改回 '/img/xxx.png' */
import bannerAsset from './assets/banner.webp';
import coverDefaultAsset from './assets/covers/cover-default.webp';

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
 * 评论 · Waline
 * ---------------------------------------------------------------------------
 * 大部分字段都有合适的默认值，真要填的只有 `serverURL` —— 也就是你自己部署
 * 的那个 Waline 服务端地址。其余项的默认值写在这里的注释里，需要时再往
 * config 里加一行即可。
 *
 * @see https://waline.js.org/reference/client/
 */
export interface WalineConfig {
  /**
   * 服务端地址，例如 `https://comment.example.com`。
   * 部署方式见 https://waline.js.org/guide/get-started/ ——
   * Vercel / Cloudflare Workers / Docker 都行，客户端只认这一个字符串。
   */
  serverURL: string;
  /**
   * 客户端脚本与样式地址。「@3」表示取 3.x 的最新版；
   * 想锁版本就写全（`@3.16.1`），想换 CDN / 自托管就改这里。
   * 两个地址必须同版本，只改一个会样式错位。
   *
   * 默认：https://cdn.jsdelivr.net/npm/@waline/client@3/dist/waline.js
   *       https://cdn.jsdelivr.net/npm/@waline/client@3/dist/waline.css
   */
  js?: string;
  css?: string;
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
   * 表情包目录地址，默认只有微博那一套。
   * 官方预设直接抄地址即可（`@1.4.0` 是当前版本，换版本时所有地址一起换）：
   *   微博        https://unpkg.com/@waline/emojis@1.4.0/weibo
   *   QQ          https://unpkg.com/@waline/emojis@1.4.0/qq
   *   哔哩哔哩     https://unpkg.com/@waline/emojis@1.4.0/bilibili
   *   哔哩小黄脸   https://unpkg.com/@waline/emojis@1.4.0/bmoji
   *   贴吧        https://unpkg.com/@waline/emojis@1.4.0/tieba
   *   Twitter     https://unpkg.com/@waline/emojis@1.4.0/tw-emoji
   * 数组里排几个就出几个选项卡。设成 `false` 去掉表情按钮。
   */
  emoji?: string[] | boolean;
  /** 表情面板里的 GIF 图片搜索（走 Giphy，依赖服务端配置）。默认关 */
  search?: boolean;
  /**
   * 文末「反应」表情，给一组图片地址才会出现（最多 8 个）；`true` 用内置的那套。
   * 默认不显示。读者不用写评论也能表个态。
   */
  reaction?: string[] | boolean;
  /** 评论字数上限，`0` 不限。默认 0 */
  wordLimit?: number;
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
  /** Google reCAPTCHA v3 的网站密钥。服务端要同步配 `RECAPTCHA_V3_SECRET` */
  recaptchaV3Key?: string;
  /** Cloudflare Turnstile 的网站密钥。服务端要同步配 `TURNSTILE_SECRET` */
  turnstileKey?: string;
  /**
   * 浏览量统计：在文章页显示「阅读 N 次」，每访问一次 +1。
   *
   * 用的是 Waline 的独立小插件（gzip < 1KB），**不依赖评论区是否加载** ——
   * 评论关掉、甚至懒加载从没触发，数字照样统计。
   *
   * - `true`  按 `js` 的地址推同版本插件（`waline-3.16.1.js` → `pageview-3.16.1.js`）
   * - 字符串  直接指定插件地址
   *
   * 自托管时记得把 `pageview.js` 也放进同一个目录；文件名按上面的规律改。
   */
  pageview?: boolean | string;
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
 * 评论系统
 * ---------------------------------------------------------------------------
 * 换评论系统只改 `type` 一行，再把对应那一段填好 —— 用不到的段留着不影响构建，
 * 所以「先填两套、随时切」是常态。
 *
 * 内置两个实现：
 *   'waline' —— 自建服务端，功能最全（评论 / 浏览量 / 反应 / 登录 / 表情包）
 *   'giscus' —— 寄生在 GitHub Discussions，零服务端，只有评论
 *
 * 加第三个见 README「再加一个评论系统」：四步，其中三步是各写一个文件。
 */
export interface CommentConfig {
  /** 总开关。关掉后文章页不渲染评论区，也不请求任何评论相关的资源 */
  enable: boolean;
  /** 用哪一套。改这里即可切换 */
  type: 'waline' | 'giscus';
  /**
   * 懒加载：浏览器滚到「距评论区还有 N 像素」时才开始拉脚本。
   * `0` 表示不懒加载、进页面就拉。默认 600 —— 大约「再滚一屏就到了」。
   *
   * 调大（如 1800）能让读者刚开始往下读就开始预取，滚到评论区时已经就绪；
   * 代价是这一页一定会拉评论脚本，哪怕读者根本不看评论。
   */
  lazy: number;
  /** Waline 的私有配置（`type === 'waline'` 时生效） */
  waline?: WalineConfig;
  /** Giscus 的私有配置（`type === 'giscus'` 时生效） */
  giscus?: GiscusConfig;
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
   * 社交分享封面（微信 / Twitter / Slack 等抓取的缩略图）。
   * 必须是 PNG、JPG 这类位图，建议 1200×630：这些平台不渲染 SVG。
   * 文章自己配了位图封面时优先用文章的，否则回落到这张。
   */
  ogImage: string;
  /** 页脚版权起始年份；不设则用当前年 */
  since?: number;
  /** 备案号之类，显示在页脚最下面一行；不设则不显示 */
  beian?: string;

  /** 导航菜单 */
  nav: NavItem[];

  /** 首页 banner */
  banner: {
    /**
     * 背景图：`import` 进来的本地图（会被优化），或 public/ 路径 / 外链（原样用）。
     * 留空则用纯色底色。
     */
    img: ImageSource;
    /** 高度：如 '100vh'、'60vh'、'400px' */
    height: string;
    /** 黑色蒙版透明度 0~1，越大字越清楚 */
    maskAlpha: number;
    /** 首页大标题下面的副标题；留空则用 SITE.subtitle */
    slogan?: string;
    /** 底部滚动提示箭头 */
    scrollDown: boolean;
  };

  /** 文章页默认 banner（单篇可用 front matter 覆盖） */
  postBanner: {
    /** 同 banner.img：本地资源会被优化，字符串原样输出 */
    img: ImageSource;
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
  };

  /** 每页文章数（首页 / 分类 / 标签的卡片流） */
  pageSize: number;

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
}

export const SITE: SiteConfig = {
  title: 'Flux',
  subtitle: '一个 Material Design 风格的 Astro 博客主题',
  description: '流体般的阅读体验：卡片式首页、全屏 banner、暗色模式、跟随滚动的目录。',
  author: 'capzk',
  lang: 'zh-CN',
  avatar: '/img/avatar.svg',
  ogImage: '/img/og.png',
  since: 2026,
  beian: '',

  nav: [
    { labelKey: 'home', href: '/', icon: 'home' },
    { labelKey: 'archive', href: '/archives/', icon: 'archive' },
    { labelKey: 'categories', href: '/categories/', icon: 'category' },
    { labelKey: 'tags', href: '/tags/', icon: 'tag' },
    { labelKey: 'friends', href: '/links/', icon: 'link' },
    { labelKey: 'about', href: '/about/', icon: 'user' },
  ],

  banner: {
    img: bannerAsset,
    height: '100vh',
    maskAlpha: 0.3,
    slogan: '流体般的阅读体验',
    scrollDown: true,
  },

  postBanner: {
    img: bannerAsset,
    height: '60vh',
    maskAlpha: 0.35,
  },

  index: {
    defaultImg: coverDefaultAsset,
    excerptLength: 200,
    showDate: true,
    showCategory: true,
    showTags: true,
  },

  post: {
    meta: { author: true, date: true, wordcount: true, min2read: true },
    toc: true,
    copyright: true,
    prevNext: true,
    related: true,
    wpm: 300,
  },

  /* 评论默认关闭：Waline 得先有一个自己的服务端，示例站没有；Giscus 得先开
     Discussions，示例站也没有。部署完之后把 serverURL / repo 填上、enable 改 true，
     评论区就出现在文章页文末。想换 Giscus 就把 type 改成 'giscus'，其余不用动。 */
  comment: {
    enable: false,
    type: 'waline',
    /* 滚到距评论区 600px 时开始加载。想让脚本更早就位就调大，见字段说明 */
    lazy: 600,
    waline: {
      serverURL: '',
      locale: {
        placeholder: '说点什么吧，支持 Markdown…',
      },
      /* 昵称必填、邮箱选填。想全匿名改成 []，想要邮箱也必填再加 'mail' */
      requiredMeta: ['nick'],
      pageSize: 10,
      /* 文章页显示「阅读 N 次」。不需要就设 false —— 关掉后连那 1KB 插件都不发 */
      pageview: true,
    },
    giscus: {
      repo: '',
      repoId: '',
      mapping: 'pathname',
      reactionsEnabled: true,
      inputPosition: 'bottom',
      theme: { light: 'light', dark: 'dark' },
    },
  },

  darkMode: {
    enable: true,
    default: 'auto',
  },

  color: {
    navbar: '#2f4154',
    bodyBg: '#eee',
    board: '#ffffff',
    accent: '#30a9de',
  },

  pageSize: 6,
  archive: {
    pageSize: 10,
  },
  search: true,
};
