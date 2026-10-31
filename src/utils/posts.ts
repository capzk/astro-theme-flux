/**
 * 文章数据层
 * ---------------------------------------------------------------------------
 * 「取文章 → 排序 → 统计」都收在这里，页面只消费结果。换排序规则、改置顶
 * 策略、增加相关文章算法，都不用翻每个页面。
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { postSlug } from './slug';

export type Post = CollectionEntry<'posts'>;

/** 开发环境显示草稿，构建产物里剔除 */
const visible = ({ data }: { data: { draft?: boolean } }) =>
  import.meta.env.DEV ? true : !data.draft;

const byDateDesc = (a: Post, b: Post) => b.data.date.getTime() - a.data.date.getTime();

/** 全部可见文章，时间倒序 */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', visible);
  return posts.sort(byDateDesc);
}

/** 首页用：置顶排前，其余时间倒序 */
export function stickyFirst(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    const pin = Number(b.data.sticky) - Number(a.data.sticky);
    return pin !== 0 ? pin : byDateDesc(a, b);
  });
}

/**
 * 文章的 URL 路径段（相对 `/posts/`）。
 * 规则见 utils/slug.ts：front matter 的 `slug` 优先，否则由文件路径生成。
 *
 * 拼音转换不便宜，而同一个 post 会在首页卡片、归档、上下篇里被问好几次，
 * 所以按 id 缓存 —— 一篇文章的 slug 在一次构建里不会变。
 */
const slugCache = new Map<string, string>();

export function slugOf(post: Post): string {
  const cached = slugCache.get(post.id);
  if (cached !== undefined) return cached;

  const slug = postSlug(post.id, post.data.slug);
  if (!slug) {
    throw new Error(
      `文章 \`${post.id}\` 生成不出合法的 URL：文件名和 slug 里没有任何能用的字母或数字。\n` +
        `给它加一个 \`slug:\` 字段显式指定，例如 \`slug: my-post\`。`,
    );
  }
  slugCache.set(post.id, slug);
  return slug;
}

/** /posts/<slug>/ —— slug 由文件名或 front matter 的 `slug` 决定，全小写 ASCII */
export const postUrl = (post: Post) => `/posts/${slugOf(post)}/`;

/**
 * 把文章列表编成 slug → post 的映射，顺带检查撞车。
 *
 * 撞车在主题里不是「后一篇覆盖前一篇」那么简单：两篇都会写进 sitemap、
 * 都会出现在列表里，但只有一个页面文件，点进去总有一篇是错的。
 * 与其上线后发现丢文章，不如在构建时就失败 —— 报错里直接给出冲突的文件。
 */
export function postsBySlug(posts: Post[]): Map<string, Post> {
  const map = new Map<string, Post>();
  const clashes = new Map<string, string[]>();

  for (const post of posts) {
    const slug = slugOf(post);
    if (map.has(slug)) {
      const ids = clashes.get(slug) ?? [map.get(slug)!.id];
      ids.push(post.id);
      clashes.set(slug, ids);
    } else {
      map.set(slug, post);
    }
  }

  if (clashes.size > 0) {
    const detail = [...clashes]
      .map(([slug, ids]) => `  /posts/${slug}/\n${ids.map((id) => `    - ${id}`).join('\n')}`)
      .join('\n');
    throw new Error(
      `以下文章生成了同一个 URL（后一篇会覆盖前一篇）：\n${detail}\n` +
        `给其中一篇加 \`slug:\` 指定别的路径，或改掉重名的文件名。`,
    );
  }

  return map;
}

/** 中文标签直接进 URL（/tags/前端/），与 Hexo 版一致 */
export const termUrl = (kind: 'tags' | 'categories', name: string) =>
  `/${kind}/${encodeURIComponent(name)}/`;

/** 某个分类 / 标签下的文章（保持传入顺序，即时间倒序） */
export const postsWithTerm = (posts: Post[], kind: 'tags' | 'categories', name: string) =>
  posts.filter((post) => post.data[kind].includes(name));

/** 按年份分组，给归档页 */
export function groupByYear(posts: Post[]) {
  const map = new Map<number, Post[]>();
  for (const post of posts) {
    const year = post.data.date.getFullYear();
    if (!map.has(year)) map.set(year, []);
    map.get(year)!.push(post);
  }
  return [...map.entries()].sort((a, b) => b[0] - a[0]);
}

/**
 * 切页。页码从 1 开始；`page(n)` 越界时返回空数组，所以路由生成阶段必须先用
 * `lastPage` 兜住 —— 别指望这里替你把页码钳到合法范围，那会掩盖路由算错的问题。
 */
export function paginate<T>(items: T[], pageSize: number) {
  const size = Math.max(1, pageSize);
  return {
    lastPage: Math.max(1, Math.ceil(items.length / size)),
    page: (n: number) => items.slice((n - 1) * size, n * size),
  };
}

/**
 * 第 n 页的地址。`base` 是列表首页（以 `/` 结尾），第 1 页回到 base，
 * 其余走 `${base}page/n/` —— `/archives/page/2/`、`/tags/前端/page/2/` 都走这一条。
 */
export const pageUrlOf = (base: string, n: number) => (n <= 1 ? base : `${base}page/${n}/`);

/** 标签计数，按数量倒序 */
export function tagCounts(posts: Post[]) {
  return countOf(posts.flatMap((p) => p.data.tags));
}

/** 分类计数，按数量倒序 */
export function categoryCounts(posts: Post[]) {
  return countOf(posts.flatMap((p) => p.data.categories));
}

