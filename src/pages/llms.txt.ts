/**
 * /llms.txt —— 给 AI 爬虫的站点索引
 * ---------------------------------------------------------------------------
 * 约定见 https://llmstxt.org：一个 Markdown 文件，说明「这个站是什么、有哪些
 * 值得读的页面」，比 robots.txt（只说不许抓）和 sitemap（只有 URL 列表）多一层
 * 语义。模型读完这一页就知道该不该来、来了该看哪几篇。
 *
 * 为什么不直接把 sitemap 给它：sitemap 里混着分页、分类、标签，一篇好文章和
 * `/tags/前端/page/3/` 在它眼里是同一种东西。这里只列正文，并带上摘要。
 *
 * 只列最近 N 篇：文件要小到能塞进上下文，剩下的一律指向归档页。
 */
import type { APIRoute } from 'astro';
import { SITE } from '../config';
import { excerptOf, getPosts, postUrl } from '../utils/posts';
import { isPageEnabled } from '../utils/pages';
import { absoluteUrl } from '../utils/seo';

/** 列多少篇。50 篇 × 约 120 字 ≈ 6KB，够模型判断，又不至于把一个站塞爆 */
const RECENT = 50;

export const GET: APIRoute = async ({ site }) => {
  const origin = site ?? new URL('https://example.com');
  const url = (path: string) => absoluteUrl(path, origin);

  const posts = await getPosts();
  const recent = posts.slice(0, RECENT);
  const latest = posts[0]?.data.date;

  const lines: string[] = [
    `# ${SITE.title}`,
    '',
    `> ${SITE.description}`,
    '',
    `- 作者：${SITE.author}`,
    `- 语言：${SITE.lang}`,
    `- 文章数：${posts.length}${latest ? `，最近更新 ${latest.toISOString().slice(0, 10)}` : ''}`,
    `- 全文订阅：${url('/rss.xml')} · ${url('/atom.xml')}`,
    `- 全站正文（一次抓完）：${url('/llms-full.txt')}`,
    '',
    '## 文章',
    '',
    ...recent.map(
      (post) =>
        `- [${post.data.title}](${url(postUrl(post))}): ${excerptOf(post, 120)}` +
        `（${post.data.date.toISOString().slice(0, 10)}）`,
    ),
    '',
    '## 页面',
    '',
    `- [归档](${url('/archives/')}): 全部文章按年份排列`,
    `- [分类](${url('/categories/')}): 按主题分组`,
    `- [标签](${url('/tags/')}): 按关键词分组`,
  ];

  /* 关于页与友链页是可关开关的（src/config/user/pages.ts），关掉就别在这里
     留一个只会跳首页的地址 —— 爬虫会把它当成「站点结构」记下来 */
  if (isPageEnabled('about')) lines.push(`- [关于](${url('/about/')}): 站点与作者介绍`);
  if (isPageEnabled('links')) lines.push(`- [友链](${url('/links/')}): 推荐的其他站点`);

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
