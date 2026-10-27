/**
 * 评论 · Waline（构建期）
 * ---------------------------------------------------------------------------
 * 这里只做三件事：把 SITE 里的配置翻成 Waline 认的选项、算出要下发的 JSON、
 * 再把流量统计小插件的地址拼出来。挂载在 client/waline.js。
 *
 * 脚本地址不由这个文件写死，而是从 `comment.waline.cdn` 的模板算 —— 换 CDN、
 * 换自托管目录都只改配置一行，见下方 templateOf / asset。
 *
 * @see https://waline.js.org/reference/client/props.html
 */
import type { CommentConfig, WalineConfig } from '../config';
import type { CommentContext, CommentPayload, CommentProvider, CommentStat } from './types';
import { originsOf } from './origin';
import { warnOnce } from './warn';

/** npm 包名，模板里的 `{name}` */
const NAME = '@waline/client';

/**
 * 预置的公共 CDN。想再加一个（比如自己的对象存储域名）在这里加一行即可，
 * 不用改任何组件 —— 剩下的照旧走模板展开。
 */
const PRESETS: Record<string, string> = {
  jsdelivr: 'https://cdn.jsdelivr.net/npm/{name}@{version}/{file}',
  unpkg: 'https://unpkg.com/{name}@{version}/{file}',
  npmmirror: 'https://registry.npmmirror.com/{name}/{version}/files/{file}',
};

const DEFAULT_CDN = 'jsdelivr';
/** 跟着 3.x 的最新版走。锁死版本就写全 `3.16.1` */
const DEFAULT_VERSION = '3';

/**
 * 取 CDN 模板：命中预置名就用预置模板，否则把这个字符串当模板本身。
 *
 * 名字拼错（既不在表里、也不含占位符）时回落到默认 CDN 并提示一次 ——
 * 否则会展开出一串 404 地址，页面上什么都没有，还看不出错在哪。
 */
function templateOf(config: WalineConfig): string {
  const cdn = config.cdn || DEFAULT_CDN;
  const preset = PRESETS[cdn];
  if (preset) return preset;

  if (!cdn.includes('{')) {
    warnOnce(
      `cdn:${cdn}`,
      `[flux] comment.waline.cdn = ${JSON.stringify(cdn)} 不是预置名字，也不像模板` +
        `（缺少 {file} 之类的占位符），已回落到 ${DEFAULT_CDN}。` +
        `预置名：${Object.keys(PRESETS).join(' / ')}`,
    );
    return PRESETS[DEFAULT_CDN] as string;
  }
  return cdn;
}

/**
 * npmmirror 的 `/files/` 只认确定的版本号，`3` 这种范围写法会 404。
 * 其它 CDN 支持 `@3` 这种范围，所以只在指向 npmmirror 时才拦。
 */
function checkExactVersion(template: string, version: string): void {
  if (!/^https?:\/\/registry\.npmmirror\.com\//.test(template)) return;
  if (/^\d+\.\d+\.\d+/.test(version)) return;
  warnOnce(
    `npmmirror:${version}`,
    `[flux] npmmirror 不支持范围版本：comment.waline.version = ${JSON.stringify(version)}，` +
      `请写全版本号（如 '3.16.1'），否则脚本会 404。`,
  );
}

/**
 * 把模板展开成一个文件的实际地址。
 *
 * 模板里的占位符（说明见 src/config 的 WalineCdn）：
 *   {name}     npm 包名，`@waline/client`
 *   {version}  上面 config.version 的值
 *   {file}     包内相对路径，如 `dist/waline.js`
 *   {basename} 文件名主干，`dist/waline.js` → `waline`
 *   {ext}      扩展名，`dist/waline.js` → `js`
 *
 * 认不出的占位符原样留着 —— 比展开成空串更容易发现写错了。
 */
function asset(config: WalineConfig, file: string): string {
  const template = templateOf(config);
  const version = config.version || DEFAULT_VERSION;
  checkExactVersion(template, version);

  const slash = file.lastIndexOf('/');
  const base = file.slice(slash + 1);
  const dot = base.lastIndexOf('.');
  const values: Record<string, string> = {
    name: NAME,
    version,
    file,
    basename: dot === -1 ? base : base.slice(0, dot),
    ext: dot === -1 ? '' : base.slice(dot + 1),
  };
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => values[key] ?? whole);
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
  /* Waline 只认 'es' / 'es-MX'，其它西语变体统一给 es */
  if (l.startsWith('es')) return 'es';
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
      js: asset(config, 'dist/waline.js'),
      css: asset(config, 'dist/waline.css'),
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
        /* 在 el 里渲染评论区本身。v3 用 comment / commentCount 控制「渲染哪一块」，
           不传只挂一个空容器。评论数徽标走它默认的选择器 `.waline-comment-count`，
           正好和上面的 countClass 对上，所以不用额外传 commentCount */
        comment: true,
      },
    };
  },

  /**
   * 要提前握手的域名。
   *
   * 除服务端和客户端脚本之外，两个验证码各有自己的域名 —— 它们的脚本是
   * Waline 在**评论区渲染之后**才注入的，等那时候再握手，用户已经点开评论框了。
   * 这里提前握好，代价只是一个 preconnect（不配就少这行，功能不受影响）。
   */
  origins(config): string[] {
    return originsOf(
      config.serverURL,
      asset(config, 'dist/waline.js'),
      asset(config, 'dist/waline.css'),
      /* Turnstile：脚本、iframe、校验请求都在这一个域名下 */
      config.turnstileKey ? 'https://challenges.cloudflare.com' : undefined,
      /* reCAPTCHA v3：api.js 在 google.com，实际脚本与图标在 gstatic.com */
      config.recaptchaV3Key ? 'https://www.google.com' : undefined,
      config.recaptchaV3Key ? 'https://www.gstatic.com' : undefined,
    );
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
          : asset(config, 'dist/pageview.js'),
      exportName: 'pageviewCount',
      className: 'waline-pageview-count',
      path: pathOf(config, ctx),
      /* update: true —— 取数的同时把这一页的浏览量 +1 */
      options: { serverURL: config.serverURL, update: true },
    };
  },
};
