/**
 * 评论 · Artalk（构建期）
 * ---------------------------------------------------------------------------
 * Artalk 是「自建服务端的另一家」：Go 单二进制，前端是一个带静态 `init()`
 * 的类，`Artalk.init(options)` 返回实例，实例上有 `setDarkMode()` / `destroy()` /
 * `reload(pageKey)`。
 *
 * 和 Waline 的两处结构差异，正好说明「provider 只负责翻译配置」这个分工是够用的：
 *
 *   1. Artalk 的 `el` 是**元素**，`pageKey` / `pageTitle` / `darkMode` 要分别取；
 *      这些都不是配置能决定的，所以不在 build 里，而在 client/artalk.js 里补。
 *   2. 它不回填评论数 —— 于是 provider 里不设 countClass，
 *      主题自然不为它渲染「N 条」，一处 if 都不用写。
 *
 * @see https://artalk.js.org/guide/frontend/config.html
 */
import type { ArtalkConfig, CommentConfig } from '../config';
import type { CommentContext, CommentPayload, CommentProvider } from './types';
import { originsOf } from './origin';

/**
 * 默认走 jsDelivr 的 ESM 入口。
 *
 * 为什么是 `.mjs` 而不是 `Artalk.js`：`Artalk.js` 是 UMD，动态 import 一个 UMD
 * 拿到的是空命名空间（它只往 window 上挂全局），还得去读 `window.Artalk`。
 * `.mjs` 是真正的 ES 模块，`import()` 能直接拿到默认导出的类。
 */
const DEFAULT_JS = 'https://cdn.jsdelivr.net/npm/artalk@2/dist/Artalk.mjs';
const DEFAULT_CSS = 'https://cdn.jsdelivr.net/npm/artalk@2/dist/Artalk.css';

/** 评论归属路径。和 Waline 的 path 语义一致：默认当前页面路径 */
function pageKeyOf(config: ArtalkConfig, ctx: CommentContext): string {
  if (config.path === 'href') return ctx.href;
  return config.path || ctx.path;
}

export const artalk: CommentProvider<ArtalkConfig> = {
  type: 'artalk',
  label: 'Artalk',

  configOf: (comment: CommentConfig) => comment.artalk,

  ready: (config): config is ArtalkConfig => Boolean(config && config.server),

  diagnose: () => 'comment.artalk.server 还没填 —— 要指向你自己部署的 Artalk 后端',

  build(config, ctx): CommentPayload {
    return {
      js: config.js || DEFAULT_JS,
      css: config.css || DEFAULT_CSS,
      /* 不设 countClass：Artalk 不回填评论数，设了就是一个永远空着的徽标 */
      init: {
        server: config.server,
        /* site 留空会让评论落进后端的「默认站点」—— 单站用户看不出区别，
           多站就会混在一起，所以这里原样透传，由站主自己对齐 */
        site: config.site,
        pageKey: pageKeyOf(config, ctx),
        /* 站点的 lang 本来就是 BCP 47，Artalk 直接认；缺省给 zh-CN */
        locale: config.locale || ctx.lang || 'zh-CN',
        placeholder: config.placeholder,
        emoticons: config.emoticons,
        pagination: { pageSize: config.pageSize || 20 },
      },
    };
  },

  /** 后端、脚本、样式各在一个地方，三个都值得提前握手 */
  origins(config): string[] {
    return originsOf(config.server, config.js || DEFAULT_JS, config.css || DEFAULT_CSS);
  },
};
