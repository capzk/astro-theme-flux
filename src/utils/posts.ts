/**
 * 文章数据层
 * ---------------------------------------------------------------------------
 * 「取文章 → 排序 → 统计」都收在这里，页面只消费结果。换排序规则、改置顶
 * 策略、增加相关文章算法，都不用翻每个页面。
 */
import { getCollection, type CollectionEntry } from 'astro:content';

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

/** /posts/<id>/ —— id 默认取文件名，与 Hexo 的 :title 一致 */
export const postUrl = (post: Post) => `/posts/${post.id}/`;

/** 中文标签直接进 URL（/tags/前端/），与 Hexo 版一致 */
export const termUrl = (kind: 'tags' | 'categories', name: string) =>
  `/${kind}/${encodeURIComponent(name)}/`;

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

/** 摘要：优先 description，否则取正文前 N 字 */
export function excerptOf(post: Post, length: number): string {
  const text = post.data.description?.trim() || plainText(post.body ?? '');
  return text.length > length ? `${text.slice(0, length).trim()}…` : text;
}

/** 字数（中文按字算，英文按词算）与预计阅读时长 */
export function readingStats(post: Post, wpm: number) {
  const text = plainText(post.body ?? '');
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) ?? []).length;
  const latin = (text.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[A-Za-z0-9_'-]+/g) ?? []).length;
  const words = cjk + latin;
  return { words, minutes: Math.max(1, Math.round(words / wpm)) };
}
