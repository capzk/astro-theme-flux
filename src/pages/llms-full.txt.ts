/**
 * /llms-full.txt —— 全站正文，一次给完
 * ---------------------------------------------------------------------------
 * llms.txt 的官方扩展（见 https://llmstxt.org）：
 *
 *   /llms.txt       → 目录 + 摘要，模型读完知道「该看哪几篇」
 *   /llms-full.txt  → 目录 + 全文，模型一次抓完就能直接回答
 *
 * 两份并存不是冗余：有的客户端只抓一个文件，不想为了「有没有讲到 X」来回
 * 请求十几个 HTML 页面；有的只要目录来省 token。给出去，让它自己挑。
 *
 * 用 Markdown 原文（`post.body`）而不是渲染后的 HTML —— 正文里的表格、代码、
 * 链接在 Markdown 下都还是原样，塞进上下文比一堆 `<div>` 干净得多。
 * front matter 已经被内容集合剥掉了，这里拿到的就是正文。
 *
 * 不设篇数上限，也不截断：这是「全量」端点，截了就不该叫这个名字。
 * 站点大到这份文件不能用时（几 MB），关掉它即可 —— 见 README。
 */
import type { APIRoute } from 'astro';
import { SITE } from '../config';
import { getPosts, plainTextOf, postUrl } from '../utils/posts';
import { isPageEnabled } from '../utils/pages';
import { absoluteUrl } from '../utils/seo';

export const GET: APIRoute = async ({ site }) => {
  const origin = site ?? new URL('https://example.com');
  const url = (path: string) => absoluteUrl(path, origin);

  const posts = await getPosts();

  const lines: string[] = [
    `# ${SITE.title} · 全文`,
    '',
    `> ${SITE.description}`,
    '',
    `- 作者：${SITE.author}`,
    `- 语言：${SITE.lang}`,
    `- 文章数：${posts.length}`,
    `- 仅目录（含摘要）：${url('/llms.txt')}`,
    '',
    '以下按发布时间从新到旧排列。每篇开头是元信息，随后是 Markdown 原文。',
  ];

  for (const post of posts) {
    const { title, date, updated, tags, categories, description } = post.data;
    const body = (post.body ?? '').trim();

    lines.push(
      '',
      '---',
      '',
      `## ${title}`,
      '',
      `- 地址：${url(postUrl(post))}`,
      `- 发布：${date.toISOString().slice(0, 10)}`,
    );
    if (updated) lines.push(`- 更新：${updated.toISOString().slice(0, 10)}`);
    if (categories.length > 0) lines.push(`- 分类：${categories.join(' / ')}`);
    if (tags.length > 0) lines.push(`- 标签：${tags.join(' / ')}`);
    /* description 不总是等于正文开头，模型拿它判断这段是不是自己要的更快 */
    if (description) lines.push(`- 摘要：${description.trim()}`);
    lines.push('', body || plainTextOf(post));
  }

  /* 独立页面：正文不在内容集合里，靠 plainTextOf 拿不到，只能给一行说明。
     关掉的页面不出现 —— 和 llms.txt 保持同一口径 */
  const pages: string[] = [];
  if (isPageEnabled('about')) pages.push(`- [关于](${url('/about/')}): 站点与作者介绍`);
  if (isPageEnabled('links')) pages.push(`- [友链](${url('/links/')}): 推荐的其他站点`);

  if (pages.length > 0) {
    lines.push('', '---', '', '## 其他页面', '', ...pages);
  }

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
