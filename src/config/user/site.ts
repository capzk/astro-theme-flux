/**
 * 站点基础信息 + 导航
 * ---------------------------------------------------------------------------
 * 这是最可能需要改的文件：站名、描述、作者、导航菜单。
 * **只写和默认值不同的字段**，其余自动继承 `src/config/defaults.ts` 的出厂值 ——
 * 升级主题时 `user/` 原样保留，主题的 defaults 被整块替换，两者不会互相干扰。
 *
 * ⚠️ `nav` 是**数组整体替换**，不是逐项合并。删掉这里的 nav 就继承默认导航；
 *    自己写一份就代表全权接管导航 —— 主题后续新增的页面入口不会自动出现。
 */
import { defineConfig } from '../merge';

export default defineConfig({
  title: 'Flux',
  subtitle: '一个 Material Design 风格的 Astro 博客主题',
  description: '丝滑的阅读体验：卡片式首页、全屏 banner、暗色模式、跟随滚动的目录。',
  author: 'capzk',
  lang: 'zh-CN',
  /* PNG 头像：既能展示，也能作为 JSON-LD 的 Organization.logo（Google 只认位图） */
  avatar: '/img/avatar.png',
  /* 网站图标。换 .ico / .png 也行，type 由 BaseLayout 按扩展名推 */
  favicon: '/favicon.svg',
  /* iOS 添加到主屏幕图标（180×180 PNG）。留空 = 不输出该行 */
  // appleTouchIcon: '/img/apple-touch-icon.png',
  /**
   * X（Twitter）账号，**不带 @**。填了才会输出 `twitter:site` / `twitter:creator`，
   * 也会作为 `sameAs` 进结构化数据（Google 用它把「各处的你是同一个人」连起来）。
   * 没有就留空，一行都不输出。
   */
  twitter: '',
  /**
   * 社交分享封面，建议 1200×630 的 **PNG/JPG**。
   * 微博、微信、Twitter 这些平台不渲染 SVG —— 指向 `.svg` 会在构建期收到警告，
   * 分享出去就是一张空白卡片。
   */
  ogImage: '/img/og.png',
  /* 默认封面的实际尺寸（出厂 og.png 就是 1200×630）。换图记得同步改，或删掉这一项 */
  ogImageSize: { width: 1200, height: 630 },
  /* 建站年份：页脚版权写成 `© 2025–2026` 这样的区间（同年只写一个），也是「已运行 N 天」的兜底起点 */
  since: 2026,

  /**
   * 导航菜单（可选，不写则继承 defaults.ts 的出厂导航）。
   *
   * ⚠️ 数组是**整体覆盖**：写了这里就代表你全权接管，主题后续新增的页面入口
   * 不会自动出现。若只想调整个别项（如改图标或加外链），需要把整份都列进来。
   *
   * `labelKey` 指向 `src/i18n.ts` 里的文案键（推荐，换语言时自动跟着走）；
   * 想给某一项单独起名，直接写 `label`，它会盖过 `labelKey`。
   * `icon` 的可选值见 `src/components/Icon.astro`。
   */
  // nav: [
  //   { labelKey: 'home',       href: '/',            icon: 'home'    },
  //   { labelKey: 'archive',    href: '/archives/',   icon: 'archive' },
  //   { labelKey: 'categories', href: '/categories/', icon: 'category'},
  //   { labelKey: 'tags',       href: '/tags/',        icon: 'tag'     },
  //   { labelKey: 'friends',    href: '/links/',       icon: 'link'    },
  //   { labelKey: 'about',      href: '/about/',       icon: 'user'    },
  // ],
});
