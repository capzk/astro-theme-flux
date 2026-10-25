/**
 * /robots.txt
 * ---------------------------------------------------------------------------
 * 从 astro.config.mjs 的 `site` 拼出来，域名只维护一处 ——
 * fork 的人改了 site，这里跟着变，不会漏。
 */
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const base = (site ?? new URL('https://example.com')).href.replace(/\/$/, '');

  const body = `User-agent: *
Allow: /

Sitemap: ${base}/sitemap-index.xml
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