function countOf(names: string[]) {
  const map = new Map<string, number>();
  for (const name of names) map.set(name, (map.get(name) ?? 0) + 1);
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** 上一篇 / 下一篇（按时间正序相邻） */
export function neighbours(posts: Post[], current: Post) {
  const asc = [...posts].sort((a, b) => a.data.date.getTime() - b.data.date.getTime());
  const i = asc.findIndex((p) => p.id === current.id);
  return { prev: i > 0 ? asc[i - 1] : undefined, next: i < asc.length - 1 ? asc[i + 1] : undefined };
}

/**
 * 相关文章：按标签 / 分类的重合度打分，取前几条。
 *
 * 权重是「标签 3 分、分类 2 分」—— 标签通常更具体（`Astro`、`slug`），
 * 分类更宽泛（`随笔`），所以标签命中更能说明两篇在讲同一件事。
 * 同分按时间倒序，避免每次构建挑出不同的文章。零分的直接丢弃：
 * 与其拿「都发在这个博客」当相关性，不如整块不显示。
 */
export function relatedPosts(posts: Post[], current: Post, limit = 3): Post[] {
  const tags = new Set(current.data.tags);
  const categories = new Set(current.data.categories);

  return posts
    .filter((post) => post.id !== current.id)
    .map((post) => {
      const tagHits = post.data.tags.filter((tag) => tags.has(tag)).length;
      const categoryHits = post.data.categories.filter((c) => categories.has(c)).length;
      return { post, score: tagHits * 3 + categoryHits * 2 };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || byDateDesc(a.post, b.post))
    .slice(0, limit)
    .map((entry) => entry.post);
}

/** 正文纯文本（去 Markdown 标记），用于摘要与搜索索引 */
export function plainText(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^---[\s\S]*?---/m, ' ')
    .replace(/[#>*`_~|-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ---------------------------------------------------------------------------
 * 系列
 * ------------------------------------------------------------------------- */
export interface SeriesInfo {
  name: string;
  /** 系列里的全部文章，按 seriesOrder 升序；没写序号的按发布时间排在后面 */
  items: Post[];
  /** 当前这篇在 items 里的下标（0 起） */
  index: number;
}

/**
 * 当前文章所属的系列。不属于任何系列、或者同名文章只有它自己，都返回 null ——
 * 一篇文章谈不上「系列」，那种情况下显示一个只有一行的清单只是噪音。
 *
 * 排序规则：写了 `seriesOrder` 的按序号走，没写的按发布时间排在它们后面。
 * 这样「只关心顺序、懒得编号」的写法也是可用的，而且不会因为一半有号一半没号
 * 而乱掉 —— 没号的永远不会插到有号的中间。
 */
export function seriesOf(posts: Post[], current: Post): SeriesInfo | null {
  const name = current.data.series?.trim();
  if (!name) return null;

  const items = posts
    .filter((post) => post.data.series?.trim() === name)
    .sort((a, b) => {
      const ao = a.data.seriesOrder ?? Number.POSITIVE_INFINITY;
      const bo = b.data.seriesOrder ?? Number.POSITIVE_INFINITY;
      if (ao !== bo) return ao - bo;
      return a.data.date.getTime() - b.data.date.getTime();
    });

  if (items.length < 2) return null;

  const index = items.findIndex((post) => post.id === current.id);
  return index === -1 ? null : { name, items, index };
}

/* ---------------------------------------------------------------------------
 * 构建期缓存
 * ---------------------------------------------------------------------------
 * 同一篇文章会被问很多次「正文是什么」：首页卡片要摘要、归档要摘要、分类页和
 * 标签页还要一遍，最后 searchindex.json 再来一次。而 plainText 是五条全局正则，
 * 一篇两千字的文章就是五趟全量替换 —— 一百篇的站点，这一项能吃掉几百毫秒。
 *
 * 一次构建里文章内容不会变，所以按 id 缓存住：第一次算，之后直接取。
 * 缓存只在构建进程内存里，不进产物，也不影响热更新（dev 下每次改文件会重新求值模块）。
 * ------------------------------------------------------------------------- */
const textCache = new Map<string, string>();

/** `plainText` 的带缓存版本，参数是整篇文章 */
export function plainTextOf(post: Post): string {
  const cached = textCache.get(post.id);
  if (cached !== undefined) return cached;

  const text = plainText(post.body ?? '');
  textCache.set(post.id, text);
  return text;
}

/** 摘要：优先 description，否则取正文前 N 字 */
export function excerptOf(post: Post, length: number): string {
  const text = post.data.description?.trim() || plainTextOf(post);
  return text.length > length ? `${text.slice(0, length).trim()}…` : text;
}

/* 阅读时长同样按「文章 + 速度」缓存：wpm 是可配置的，同一篇在不同 wpm 下结果不同，
   缓存键里带上它，免得两处配置互相污染 */
const statsCache = new Map<string, { words: number; minutes: number }>();

/** 字数（中文按字算，英文按词算）与预计阅读时长 */
export function readingStats(post: Post, wpm: number): { words: number; minutes: number } {
  const key = `${post.id}\u0000${wpm}`;
  const cached = statsCache.get(key);
  if (cached) return cached;

  const text = plainTextOf(post);
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) ?? []).length;
  const latin = (text.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[A-Za-z0-9_'-]+/g) ?? []).length;
  const words = cjk + latin;
  const stats = { words, minutes: Math.max(1, Math.round(words / wpm)) };

  statsCache.set(key, stats);
  return stats;
}
