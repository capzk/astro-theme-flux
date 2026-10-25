/**
 * Flux · 站点配置 —— 主题使用者的唯一入口
 * ---------------------------------------------------------------------------
 * 这里对应 Hexo 版 `_config.yml` 的常用项，但只保留核心：改站名、菜单、banner、
 * 配色、文章元信息开关，全在这一个文件里，不用碰任何组件。
 *
 * 配色是普通 CSS 变量（见 src/styles/main.css 顶部的 T 段），覆盖 `color` 即可。
 */

export interface NavItem {
  /** 菜单文案（跟随 i18n 时改用 labelKey） */
  label?: string;
  labelKey?: string;
  href: string;
  /** 图标名，见 src/components/Icon.astro */
  icon?: string;
  external?: boolean;
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
  /** 页脚版权起始年份；不设则用当前年 */
  since?: number;
  /** 备案号之类，显示在页脚最下面一行；不设则不显示 */
  beian?: string;

  /** 导航菜单 */
  nav: NavItem[];

  /** 首页 banner */
  banner: {
    /** 背景图（public/ 下的路径或外链）；留空则用纯色渐变 */
    img: string;
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
    img: string;
    height: string;
    maskAlpha: number;
  };

  /** 首页卡片 */
  index: {
    /** 没有封面图时用的默认图；留空则卡片不显示图片区 */
    defaultImg: string;
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
    /** 每页字数换算阅读时长的速度（字/分钟） */
    wpm: number;
  };

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

  /** 每页文章数 */
  pageSize: number;

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
  since: 2026,
  beian: '',

  nav: [
    { label: '首页', href: '/', icon: 'home' },
    { label: '归档', href: '/archives/', icon: 'archive' },
    { label: '分类', href: '/categories/', icon: 'category' },
    { label: '标签', href: '/tags/', icon: 'tag' },
    { label: '友链', href: '/links/', icon: 'link' },
    { label: '关于', href: '/about/', icon: 'user' },
  ],

  banner: {
    img: '/img/banner.svg',
    height: '100vh',
    maskAlpha: 0.3,
    slogan: '流体般的阅读体验',
    scrollDown: true,
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
    wpm: 300,
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
  search: true,
};
