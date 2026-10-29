// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';

import {
  codeChrome,
  codeToolbar,
  emailLinks,
  headingAnchors,
  imageLoading,
  imageReferrer,
  linkTargets,
} from './src/plugins/markdown.js';
import { codeMeta } from './src/plugins/shiki.js';
import lqip from './src/integrations/lqip.mjs';
import { createLastmodResolver } from './scripts/sitemap-lastmod.mjs';
import PAGES from './src/config/user/pages.ts';
import { isListPage } from './src/utils/list-pages.ts';

/** 文章路径 → 最后修改日期。匹配不上返回 undefined，sitemap 就退回原样 */
const lastmodOf = createLastmodResolver();

/**
 * 被关掉的页面 → 不该出现在 sitemap 里。
 *
 * 这里只 import 了 `user/pages.ts` 一个文件，没有 import 整个 `src/config` ——
 * 配置目录里的 `user/content.ts` 会 import 一张 webp，而 astro.config 是由
 * esbuild 单独打包的，它不认识图片导入，一旦把整棵配置拉进来，构建会在
 * 「加载配置」这一步就失败。`pages.ts` 因此被刻意写成零依赖的裸对象。
 *
 * 路径表与 `src/utils/pages.ts` 的 `PAGE_PATH` 是同一份 —— 那边是运行时判定，
 * 这边是构建期过滤，两边都不该出现「多一个页面就漏掉」的映射。
 */
const PAGE_PATH = { about: '/about/', links: '/links/' };

const DISABLED_PAGES = new Set(
  Object.entries(PAGES)
    .filter(([, enabled]) => enabled === false)
    .map(([key]) => PAGE_PATH[key])
    .filter(Boolean),
);

/**
 * Flux · 配置
 * ---------------------------------------------------------------------------
 * 换域名只改 `site`。其余默认值都是主题调好的。
 *
 * @see https://docs.astro.build/zh-cn/reference/configuration-reference/
 */
export default defineConfig({
  /* 本站（主题的示例站）部署在 Cloudflare Pages。
     RSS / sitemap / canonical / OG 里的绝对地址都取自这里 ——
     fork 之后第一件事就是把它改成你自己的域名，否则分享出去的链接会指向这里。 */
  site: 'https://astro-theme-flux.pages.dev',

  /* 与 Hexo 版一致：/posts/hello/ 带尾斜杠、目录式输出，旧链接不会 404 */
  trailingSlash: 'always',
  build: { format: 'directory' },

  /**
   * 预取：鼠标悬停在链接上时就把目标页面悄悄取回来。
   *
   * 静态站最值钱的一项优化 —— 导航的感知延迟不是带宽问题，是「点下去才开始
   * 拿文档」那一两个往返。悬停到点击之间通常有 100~300ms，正好够把 HTML 拿下来；
   * 页面其余资源（CSS / JS / 图片）本来就带 hash 长缓存，于是点击几乎是即时的。
   *
   * `hover` 而不是 `viewport`：后者会在页面加载后把所有站内链接都拉一遍，
   * 归档页一百多篇就是一百多个请求。悬停只取「读者真的想去的那一个」。
   *
   * 想关掉某条链接，在 <a> 上写 data-astro-prefetch="false"。
   * @see https://docs.astro.build/zh-cn/guides/prefetch/
   */
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },

  /**
   * sitemap：页面清单交给官方集成（它认得所有分页路由），
   * 我们只补一列 `lastmod` —— 取文章 front matter 的 updated（没有就取 date）。
   * 时间戳来自文章本身，不是构建时间，所以「每天重新构建」不会把它刷成今天。
   *
   * 顺带把两类页面挡在外面：
   *   1. 被关掉的页面 —— 否则搜索引擎会一直去抓一个只会跳首页的地址；
   *   2. 列表页（分页 / 单个标签 / 单个分类）—— 它们的内容是一份文章清单，
   *      和文章本身重复。留下来只会让「真文章」在清单里被稀释。
   *      这些页面上有 `noindex, follow`（BaseLayout 按同一份规则输出），
   *      所以「不在 sitemap」和「页面自己说不许索引」是同一件事，不会打架。
   */
  integrations: [
    /* 占位色：在 astro:config:setup 里算好，挂成 virtual:flux-lqip。
       跑在 Astro 自己的生命周期里 —— 直接 `astro build` 也生效，不依赖 npm scripts。 */
    lqip(),
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname;
        const withSlash = path.endsWith('/') ? path : `${path}/`;
        return !DISABLED_PAGES.has(withSlash) && !isListPage(withSlash);
      },
      serialize(item) {
        const lastmod = lastmodOf(item.url);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],

  markdown: {
    /* 双主题：亮色 github-light / 暗色 github-dark。
       两边都用 github 系是为了贴近 Fluid 原本的 highlight.js 观感。 */
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: false,
      defaultColor: false,
      /* 围栏 meta：行高亮与行号。见 src/plugins/shiki.js */
      transformers: [codeMeta()],
    },
    processor: satteri({
      features: { smartPunctuation: false },
      hastPlugins: [
        headingAnchors(),
        codeChrome(),
        codeToolbar(),
        linkTargets(),
        emailLinks(),
        imageLoading(),
        imageReferrer(),
      ],
    }),
  },

  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
});
