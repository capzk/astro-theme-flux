/**
 * 列表页 · 路径判定
 * ---------------------------------------------------------------------------
 * 「列表页」= 内容全是一份文章清单，自己没有一个字正文的页面：各种分页、
 * 每个标签页、每个分类页。
 *
 * 为什么要把它们单独拎出来：
 *
 *   · **sitemap**。主题的示例站里有大量这类清单（几十个标签页与分页）。
 *     全塞进 sitemap，搜索引擎看到的是「一堆互相重复的清单页」和十几篇真文章
 *     —— 站点的内容密度被这堆清单稀释掉了。
 *   · **meta robots**。清单页对读者有用（点进去找文章），对索引没用。
 *     所以给 `noindex, follow`：自己不进索引，但链接照跟，权重流向文章。
 *
 * ⚠️ 这个文件**必须保持零依赖**（一条 import 都没有）。
 *    `astro.config.mjs` 要直接 import 它过滤 sitemap，而配置文件由 esbuild
 *    单独打包，认不得 `.webp` 这类资源导入 —— 只要它顺手 import 了
 *    `src/config`，整个构建会在「加载配置」这一步就失败。
 *    和 `src/config/user/pages.ts` 是同一个原因。
 */

/**
 * 归一成「带尾斜杠的站内路径」。
 * `/tags/x`、`/tags/x/`、`/tags/x/?a=1` 都当成同一件事 ——
 * 站点是 `trailingSlash: 'always'`，但 sitemap 集成给回来的不一定是带斜杠的形态。
 */
function normalize(pathname: string): string {
  const path = (pathname.split(/[?#]/)[0] || '/').trim();
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  return withSlash.endsWith('/') ? withSlash : `${withSlash}/`;
}

/** 是否为列表页（清单页） */
export function isListPage(pathname: string): boolean {
  const path = normalize(pathname);

  /* 所有「第 2 页及以后」：/archives/page/2/、/tags/前端/page/2/、/categories/前端/page/2/ …
     第 1 页不在此列 —— 它以 `/archives/`、`/tags/前端/`、`/categories/前端/` 的形态存在，
     归档首页是真正的入口页，单个标签页 / 分类页则由下面那条拦。 */
  if (/\/page\/\d+\/$/.test(path)) return true;

  /* 单个标签页、单个分类页。总览页 /tags/、/categories/ 不匹配（末尾没有第二段） */
  if (/^\/(?:tags|categories)\/[^/]+\/$/.test(path)) return true;

  return false;
}
