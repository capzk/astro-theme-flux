/**
 * 站点基础信息 + 导航
 * ---------------------------------------------------------------------------
 * 这是最可能需要改的文件：站名、描述、作者、导航菜单。
 * 没写的字段沿用 `src/config/defaults.ts` 里的默认值 —— 只写你要改的那几行。
 */
import { defineConfig } from '../merge';

export default defineConfig({
  title: 'Flux',
  subtitle: '一个 Material Design 风格的 Astro 博客主题',
  description: '丝滑的阅读体验：卡片式首页、全屏 banner、暗色模式、跟随滚动的目录。',
  author: 'capzk',
  lang: 'zh-CN',
  avatar: '/img/avatar.svg',
  /**
   * 社交分享封面，建议 1200×630 的 **PNG/JPG**。
   * 微博、微信、Twitter 这些平台不渲染 SVG —— 指向 `.svg` 会在构建期收到警告，
   * 分享出去就是一张空白卡片。
   */
  ogImage: '/img/og.png',
  since: 2026,
  /* 备案号，显示在页脚最后一行；留空就不显示 */
  beian: '',

  /**
   * 导航菜单。`labelKey` 指向 `src/i18n.ts` 里的文案键（推荐，换语言时自动跟着走）；
   * 想给某一项单独起名，直接写 `label`，它会盖过 `labelKey`。
   * `icon` 的可选值见 `src/components/Icon.astro`。
   */
  nav: [
    { labelKey: 'home', href: '/', icon: 'home' },
    { labelKey: 'archive', href: '/archives/', icon: 'archive' },
    { labelKey: 'categories', href: '/categories/', icon: 'category' },
    { labelKey: 'tags', href: '/tags/', icon: 'tag' },
    { labelKey: 'friends', href: '/links/', icon: 'link' },
    { labelKey: 'about', href: '/about/', icon: 'user' },
  ],
});
