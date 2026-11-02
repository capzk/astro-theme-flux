/**
 * 给 sitemap 补 lastmod
 * ---------------------------------------------------------------------------
 * `@astrojs/sitemap` 只输出 `<loc>`，不告诉搜索引擎「这一页什么时候变过」。
 * 对博客来说这条信息挺有用：改过 `updated` 的文章能让爬虫更愿意重抓，
 * 没有它的页面只能靠自己的调度周期慢慢发现。
 *
 * 为什么不在 `src/pages/sitemap.xml.ts` 自己拼 XML：那样得把首页、归档、
 * 分类、标签、每一档分页都手工枚举一遍，漏一个页面就少一条索引 —— 风险
 * 远大于收益。这里只做「给已有条目补一个日期」，页面由官方集成负责。
 *
 * 匹配不上就**什么都不加**（软失败）：URL 规则将来若变了，最坏结果是退回
 * 「没有 lastmod」的现状，而不是漏掉条目或构建失败。
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { postSlug } from '../src/utils/slug.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const POSTS_DIR = join(ROOT, 'src', 'content', 'posts');

/** 只从 front matter 里取这几个键，够用就行，不引 YAML 解析器 */
const KEYS = ['slug', 'date', 'updated', 'draft'];

/**
 * 极简 front matter 读取：只认 `key: value` 单行写法。
 * 博客的这几个字段就是这么写的；遇到引号包裹、行尾注释也能处理。
 * 解析不出来就当没有，不影响构建。
 *
 * ⚠️ 这是**故意**的第二套解析：内容集合由 Astro 的 schema 校验，那边才是真相；
 * 这里只为了在配置阶段拿到日期（此时内容集合还没同步）。所以刻意只支持
 * 「单行标量」—— 写成多行 YAML（`date:\n  2026-01-01`）或 flow 集合时会被忽略，
 * 结果是「这一页没有 lastmod」，不会给出错误的日期。
 */
function readFrontMatter(raw) {
  const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
  if (!block) return {};

  const out = {};
  for (const line of block[1].split(/\r?\n/)) {
    const match = /^([A-Za-z_]+):\s*(.*)$/.exec(line);
    if (!match || !KEYS.includes(match[1])) continue;

    let value = match[2].trim();
    /* 去掉行尾注释与包裹的引号 */
    value = value.replace(/\s+#.*$/, '').replace(/^['"]|['"]$/g, '');
    if (value) out[match[1]] = value;
  }
  return out;
}

/**
 * `2026-10-20 10:00:00` → `2026-10-20`
 *
 * 只取日期不换算时区：front matter 里的日期是作者写的那一天，
 * 换算成 UTC 反而可能变成前一天。sitemap 的 lastmod 精确到天足够。
 */
function toDate(value, fallback) {
  const iso = /^(\d{4}-\d{2}-\d{2})/.exec(value ?? '');
  return iso ? iso[1] : fallback;
}

/**
 * 建「路径 → 最后修改日期」的映射表。
 * @param {string} base 部署前缀（'/' 或 '/blog'）—— sitemap 给的 URL 含前缀，
 *                      表里的键是逻辑路径，查之前要剥掉
 * @returns {(url: string) => string | undefined}
 */
export function createLastmodResolver(base = '/') {
  const byPath = new Map();
  const prefix = `/${String(base).replace(/^\/+|\/+$/g, '')}`;
  const strip = (pathname) =>
    prefix !== '/' && (pathname === prefix || pathname.startsWith(`${prefix}/`))
      ? pathname.slice(prefix.length) || '/'
      : pathname;

  let files;
  try {
    files = readdirSync(POSTS_DIR, { recursive: true, withFileTypes: true });
  } catch {
    /* 没有文章目录（刚 fork、还没写东西）就全部跳过 */
    return () => undefined;
  }

  for (const entry of files) {
    if (!entry.isFile() || !/\.mdx?$/.test(entry.name)) continue;

    const full = join(entry.parentPath ?? entry.path, entry.name);
    const id = relative(POSTS_DIR, full).split(sep).join('/').replace(/\.mdx?$/, '');

    let raw;
    try {
      raw = readFileSync(full, 'utf8');
    } catch {
      continue;
    }

    const fm = readFrontMatter(raw);
    /* YAML 里 true 的写法不止一种：true / True / yes / 1 都算草稿 */
    if (/^(true|yes|1)$/i.test(fm.draft ?? '')) continue;

    /* 只有 publish 日期时就用它 —— 首次发布的页面也算「变过」 */
    const lastmod = toDate(fm.updated, toDate(fm.date));
    if (!lastmod) continue;

    byPath.set(`/posts/${postSlug(id, fm.slug)}/`, lastmod);
  }

  return (url) => {
    try {
      return byPath.get(strip(new URL(url).pathname));
    } catch {
      return undefined;
    }
  };
}
