/**
 * 文章列表 · 纯函数
 * ---------------------------------------------------------------------------
 * 这里只做「给定一批文章 → 排序 / 分组 / 切页 / 打分」，**不碰 astro:content**。
 *
 * 为什么单独拆出来：`posts.ts` 要 `getCollection()`，一 import 就绑死在 Astro 的
 * 虚拟模块上，单测跑不起来。而这些规则（置顶、相关文章权重、分页边界、系列排序）
 * 恰恰是最该被测试覆盖的部分 —— 它们全是纯函数，输入输出都能断言。
 *
 * 类型用 `import type`：编译后不留任何运行时依赖，node 里也能直接加载。
 */
import type { CollectionEntry } from 'astro:content';
import { withBase } from './url';

export type Post = CollectionEntry<'posts'>;

/** 时间倒序。所有列表的基准顺序，导出给 posts.ts 复用 */
export const byDateDesc = (a: Post, b: Post) => b.data.date.getTime() - a.data.date.getTime();

/** 首页用：置顶排前，其余时间倒序 */
export function stickyFirst(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    const pin = Number(b.data.sticky) - Number(a.data.sticky);
    return pin !== 0 ? pin : byDateDesc(a, b);
  });
}

/** 只保留置顶文章（保持时间倒序）。首页「置顶」区块用，不拿普通文章补位 */
export function stickyOnly(posts: Post[]): Post[] {
  return posts.filter((post) => post.data.sticky).sort(byDateDesc);
}

/**
 * 中文标签直接进 URL（/tags/前端/），与 Hexo 版一致。
 * `withBase` 是幂等的：同一串再拼一次不会变成 /blog/blog/…。
 */
export const termUrl = (kind: 'tags' | 'categories', name: string) =>
  withBase(`/${kind}/${encodeURIComponent(name)}/`);

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
 *
 * base 可能已经带 base 前缀（分类页传的是 termUrl 的结果），也可能没有
 * （归档页写死 `/archives/`）；withBase 幂等，两种都能正确处理。
 */
export const pageUrlOf = (base: string, n: number) =>
  withBase(n <= 1 ? base : `${base.replace(/\/+$/, '')}/page/${n}/`);

/** 标签计数，按数量倒序 */
export function tagCounts(posts: Post[]) {
  return countOf(posts.flatMap((p) => p.data.tags));
}

/** 分类计数，按数量倒序 */
export function categoryCounts(posts: Post[]) {
  return countOf(posts.flatMap((p) => p.data.categories));
}

/** 计数并按数量倒序；同数按名称排，保证每次构建顺序一致 */
export function countOf(names: string[]) {
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
