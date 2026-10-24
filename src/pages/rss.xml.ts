/**
 * /rss.xml
 */
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE } from '../config';
import { getPosts, plainText, postUrl } from '../utils/posts';

export async function GET(context: APIContext) {
  const posts = await getPosts();

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? 'https://example.com',
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description || plainText(post.body ?? '').slice(0, 160),
      link: postUrl(post),
    })),
    customData: `<language>${SITE.lang}</language>`,
  });
}
