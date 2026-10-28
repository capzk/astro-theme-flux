/**
 * 分享卡片与结构化数据
 * ---------------------------------------------------------------------------
 * Open Graph 和 Schema.org 都只认绝对地址，站内的 `/img/a.png` 传过去等于没传，
 * 所以 URL 与封面在这里统一补全一次。全是纯函数：不读 Astro 上下文、不碰 DOM，
 * 页面把 `Astro.site` 递进来即可，输出也能在构建期直接断言。
 *
 * 另一件事是「实体」：首页用 `@graph` 声明一次 WebSite / Organization / Person，
 * 文章页的 author、publisher 只写 `@id` 指回来。Google 靠 @id 与 sameAs 判断
 * 「这几个名字说的是同一个东西」，这也是 E-E-A-T 真正的落点 —— 不是字段多，
 * 而是同一个实体在各处说得一致。
 */
import { SITE } from '../config';

/** 社交平台抓取封面时不渲染 SVG，只认这几种位图 */
const RASTER_IMAGE = /\.(png|jpe?g|webp|avif|gif)(?:[?#].*)?$/i;

/** 扩展名 → MIME。og:image:type 要的是这个，不是扩展名本身 */
const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
};

/** 站内路径 → 绝对地址；已经是绝对地址则原样返回 */
export function absoluteUrl(pathOrUrl: string, origin: URL | string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (pathOrUrl.startsWith('//')) return `https:${pathOrUrl}`;
  return new URL(pathOrUrl, origin).href;
}

/**
 * 分享封面的 MIME 类型。认不出扩展名就返回 undefined，调用方不输出 og:image:type ——
 * 缺一项顶多让平台自己去起个头探测，写错一项是明确的错误。
 */
export function imageMimeOf(url: string): string | undefined {
  const ext = /\.(png|jpe?g|webp|avif|gif)(?:[?#]|$)/i.exec(url)?.[1];
  return ext ? MIME_BY_EXT[ext.toLowerCase()] : undefined;
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

/**
 * X / Twitter 账号。配置里 `'capz'`、`'@capz'`、整条主页地址都认，
 * 统一归一化成不带 @ 的用户名；格式不对就当没配 ——
 * 宁可整行不输出，也不要在页面上留一条指向别人的 twitter:creator。
 */
export function twitterHandle(): string | undefined {
  const raw = SITE.twitter?.trim();
  if (!raw) return undefined;
  const handle = (/(?:x|twitter)\.com\/([A-Za-z0-9_]+)/i.exec(raw)?.[1] ?? raw).replace(/^@/, '');
  return /^[A-Za-z0-9_]{1,15}$/.test(handle) ? handle : undefined;
}

/**
 * 站点实体的 @id
 * ---------------------------------------------------------------------------
 * 形如 `https://example.com/#website`：本身是个合法 URL（片段部分不影响请求），
 * 拿它当实体的身份证，比自造 `urn:xxx` 更容易被工具接受。
 */
function siteIds(origin: URL | string) {
  const base = absoluteUrl('/', origin);
  return {
    base,
    website: `${base}#website`,
    publisher: `${base}#organization`,
    author: `${base}#author`,
  };
}

/**
 * 作者主页。Google 对 author.url 的要求是「能唯一认出这个人的页面」，
 * 关于页正好是这个东西；关掉关于页时退回首页，不指向一个 404。
 */
const authorPageUrl = (base: string) => (SITE.pages.about ? `${base}about/` : base);

/** 作者（Person）。sameAs 只挂人身上 —— 账号是人的，不是「站点机构」的 */
function personNode(origin: URL | string) {
  const { base, author } = siteIds(origin);
  const handle = twitterHandle();
  return {
    '@type': 'Person',
    '@id': author,
    name: SITE.author,
    url: authorPageUrl(base),
    ...(handle ? { sameAs: [`https://x.com/${handle}`] } : {}),
  };
}

/**
 * 发布方（Organization）。名字取站点名而不是作者名 —— 个人博客里两者常常同义，
 * 但「发布方」这个位置的语义是站点，写站点名不会错。
 *
 * logo 只在头像本身是位图时才输出：Google 的 Organization logo 要 PNG/JPG，
 * 给 SVG 在 Rich Results Test 里是明确的无效项，宁可不写。
 */
function organizationNode(origin: URL | string) {
  const { base, publisher } = siteIds(origin);
  const logo = RASTER_IMAGE.test(SITE.avatar) ? absoluteUrl(SITE.avatar, origin) : undefined;
  return {
    '@type': 'Organization',
    '@id': publisher,
    name: SITE.title,
    url: base,
    ...(logo ? { logo: { '@type': 'ImageObject', url: logo } } : {}),
  };
}

/**
 * 站点级结构化数据（首页）
 * ---------------------------------------------------------------------------
 * 三个节点放进一个 `@graph`，各自带稳定 @id。拆成三个独立 <script> 也合法，
 * 但那样「本站是谁」这件事就散在三处，@graph 正是 Schema.org 给多节点准备的容器。
 */
export function siteJsonLd(origin: URL | string) {
  const { base, website, publisher } = siteIds(origin);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': website,
        name: SITE.title,
        alternateName: SITE.subtitle,
        description: SITE.description,
        url: base,
        inLanguage: SITE.lang,
        publisher: { '@id': publisher },
      },
      organizationNode(origin),
      personNode(origin),
    ],
  };
}

interface ArticleSeo {
  title: string;
  description: string;
  /** 文章页绝对地址 */
  url: string;
  /** 分享封面（已绝对化） */
  image: string;
  /** 站点根地址，用来给 author / publisher 生成 @id（与首页那份对上） */
  origin: URL | string;
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
  const {
    title,
    description,
    url,
    image,
    origin,
    published,
    modified,
    section,
    tags,
    words,
  } = article;
  const { website } = siteIds(origin);

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    image: [image],
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    /* 指回首页那份 WebSite 实体，而不是每页各自声明一个「本站」 */
    isPartOf: { '@id': website },
    datePublished: published.toISOString(),
    dateModified: (modified ?? published).toISOString(),
    inLanguage: SITE.lang,
    wordCount: words,
    /* 节点自带 @id 也自带 name，所以哪怕 Google 还没抓到首页，这一页也是自洽的 */
    author: personNode(origin),
    publisher: organizationNode(origin),
    ...(section ? { articleSection: section } : {}),
    ...(tags && tags.length > 0 ? { keywords: tags.join(', ') } : {}),
  };
}

/**
 * 面包屑。`items` 由外到内，最后一个就是当前页。
 *
 * 搜索结果里那行绿色地址会从一整条 URL 变成「站点 › 分类 › 标题」，这就是它的
 * 富媒体结果本身；顺带也告诉 AI 这页挂在站点的哪一层 —— 机器比人更需要层级。
 */
export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
