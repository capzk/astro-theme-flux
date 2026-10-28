/**
 * /atom.xml —— Atom 1.0 订阅源
 * ---------------------------------------------------------------------------
 * RSS 2.0 已经由 /rss.xml 输出了，为什么还要一份 Atom：两者信息量不一样。
 *
 *   RSS 2.0   `<pubDate>` 只有「发布」，没有「更新」；`<guid>` 是可选的
 *   Atom 1.0  每篇必须有 `<updated>`，还有 `<id>`、`<category term>`、
 *             feed 级的 `<updated>` —— 聚合器能据此判断「是真更新还是重新发了」
 *
 * 有些阅读器（Feedly 的某些配置、一些自建 RSS 服务）对 Atom 的解析更严格也更准，
 * 所以两份都给，读者挑一个订阅。主题里不引第三方库：这个格式的元素就那几个，
 * 手写比带一个依赖更省事，而且能精确控制时间格式。
 *
 * @see https://datatracker.ietf.org/doc/html/rfc4287
 */
import type { APIRoute } from 'astro';
import { SITE } from '../config';
import { excerptOf, getPosts, postUrl } from '../utils/posts';
import { absoluteUrl } from '../utils/seo';

/** XML 里必须转义的五个字符。标题和摘要都来自用户内容，不转义就是一行坏 XML */
const esc = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const GET: APIRoute = async ({ site }) => {
  const origin = site ?? new URL('https://example.com');
  const url = (path: string) => absoluteUrl(path, origin);

  const posts = await getPosts();
  const home = url('/');
  const self = url('/atom.xml');

  /* feed 级的 updated 取「全站最新的一次改动」：文章有 updated 就用它，
     没有就用发布时间。空站退回构建时刻 —— Atom 规定这个字段必须有。 */
  const feedUpdated =
    posts
      .map((post) => post.data.updated ?? post.data.date)
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? new Date();

  const entries = posts.map((post) => {
    const { title, date, updated, tags, categories } = post.data;
    const link = url(postUrl(post));

    /* 分类和标签在 Atom 里是同一种东西（category），用 scheme 区分来源，
       聚合器既能按关键词过滤，也不会把两者混成一堆 */
    const terms = [
      ...categories.map((name) => `    <category term="${esc(name)}" scheme="${esc(url('/categories/'))}"/>`),
      ...tags.map((name) => `    <category term="${esc(name)}" scheme="${esc(url('/tags/'))}"/>`),
    ].join('\n');

    return [
      '  <entry>',
      `    <title>${esc(title)}</title>`,
      `    <link rel="alternate" type="text/html" href="${esc(link)}"/>`,
      /* id 必须永久不变：用文章地址而不是时间戳，改标题也不会让阅读器重推一遍 */
      `    <id>${esc(link)}</id>`,
      `    <published>${date.toISOString()}</published>`,
      `    <updated>${(updated ?? date).toISOString()}</updated>`,
      `    <summary type="text">${esc(excerptOf(post, SITE.rss.excerptLength))}</summary>`,
      `    <author><name>${esc(SITE.author)}</name></author>`,
      terms,
      '  </entry>',
    ]
      .filter(Boolean)
      .join('\n');
  });

  const xml = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="' + esc(SITE.lang) + '">',
    `  <title>${esc(SITE.title)}</title>`,
    `  <subtitle>${esc(SITE.description)}</subtitle>`,
    `  <link rel="alternate" type="text/html" href="${esc(home)}"/>`,
    `  <link rel="self" type="application/atom+xml" href="${esc(self)}"/>`,
    `  <id>${esc(home)}</id>`,
    `  <updated>${feedUpdated.toISOString()}</updated>`,
    `  <author><name>${esc(SITE.author)}</name></author>`,
    '  <generator uri="https://astro.build" version="Astro">Astro</generator>',
    ...entries,
    '</feed>',
    '',
  ].join('\n');

  return new Response(xml, {
    headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' },
  });
};
