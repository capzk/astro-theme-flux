/**
 * Umami · 构建期回读统计数据
 * ---------------------------------------------------------------------------
 * `analytics` 是**往外发**（埋点脚本），这里是**往里取**：构建时读一次 Umami 的
 * 只读 API，把「这篇被读了多少次」「全站多少访客」写进 HTML。
 *
 * 三条设计约束，决定了代码长这样：
 *
 *   1. **只在构建期跑**。`UMAMI_API_KEY` 一旦进浏览器就等于公开；静态站也没有
 *      后端可以帮你挡一层。构建期取一次，页面到手即完整，运行时零请求。
 *   2. **任何异常都不许让构建失败**。这是个锦上添花的数字 —— 统计服务抽风、
 *      密钥过期、网络不通，都只该让数字消失，不该让整站发不出去。
 *   3. **一次构建只请求一次**。159 个页面各发一次请求不只是慢，还会撞上
 *      Umami 的限流。所以结果缓存在模块级变量里，并发渲染共享同一个 Promise。
 *
 * 代价只有一个：**数字是构建那一刻的**。今天发的文章，明天访问量不会自己涨，
 * 得等下次重新构建。个人博客够用；要实时数字得自己加一层边缘函数代理。
 */
import { SITE, type SiteConfig } from '../config';

/** 单次请求的超时。取不到就当没有，不值得为它卡住整次构建 */
const TIMEOUT_MS = 8000;

/**
 * 「全站累计」的起点。
 * Umami 的接口要求明确的区间（不传默认只查最近 24 小时），给一个早于任何
 * 可能的建站时间的固定值即可 —— 用 0 不行，会被当成「没传」。
 */
const ALL_TIME_START = Date.UTC(2020, 0, 1);

export interface UmamiSiteTotal {
  pageviews: number;
  visitors: number;
}

export interface UmamiStats {
  /** 全站累计；`siteTotal` 关掉或取数失败时为 null */
  site: UmamiSiteTotal | null;
  /** 归一化后的路径 → 浏览量 */
  pages: Map<string, number>;
  /** 真正取到数据的时间；null = 没取（关闭 / 失败） */
  at: Date | null;
}

const EMPTY: UmamiStats = { site: null, pages: new Map(), at: null };

