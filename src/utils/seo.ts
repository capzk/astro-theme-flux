/**
 * 分享卡片与结构化数据
 * ---------------------------------------------------------------------------
 * Open Graph 和 Schema.org 都只认绝对地址，站内的 `/img/a.png` 传过去等于没传，
 * 所以 URL 与封面在这里统一补全一次。全是纯函数：不读 Astro 上下文、不碰 DOM，
 * 页面把 `Astro.site` 递进来即可，输出也能在构建期直接断言。
 */
import { SITE } from '../config';

/** 社交平台抓取封面时不渲染 SVG，只认这几种位图 */
const RASTER_IMAGE = /\.(png|jpe?g|webp|avif|gif)(?:[?#].*)?$/i;

/** 站内路径 → 绝对地址；已经是绝对地址则原样返回 */
export function absoluteUrl(pathOrUrl: string, origin: URL | string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (pathOrUrl.startsWith('//')) return `https:${pathOrUrl}`;
  return new URL(pathOrUrl, origin).href;
}

/**
 * 挑一张能用的分享封面：按候选顺序取第一张位图，都不合格就用站点默认图。
 * 宁可全站共用一张，也不要把 SVG 交给平台 —— 那会渲染成一张空白卡片。
 */
export function shareImage(candidates: (string | undefined | null)[]): string {
  return candidates.find((c): c is string => !!c && RASTER_IMAGE.test(c)) ?? SITE.ogImage;
}

/** zh-CN → zh_CN：Open Graph 的 locale 只接受下划线写法 */
export const ogLocale = () => SITE.lang.replace('-', '_');

/** 首页 / 站点级结构化数据 */
export function websiteJsonLd(origin: URL | string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.title,
    alternateName: SITE.subtitle,
    description: SITE.description,
    url: absoluteUrl('/', origin),
    inLanguage: SITE.lang,
    author: { '@type': 'Person', name: SITE.author },
  };
}

interface ArticleSeo {
  title: string;
  description: string;
  /** 文章页绝对地址 */
  url: string;
  /** 分享封面（已绝对化） */
  image: string;
  published: Date;
  modified?: Date;
  /** 主分类，对应 articleSection */
  section?: string;
  tags?: string[];
  /** 正文字数，Schema.org 的 wordCount */
  words: number;
}

/** 文章页结构化数据：BlogPosting */
export function articleJsonLd(article: ArticleSeo) {
  const { title, description, url, image, published, modified, section, tags, words } = article;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    image: [image],
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished: published.toISOString(),
    dateModified: (modified ?? published).toISOString(),
    inLanguage: SITE.lang,
    wordCount: words,
    author: { '@type': 'Person', name: SITE.author },
    publisher: { '@type': 'Person', name: SITE.author },
    ...(section ? { articleSection: section } : {}),
    ...(tags && tags.length > 0 ? { keywords: tags.join(', ') } : {}),
  };
}
