/**
 * /rss.xml —— RSS 2.0 订阅源
 * ---------------------------------------------------------------------------
 * 有几处看起来可以省、但省了会被聚合器误判：
 *
 *   · `atom:link rel="self"` 让聚合器知道「这份 XML 的真身就是它」。
 *     没有这一行，某些自建 RSS 服务会把它当成一份「被转载的内容」。
 *   · `lastBuildDate` 必须是**可验证的**：取全站最新一次改动的时间，
 *     而不是构建时刻 —— 每次构建都变的话，feed 天天显示「刚更新」，
 *     同样的内容也会构建出不同的字节，CDN 的 ETag 因此次次失效。
 */
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE } from '../config';
import { excerptOf, getPosts, postUrl } from '../utils/posts';
import { absoluteUrl } from '../utils/seo';
import { withBase } from '../utils/url';

export async function GET(context: APIContext) {
  const posts = await getPosts();
  const origin = context.site ?? new URL('https://example.com');
  const self = absoluteUrl(withBase('/rss.xml'), origin);

  /* 全站最新的一次改动：文章有 updated 用它，否则用发布时间 */
  const feedUpdated = posts
    .map((post) => post.data.updated ?? post.data.date)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return rss({
    title: SITE.title,
    description: SITE.description,
    /* 频道的 <link> 用「首页地址」而不是 origin —— 子路径部署时
       只要 origin 会让读者点进域名根（那里可能根本不是这个站）。
       item 的 link 已经是带前缀的根相对路径，按 origin 解析即可。 */
    site: absoluteUrl(withBase('/'), origin),
    /* <rss> 上要多声明一个 atom 命名空间，下面的 atom:link 才有出处 */
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: excerptOf(post, SITE.rss.excerptLength),
      link: postUrl(post),
      /* RSS 2.0 的 <category> 没有 scheme，分类和标签只能并排给（分类在前）：
         Feedly / Inoreader 这类阅读器靠它做订阅内过滤，不给就白白丢掉一层语义 */
      categories: [...post.data.categories, ...post.data.tags],
      /* 稳定的永久标识：用绝对文章地址（isPermaLink 默认 true，阅读器可直接当链接去重）。
         不用时间戳 —— 改标题、改摘要都不该让阅读器把它当一篇新文章重推 */
      guid: absoluteUrl(postUrl(post), origin),
    })),
    customData: [
      `<language>${SITE.lang}</language>`,
      feedUpdated ? `<lastBuildDate>${feedUpdated.toUTCString()}</lastBuildDate>` : '',
      `<atom:link href="${self}" rel="self" type="application/rss+xml"/>`,
    ]
      .filter(Boolean)
      .join(''),
  });
}
