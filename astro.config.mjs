// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';

import { codeChrome, codeToolbar, headingAnchors, linkTargets } from './src/plugins/markdown.js';

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

  integrations: [sitemap()],

  markdown: {
    /* 双主题：亮色 github-light / 暗色 github-dark。
       两边都用 github 系是为了贴近 Fluid 原本的 highlight.js 观感。 */
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: false,
      defaultColor: false,
    },
    processor: satteri({
      features: { smartPunctuation: false },
      hastPlugins: [headingAnchors(), codeChrome(), codeToolbar(), linkTargets()],
    }),
  },

  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
});
