/**
 * /searchindex.json —— 构建期生成的搜索索引
 * ---------------------------------------------------------------------------
 * 字段用短名压体积（一篇 1500 字的文章约 1.5KB）：
 *   t = 标题   u = 链接   d = 日期   c = 分类   g = 标签   s = 摘要   x = 正文纯文本
 */
import type { APIRoute } from 'astro';
import { getPosts, plainTextOf, postUrl, excerptOf } from '../utils/posts';

export const GET: APIRoute = async () => {
  const posts = await getPosts();

  const index = posts.map((post) => ({
    t: post.data.title,
    u: postUrl(post),
    d: post.data.date.toISOString().slice(0, 10),
    c: post.data.categories.join(' '),
    g: post.data.tags.join(' '),
    /* s = 摘要：优先 front matter 的 description，否则取正文前 150 字。
       在搜索结果列表里展示，让读者不用点进去就能判断这篇是不是想要的 */
    s: excerptOf(post, 150),
    x: plainTextOf(post).slice(0, 4000),
  }));

  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
