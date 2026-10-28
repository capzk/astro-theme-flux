/**
 * 页面开关 · 运行时判定
 * ---------------------------------------------------------------------------
 * 配置在 `src/config/user/pages.ts`（那边为了能让 astro.config 读到，刻意零依赖），
 * 这里只负责把「路径 / 导航项」翻译成「哪个开关」。
 *
 * 三处消费方：Navbar（藏菜单）、页面本身（跳回首页）、sitemap（由 astro.config 过滤）。
 */
import { SITE, type SiteConfig } from '../config';

export type PageKey = keyof SiteConfig['pages'];

/** 开关对应的路径。带尾斜杠，与 nav 里写的形态一致 */
export const PAGE_PATH: Record<PageKey, string> = {
  about: '/about/',
  links: '/links/',
};

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