/** 路径归一：去掉查询串 / hash / 尾斜杠，这样 `/posts/a/` 与 `/posts/a` 是同一个键 */
function normalize(pathname: string): string {
  const path = (pathname || '/').split(/[?#]/)[0];
  const withLeading = path.startsWith('/') ? path : `/${path}`;
  const trimmed = withLeading.replace(/\/+$/, '');
  return trimmed || '/';
}

/**
 * 读环境变量。
 * 只看 `process.env`：Astro 起构建时会把 `.env.local` / 平台注入的变量都放进去，
 * 一条路径就够，不需要再去 `import.meta.env` 里找一遍。
 * 密钥**永远不写进配置文件**（那个文件是要提交的）。
 */
function readEnv(key: string): string {
  return String(process.env[key] ?? '').trim();
}

/**
 * API 基址。
 * 默认从脚本地址推 —— 脚本和接口本来就同源，让用户少填一项。
 *
 *   https://analytics.example.com/script.js  →  https://analytics.example.com/api
 *   https://cloud.umami.is/script.js         →  https://api.umami.is/v1   （官方云不同域）
 *   /stats/script.js（站内反代）              →  推不出来，必须手写 stats.apiUrl
 */
function apiBase(umami: SiteConfig['analytics']['umami']): string {
  const explicit = (umami.stats.apiUrl ?? '').trim();
  if (explicit) return explicit.replace(/\/+$/, '');

  const src = (umami.src ?? '').trim();
  const matched = src.match(/^(https?:\/\/[^/]+)/i);
  if (!matched) return '';

  const origin = matched[1];
  if (/^https?:\/\/cloud\.umami\.is$/i.test(origin)) return 'https://api.umami.is/v1';
  return `${origin}/api`;
}

async function fetchJson<T>(url: string, headers: Record<string, string>): Promise<T> {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

/**
 * 凭证。两条路，API key 优先：
 *
 *   UMAMI_API_KEY    后台 Settings → API keys 生成的 `umami_…`，能读全部数据
 *   UMAMI_SHARE_ID   「Share URL」里那串 id，无需密钥，但等于把整站报表公开可读
 *
 * 分享模式下还得先换一次 token（`GET /share/{id}` 返回 `{ websiteId, token }`），
 * 之后每个请求带 `x-umami-share-token`。
 */
async function resolveCredential(
  base: string,
  websiteId: string,
): Promise<{ headers: Record<string, string>; websiteId: string } | null> {
  const apiKey = readEnv('UMAMI_API_KEY');
  if (apiKey) {
    /* 有的 API key 只认网站 id，路径里是空的话会打到 `/websites//stats` 上 —— 404 */
    if (!websiteId) throw new Error('缺少 websiteId');
    return { headers: { Authorization: `Bearer ${apiKey}` }, websiteId };
  }

  const shareId = readEnv('UMAMI_SHARE_ID');
  if (!shareId) return null;

  const share = await fetchJson<{ websiteId?: string; token?: string }>(
    `${base}/share/${encodeURIComponent(shareId)}`,
    {},
  );
  if (!share.token) throw new Error('share token 为空');
  return {
    headers: { 'x-umami-share-token': share.token },
    websiteId: share.websiteId || websiteId,
  };
}

type MetricsRow = {
  name: string;
  /**
   * 实测是**字符串**（`"5"` 而不是 `5`）：Umami 那边是 SQL 的 count 聚合，bigint
   * 序列化成 JSON 就成了字符串。所以这里统一过一遍 `Number()`，别直接当数字用。
   */
  pageviews: string | number;
};

/**
 * 按路径的浏览量。
 * 走 `metrics/expanded`（Umami 2.11+，带 pageviews 明细）。更低版本没有这个接口 ——
 * 那就升级 Umami，不退回 `metrics` 排行接口：老接口只给 `{x, y}`，口径和这个不一样，
 * 两个接口混着用只会让数字忽多忽少，不如让请求直接报错、把问题摆出来。
 */
async function fetchPageViews(
  base: string,
  websiteId: string,
  headers: Record<string, string>,
  limit: number,
): Promise<Map<string, number>> {
  const rows = await fetchJson<MetricsRow[]>(
    `${base}/websites/${websiteId}/metrics/expanded?type=path&startAt=${ALL_TIME_START}&endAt=${Date.now()}&limit=${limit}`,
    headers,
  );

  const pages = new Map<string, number>();
  for (const row of rows) {
    if (!row?.name) continue;
    const views = Number(row.pageviews ?? 0);
    if (!views) continue;
    /* excludeSearch 关着时，`/posts/a/?from=rss` 会自成一「路径」。
       合并到同一个键上，否则同一篇文章的阅读量会被拆成好几份。 */
    const key = normalize(row.name);
    pages.set(key, (pages.get(key) ?? 0) + views);
  }
  return pages;
}

async function load(): Promise<UmamiStats> {
  const { analytics } = SITE;
  const umami = analytics.umami;
  const cfg = umami.stats;

  /* 开发环境不取：`astro dev` 每改一行都可能重跑，打 API 没有意义还慢。
     想看数字就 `npm run build`。 */
  if (!import.meta.env.PROD || !analytics.enable || !cfg.enable) return EMPTY;

  const base = apiBase(umami);
  const websiteId = (umami.websiteId ?? '').trim();
  if (!base) {
    console.warn('[Flux] 统计回读已开启，但推不出 Umami 的 API 地址 —— 请在 user/analytics.ts 里写 stats.apiUrl。');
    return EMPTY;
  }

  try {
    const credential = await resolveCredential(base, websiteId);
    if (!credential) return EMPTY;

    const site = cfg.siteTotal
      ? await fetchJson<{ pageviews?: number; visitors?: number }>(
          `${base}/websites/${credential.websiteId}/stats?startAt=${ALL_TIME_START}&endAt=${Date.now()}`,
          credential.headers,
        )
      : null;

    const pages = cfg.postViews
      ? await fetchPageViews(base, credential.websiteId, credential.headers, cfg.limit)
      : new Map<string, number>();

    return {
      site: site
        ? { pageviews: Number(site.pageviews ?? 0), visitors: Number(site.visitors ?? 0) }
        : null,
      pages,
      at: new Date(),
    };
  } catch (error) {
    /* 一行，不打印堆栈：这是「可有可无的数字取不到」，不是构建错误。
       但要留一句，否则数字莫名消失时无从查起。 */
    console.warn(
      `[Flux] 统计回读失败（${(error as Error)?.message ?? '未知错误'}）—— 页面照常构建，只是不显示阅读量。` +
        ' 检查 UMAMI_API_KEY / UMAMI_SHARE_ID 是否有效、API 地址是否可达。',
    );
    return EMPTY;
  }
}

/**
 * 缓存。
 * 挂在 `globalThis` 上而不是模块级 `let`：一次构建里这个文件可能被求值不止一次
 * （预渲染环境与集成侧各有自己的模块图），模块级变量就会变成好几份，各请求一遍。
 * `Symbol.for` 保证跨实例拿到同一个格子。
 */
const CACHE_KEY = Symbol.for('flux.umami.stats');
type CacheBag = { pending: Promise<UmamiStats> | null };
const cache: CacheBag = ((globalThis as Record<symbol, unknown>)[CACHE_KEY] ??= { pending: null }) as CacheBag;

export function getUmamiStats(): Promise<UmamiStats> {
  cache.pending ??= load();
  return cache.pending;
}

/** 某条路径的浏览量。没有数据返回 0 —— 调用方据此决定「不显示」而不是显示 0 */
export function viewsOf(stats: UmamiStats, pathname: string): number {
  return stats.pages.get(normalize(pathname)) ?? 0;
}

/** 千分位。数字小的时候比「1,234」更耐看的写法是不加分隔，但四位数以上还是要加 */
export function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}
