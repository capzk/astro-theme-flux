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
