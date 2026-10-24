/**
 * /searchindex.json —— 构建期生成的搜索索引
 * ---------------------------------------------------------------------------
 * 字段用短名压体积（一篇 1500 字的文章约 1.5KB）：
 *   t = 标题   u = 链接   d = 日期   c = 分类   g = 标签   x = 正文纯文本
 */
import type { APIRoute } from 'astro';
import { getPosts, plainText, postUrl } from '../utils/posts';

export const GET: APIRoute = async () => {
  const posts = await getPosts();

  const index = posts.map((post) => ({
    t: post.data.title,
    u: postUrl(post),
    d: post.data.date.toISOString().slice(0, 10),
    c: post.data.categories.join(' '),
    g: post.data.tags.join(' '),
    x: plainText(post.body ?? '').slice(0, 4000),
  }));

  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
