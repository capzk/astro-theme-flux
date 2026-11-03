/**
 * 文章数据层
 * ---------------------------------------------------------------------------
 * 两类东西分开住：
 *
 *   posts.ts       需要 `astro:content` 的部分 —— 取集合、生成 URL、正文摘要
 *   post-list.ts   纯函数 —— 排序、分组、切页、相关文章、系列（可单测）
 *
 * 页面仍然只从 `utils/posts` 一处引入：下面把 post-list 的结果原样转出，
 * 调用方不用关心某个函数住哪个文件。
 */
import { getCollection } from 'astro:content';
import { postSlug } from './slug';
import { withBase } from './url';
import { byDateDesc, type Post } from './post-list';

export type { Post } from './post-list';

/** 开发环境显示草稿，构建产物里剔除 */
const visible = ({ data }: { data: { draft?: boolean } }) =>
  import.meta.env.DEV ? true : !data.draft;

/** 全部可见文章，时间倒序 */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', visible);
  return posts.sort(byDateDesc);
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

/**
 * /posts/<slug>/ —— slug 由文件名或 front matter 的 `slug` 决定，全小写 ASCII。
 * `withBase` 让子路径部署（`base: '/blog'`）下的链接也正确；默认部署是恒等变换。
 */
export const postUrl = (post: Post) => withBase(`/posts/${slugOf(post)}/`);

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

/** 正文纯文本（去 Markdown 标记），用于摘要与搜索索引 */
export function plainText(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^:{3,}[^\n]*$/gm, ' ') // 自定义容器的 ::: 开关行（remark-directive）
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^---[\s\S]*?---/m, ' ')
    .replace(/[#>*`_~|-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

/* ---------------------------------------------------------------------------
 * 纯函数转出
 * ---------------------------------------------------------------------------
 * 排序 / 分组 / 切页 / 相关文章 / 系列都在 post-list.ts（零 astro:content 依赖，
 * 可单测）。这里原样转出，页面继续 `from '../utils/posts'` 一处引入即可。
 * ------------------------------------------------------------------------- */
export {
  byDateDesc,
  stickyFirst,
  stickyOnly,
  postsWithTerm,
  termUrl,
  groupByYear,
  paginate,
  pageUrlOf,
  tagCounts,
  categoryCounts,
  countOf,
  neighbours,
  relatedPosts,
  seriesOf,
} from './post-list';
export type { SeriesInfo } from './post-list';
