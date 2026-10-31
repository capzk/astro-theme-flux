/**
 * 页面开关 · 运行时判定
 * ---------------------------------------------------------------------------
 * 配置在 `src/config/user/pages.ts`（那边为了能让 astro.config 读到，刻意零依赖），
 * 这里只负责把「路径 / 导航项」翻译成「哪个开关」。
 *
 * 三处消费方：Navbar（藏菜单）、页面本身（跳回首页）、sitemap（由 astro.config 过滤）。
 */
import { SITE, type SiteConfig } from '../config';
import { PAGE_PATH } from '../config/shared/page-paths';

export type PageKey = keyof SiteConfig['pages'];

/* 路径表放在零依赖的共享文件里 —— astro.config.mjs 过滤 sitemap 时读的是同一份 */
export { PAGE_PATH };

/**
 * 编译期兜底：路径表必须覆盖 `SiteConfig['pages']` 的每一个开关。
 * ---------------------------------------------------------------------------
 * 零依赖的 `page-paths.ts` 是 `as const` 而不是 `Record<PageKey, string>`（那边不能
 * import 类型，否则 astro.config 加载配置时就得跟着解析整棵配置）。代价是「新加一个
 * 页面开关、忘了补路径」不会报错 —— 而漏一条的后果很隐蔽：sitemap 不剔除（
 * `astro.config.mjs` 那边被 `.filter(Boolean)` 吃掉）、导航项不隐藏。
 *
 * 这一行把校验捞回来：对不上就 `astro check` 报错。导出只为不被当成未使用，
 * 运行时就是同一个对象引用，不产生任何额外代码。
 */
export const PAGE_PATH_CHECK: Record<PageKey, string> = PAGE_PATH;

/** 归一成「带尾斜杠的站内路径」，好让 `/about`、`/about/?a=1`、`/about/` 都认 */
function normalize(href: string): string {
  const path = href.split(/[?#]/)[0] || '/';
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  return withSlash.endsWith('/') ? withSlash : `${withSlash}/`;
}

/** 页面开没开。没写这一项（老配置）视为开启，不悄悄下线人家的页面 */
export const isPageEnabled = (key: PageKey): boolean => SITE.pages?.[key] !== false;

/** 当前路径属于哪个开关；不在开关表里返回 undefined */
export function pageKeyOf(pathname: string): PageKey | undefined {
  const path = normalize(pathname);
  return (Object.keys(PAGE_PATH) as PageKey[]).find((key) => PAGE_PATH[key] === path);
}

/**
 * 这条导航是不是指向一个被关掉的页面。
 * 外链（`https://…`、`//…`）一律返回 false —— 它们不归我们管。
 */
export function isNavHidden(href: string): boolean {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) return false;
  const key = pageKeyOf(href);
  return key ? !isPageEnabled(key) : false;
}
