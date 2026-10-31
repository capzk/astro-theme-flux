/**
 * 页面开关 → 路径
 * ---------------------------------------------------------------------------
 * 「关于 / 友链」这两条路径同时被两处消费：
 *
 *   运行时  src/utils/pages.ts    判断当前页属于哪个开关、导航项要不要藏
 *   构建期  astro.config.mjs      过滤 sitemap 里被关掉的页面
 *
 * 所以只留这一份 —— 以前两边各抄一份，加第三个可选页面时很容易只改一边。
 *
 * ⚠️ 必须保持零依赖（一条 import 都没有）。`astro.config.mjs` 由 esbuild
 *    单独打包，认不得 `.webp` 这类资源导入；这里一旦 import 了 `src/config`，
 *    整个构建会在「加载配置」这一步失败。
 */

/** 开关对应的路径。带尾斜杠，与 nav 里写的形态一致 */
export const PAGE_PATH = {
  about: '/about/',
  links: '/links/',
} as const;
