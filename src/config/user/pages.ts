/**
 * 页面开关
 * ---------------------------------------------------------------------------
 * 关掉一个页面 = 导航里那一项消失 + sitemap 里不再出现 + 页面跳回首页。
 * 只影响「可选页面」（关于 / 友链）；归档、分类、标签是博客骨架，没有开关。
 *
 * ⚠️ 这个文件**故意不 import `defineConfig`**，也不 import 任何东西
 * （类型用 `import type`，编译后不留痕迹）。
 *
 * 原因：`astro.config.mjs` 要读这几个开关来过滤 sitemap，而配置文件是由 esbuild
 * 单独打包的 —— 它不认识 `.webp` 这类资源导入。只要这个文件保持零运行时依赖，
 * 配置文件就能安全地 import 它；一旦在这里 import 了别的东西（尤其是图片），
 * 整个构建会在「加载配置」这一步就炸掉。
 *
 * 代价是这个文件没有 `defineConfig` 的字段名检查。字段只有两个布尔值，
 * 写错类型 `npm run check` 仍然会报（`SiteConfig['pages']` 是显式类型）。
 */
import type { SiteConfig } from '../types';

const PAGES: SiteConfig['pages'] = {
  /** 关于页 `/about/` */
  about: true,
  /** 友链页 `/links/` */
  links: true,
};

export default PAGES;
