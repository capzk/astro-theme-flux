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

export async function GET(context: APIContext) {
  const posts = await getPosts();
  const origin = context.site ?? new URL('https://example.com');
  const self = absoluteUrl('/rss.xml', origin);

  /* 全站最新的一次改动：文章有 updated 用它，否则用发布时间 */
  const feedUpdated = posts
    .map((post) => post.data.updated ?? post.data.date)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: origin,
    /* <rss> 上要多声明一个 atom 命名空间，下面的 atom:link 才有出处 */
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: excerptOf(post, SITE.rss.excerptLength),
      link: postUrl(post),
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
