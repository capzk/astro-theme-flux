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
 * API key。
 * 优先用配置里的 `stats.apiKey`（私有仓库最省事），留空才看环境变量
 * `UMAMI_API_KEY`（公开仓库用这条，别把 key 提交上去）。
 *
 * 它只在**构建期的 Node 进程**里用，不会进产出的 HTML / JS —— 页面上只有取回来的
 * 数字，没有任何密钥。
 */
function resolveApiKey(cfg: SiteConfig['analytics']['umami']['stats']): string {
  return (cfg.apiKey ?? '').trim() || String(process.env.UMAMI_API_KEY ?? '').trim();
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

  try {
    /* 三个前置条件都在 try 里检查，走同一条报错路径 —— 构建输出里一眼能看出
       是「地址推不出来」还是「id 空着」还是「key 不对」。 */
    const base = apiBase(umami);
    if (!base) throw new Error('推不出 API 地址（src 是站内路径？请填 stats.apiUrl）');

    const websiteId = (umami.websiteId ?? '').trim();
    if (!websiteId) throw new Error('analytics.umami.websiteId 是空的');

    const apiKey = resolveApiKey(cfg);
    if (!apiKey) throw new Error('没有 API key（stats.apiKey 或环境变量 UMAMI_API_KEY）');

    const headers = { Authorization: `Bearer ${apiKey}` };

    const site = cfg.siteTotal
      ? await fetchJson<{ pageviews?: number; visitors?: number }>(
          `${base}/websites/${websiteId}/stats?startAt=${ALL_TIME_START}&endAt=${Date.now()}`,
          headers,
        )
      : null;

    const pages = cfg.postViews
      ? await fetchPageViews(base, websiteId, headers, cfg.limit)
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
      `[Flux] 统计回读失败（${(error as Error)?.message ?? '未知错误'}）—— ` +
        '页面照常构建，只是不显示阅读量。检查 user/analytics.ts 里的 stats 配置与 apiKey。',
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
