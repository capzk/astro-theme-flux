/**
 * 测试用的假文章
 * ---------------------------------------------------------------------------
 * `Post` 是 astro:content 的 CollectionEntry，字段一大堆，但 `post-list.ts` 里
 * 那批纯函数只读 `id` / `data.date` / `data.sticky` / `tags` / `categories` /
 * `series` / `seriesOrder`。这里就只造这几项，其余用断言一次性绕过 ——
 * 不为了「测试能过」把生产类型改宽（那样测试就失去意义了）。
 */
import type { Post } from '../src/utils/post-list';

export interface PostOverrides {
  id?: string;
  /** 接受 `'2026-03-15'` 这种 ISO 日期字符串，省得每处写 new Date */
  date?: string;
  title?: string;
  sticky?: boolean;
  tags?: string[];
  categories?: string[];
  series?: string;
  seriesOrder?: number;
}

export function makePost(overrides: PostOverrides = {}): Post {
  const {
    id = 'demo',
    date = '2026-01-01',
    title = '示例',
    sticky = false,
    tags = [],
    categories = [],
    series,
    seriesOrder,
  } = overrides;

  return {
    id,
    data: { title, date: new Date(date), sticky, tags, categories, series, seriesOrder },
  } as unknown as Post;
}

/** 取某批文章的 id 列表，断言顺序时比一堆对象好读 */
export const idsOf = (posts: Post[]): string[] => posts.map((post) => post.id);
