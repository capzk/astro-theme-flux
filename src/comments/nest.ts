/**
 * 评论 · Nest（构建期）
 * ---------------------------------------------------------------------------
 * 自研评论服务（<https://github.com/capzk/nest>）。这里做三件事：把 SITE 里的配置
 * 翻成组件认的选项、算出要下发的 JSON、给出要提前握手的域名。
 * 真正的挂载在 client/nest.js。
 *
 * 与另外三家的差别，都在这几十行里体现：
 *
 *   · 没有 CSS 入口 —— 样式在 `comment.min.js` 里以字符串形式内联，挂进 Shadow DOM。
 *     所以 `css` 永远不下发，Comments.astro 不会去拉一个不存在的样式文件；
 *   · 没有 `countClass` —— 服务端不暴露评论条数的 DOM 钩子，标题上那枚「N 条」
 *     自然不渲染（与 Artalk 一样）；
 *   · 没有 `recent` —— 只有「按页取评论」，没有全站时间线接口，挂件整块不出。
 *
 * @see https://github.com/capzk/nest/blob/main/docs/EMBED.md
 */
import type { CommentConfig, NestConfig } from '../config';
import type { CommentContext, CommentPayload, CommentProvider } from './types';
import { originsOf } from './origin';

/** 服务端自己托管产物，默认地址就是这个 */
const WIDGET_PATH = '/widget/comment.min.js';

/** 尾部斜杠去掉：反代常把它一起带进来，拼出来会变成 `//widget/...` */
function trim(server: string): string {
  return server.replace(/\/+$/, '');
}

/**
 * 把版本号挂到脚本地址上。
 *
 * 组件脚本的响应头是 `public, max-age=300`（服务端 `app.ts` 里写死的），所以升级
 * Nest 之后，读者浏览器里那份旧脚本最多还会活 5 分钟 —— 期间新评论接口已经在跑新
 * 代码，前端还是旧的，排查起来像见鬼。版本号进了查询串，URL 就是一个新的缓存键，
 * 读者下次打开页面拿到的立刻是新脚本。
 *
 * 不填就原样返回，行为退回「最多旧 5 分钟」，不会坏。这和 Waline 那段
 * `version: '3.16.1'` 是同一个思路：**升级时改一行配置**，而不是靠缓存自己过期。
 */
function withVersion(url: string, version?: string): string {
  const v = version?.trim();
  if (!v) return url;
  /* 自定义的 js 可能自带查询串（CDN 的 ?t=123 之类），别拼出两个 ? */
  return `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(v)}`;
}

/** 组件脚本的最终地址：自定义 js 优先，否则服务端默认路径，两者都吃 `version` */
function jsOf(config: NestConfig, server: string): string {
  return withVersion(config.js || `${server}${WIDGET_PATH}`, config.version);
}

/**
 * 评论归属的 page_key。
 *
 * 和 Waline / Artalk 一个口径：构建期算好写进页面，运行期不读 `window.location` ——
 * 带 `?utm=…` 访问时不会被当成一篇新文章。默认就是当前页路径，
 * 已有站点的评论因此能按同一份 key 迁过来。
 */
function pageKeyOf(config: NestConfig, ctx: CommentContext): string {
  if (config.pageKey === 'href') return ctx.href;
  return config.pageKey || ctx.path;
}

export const nest: CommentProvider<NestConfig> = {
  type: 'nest',
  label: 'Nest',

  configOf: (comment: CommentConfig) => comment.nest,

  ready: (config): config is NestConfig => Boolean(config && config.server?.trim()),

  diagnose: () =>
    'comment.nest.server 还没填 —— 注释掉也不算数，指向 Nest 服务端才生效' +
    '（形如 https://comment.example.com）',

  build(config, ctx): CommentPayload {
    const server = trim(config.server.trim());
    return {
      js: jsOf(config, server),
      /* 没有独立样式文件：组件把样式内联进 Shadow DOM，见文件头说明 */
      init: {
        server,
        pageKey: pageKeyOf(config, ctx),
        pageSize: config.pageSize || 20,
        /* heading / theme 没配就不下发：组件对缺省值的处理分别有语义
           （不画标题；跟随系统），而 mounter 要靠「theme 缺失」判断
           该不该跟着博客的深浅色走 —— 传个默认值过去就没法区分了 */
        ...(config.heading ? { heading: config.heading } : {}),
        ...(config.theme ? { theme: config.theme } : {}),
      },
    };
  },

  /**
   * 要提前握手的域名。
   *
   * 组件脚本是懒加载的，等滚到评论区再握手就多一个跨境往返；页面 head 里先握好，
   * 到时候只剩传输时间。只有服务端一个域名 —— 组件不加载任何第三方资源
   * （人机验证是本地算的工作量证明，不外连）。
   */
  origins(config): string[] {
    return originsOf(config.server, jsOf(config, trim(config.server.trim())));
  },
};
