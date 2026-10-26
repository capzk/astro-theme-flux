/**
 * 评论 · Waline（构建期）
 * ---------------------------------------------------------------------------
 * 这里只做三件事：把 SITE 里的配置翻成 Waline 认的选项、算出要下发的 JSON、
 * 再把流量统计小插件的地址拼出来。挂载在 client/waline.js。
 *
 * @see https://waline.js.org/reference/client/props.html
 */
import type { CommentConfig, WalineConfig } from '../config';
import type { CommentContext, CommentPayload, CommentProvider, CommentStat } from './types';
import { originsOf } from './origin';

/** jsDelivr 上的 v3 客户端。换 CDN 或自托管时 js/css 一起换，版本要对得上 */
const DEFAULT_JS = 'https://cdn.jsdelivr.net/npm/@waline/client@3/dist/waline.js';
const DEFAULT_CSS = 'https://cdn.jsdelivr.net/npm/@waline/client@3/dist/waline.css';

/**
 * 从主包地址推出同版本小插件的地址。
 *
 * 官方的 `pageview.js` / `comment.js` 和 `waline.js` 是同一批产物（同一目录、
 * 同一版本号），所以只换文件名就行 —— 但文件名可能带版本后缀，两种都得认：
 *   /npm/@waline/client@3/dist/waline.js   → …/dist/pageview.js
 *   /waline/waline-3.16.1.js               → /waline/pageview-3.16.1.js
 * 推不出来（用户改成了别家的路径）就回落到 CDN 的同名文件 —— 至少不会指到一个
 * 404 上，代价是那一块又走跨境。
 */
function sibling(js: string, name: 'pageview' | 'comment'): string {
  const swapped = js.replace(/(^|\/)waline([^/]*\.js)(\?.*)?$/, `$1${name}$2`);
  if (swapped !== js) return swapped;
  return DEFAULT_JS.replace(/(^|\/)waline([^/]*\.js)$/, `$1${name}$2`);
}

/**
 * SITE.lang（BCP 47）→ Waline 认的语言名。
 * 它只认固定几个值，且大小写敏感（`zh-TW` 有效、`zh-tw` 会回落到英文），
 * 所以这里逐条映射，认不出来的统一给 en —— 总比给一份中文界面强。
 */
function walineLang(lang: string): string {
  const l = lang.toLowerCase();
  if (l.startsWith('zh')) {
    return /-(tw|hk|mo|hant)\b/.test(l) || l.includes('hant') ? 'zh-TW' : 'zh-CN';
  }
  if (l.startsWith('ja') || l.startsWith('jp')) return 'jp';
  if (l.startsWith('ru')) return 'ru';
  if (l.startsWith('fr')) return 'fr';
  if (l.startsWith('pt')) return 'pt-BR';
  return 'en';
}

/**
 * 评论归属的路径。构建期算好写进页面，运行期不再依赖 window.location ——
 * 带 `?utm=…` 之类的查询参数访问时不会被当成一篇新文章。
 */
function pathOf(config: WalineConfig, ctx: CommentContext): string {
  if (config.path === 'href') return ctx.href;
  return config.path || ctx.path;
}

export const waline: CommentProvider<WalineConfig> = {
  type: 'waline',
  label: 'Waline',

  configOf: (comment: CommentConfig) => comment.waline,

  ready: (config): config is WalineConfig => Boolean(config && config.serverURL),

  diagnose: () => "comment.waline.serverURL 还没填 —— 注释掉也不算数，指向 Waline 服务端才生效",

  build(config, ctx): CommentPayload {
    return {
      js: config.js || DEFAULT_JS,
      css: config.css || DEFAULT_CSS,
      /* 标题上那枚「N 条评论」由 Waline 回填到这个 class 里 */
      countClass: 'waline-comment-count',
      init: {
        serverURL: config.serverURL,
        path: pathOf(config, ctx),
        lang: config.lang || walineLang(ctx.lang),
        /* 主题的暗色挂在 html 的这个属性上（见 BaseLayout 的首帧脚本），
           Waline 认选择器，会自己盯着它切 —— 不用我们在脚本里同步 */
        dark: config.dark === undefined ? ctx.dark : config.dark,
        locale: config.locale,
        meta: config.meta,
        requiredMeta: config.requiredMeta || [],
        login: config.login,
        emoji: config.emoji,
        /* GIF 搜索依赖服务端配置，默认关 —— 开了而服务端没配，按钮点了没反应 */
        search: config.search ?? false,
        reaction: config.reaction,
        commentSorting: config.commentSorting,
        wordLimit: config.wordLimit,
        pageSize: config.pageSize || 10,
        /* 上传默认关：没配存储的服务端会退回 Base64 内嵌，一条评论几十 KB 进库 */
        imageUploader: config.imageUpload === true ? undefined : false,
        noCopyright: config.noCopyright,
        noRss: config.noRss,
        recaptchaV3Key: config.recaptchaV3Key,
        turnstileKey: config.turnstileKey,
        /* 顺带回填标题上的评论数（找 .waline-comment-count，见上面 countClass）。
           页面里没有那个元素时它什么都不做，所以不必再判断一次 */
        comment: true,
      },
    };
  },

  /** 服务端要握手，客户端脚本（CDN 或自托管）也要握手 */
  origins(config): string[] {
    return originsOf(config.serverURL, config.js || DEFAULT_JS, config.css || DEFAULT_CSS);
  },

  /**
   * 浏览量：Waline 单独的 `pageview.js`（gzip < 1KB），和评论区互不依赖。
   * 所以「评论关掉、只统计阅读量」这种用法是成立的。
   */
  pageview(config, ctx): CommentStat | null {
    if (!config.pageview) return null;
    return {
      js:
        typeof config.pageview === 'string'
          ? config.pageview
          : sibling(config.js || DEFAULT_JS, 'pageview'),
      exportName: 'pageviewCount',
      className: 'waline-pageview-count',
      path: pathOf(config, ctx),
      /* update: true —— 取数的同时把这一页的浏览量 +1 */
      options: { serverURL: config.serverURL, update: true },
    };
  },
};
