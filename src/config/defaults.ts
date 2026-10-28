/**
 * Flux · 出厂默认值
 * ---------------------------------------------------------------------------
 * ⚠️ 这个文件属于**主题**，不是你改配置的地方。想改什么去 `src/config/user/`，
 * 在那里写一行就覆盖这里的值；升级主题时这个文件整个被替换，`user/` 不动。
 *
 * 每一项都有值，因此业务代码拿到的 `SITE` 永远是完整的对象。
 * 注释解释「这一项是什么意思、取什么值合适」，改之前先读一遍。
 *
 * 图片这里故意用 `public/` 的字符串路径：默认值不依赖 `src/assets/`，
 * 所以任何人 clone 下来（哪怕删掉了示例图）都能直接构建。想要 `astro:assets`
 * 的优化能力，在你自己的 `user/appearance.ts` 里 `import` 一张图覆盖即可 ——
 * 两种写法都支持，见 src/utils/image.ts。
 */
import type { SiteConfig } from './types';

const DEFAULT_CONFIG: SiteConfig = {
  title: 'Flux',
  subtitle: '一个 Material Design 风格的 Astro 博客主题',
  description: '丝滑的阅读体验：卡片式首页、全屏 banner、暗色模式、跟随滚动的目录。',
  author: 'capzk',
  lang: 'zh-CN',
  avatar: '/img/avatar.svg',
  /* X 账号，不带 @。留空则不输出 twitter:site / twitter:creator */
  twitter: '',
  ogImage: '/img/og.png',
  since: 2026,

  nav: [
    { labelKey: 'home', href: '/', icon: 'home' },
    { labelKey: 'archive', href: '/archives/', icon: 'archive' },
    { labelKey: 'categories', href: '/categories/', icon: 'category' },
    { labelKey: 'tags', href: '/tags/', icon: 'tag' },
    { labelKey: 'friends', href: '/links/', icon: 'link' },
    { labelKey: 'about', href: '/about/', icon: 'user' },
  ],

  banner: {
    enable: true,
    img: '/img/banner.svg',
    height: '100vh',
    /* 翻页后的列表页用矮一点，不然每页都要滚过一屏才能看到文章 */
    pageHeight: '50vh',
    maskAlpha: 0.3,
    slogan: '丝滑的阅读体验',
    scrollDown: true,
    /* 视差与宽高比是全局开关，原文见 BannerConfig 的注释 */
    parallax: true,
    minRatio: 1,
  },

  postBanner: {
    img: '/img/banner.svg',
    height: '60vh',
    maskAlpha: 0.35,
  },

  index: {
    defaultImg: '/img/cover-default.svg',
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
      /* 脚本与样式从哪加载：'jsdelivr'（默认）/ 'unpkg' / 'npmmirror'，
         也可以写自托管模板 —— 换 CDN 只改这一行，见上方 WalineConfig.cdn 的表格 */
      // cdn: 'jsdelivr',
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
    artalk: {
      /* 后端地址，必须前端可达；site 要和 Artalk 后台建站时填的名字一致 */
      server: '',
      site: '',
      pageSize: 20,
    },
    /* 文章页底部的「本站最新评论」。默认关：它要在滚到底时多发一个请求 */
    recent: {
      enable: false,
      count: 5,
      length: 60,
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
    navbarScrim: 0.35,
    /* 见 types.ts：null = 用上面这四个字面颜色（与原版 Fluid 一致）。
       想整套换色相就写个数，例如 165（青绿）、35（橙）。 */
    hue: null,
  },

  pageSize: 6,
  archive: {
    pageSize: 10,
  },
  search: true,

  pages: {
    about: true,
    links: true,
  },

  rss: {
    excerptLength: 300,
  },

  footer: {
    /* 站龄。`since` 留空就用 site.since 那一年的 1 月 1 日 */
    runtime: {
      enable: true,
      since: '',
    },
    /* RSS / Atom / Sitemap 三个入口 */
    links: true,
    /* ICP 备案。境内托管才需要，默认关；打开后记得填 text */
    beian: {
      enable: false,
      text: '',
      link: 'https://beian.miit.gov.cn/',
    },
  },
};

export default DEFAULT_CONFIG;
