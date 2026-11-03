/**
 * 评论系统 · 构建期 provider 的回归测试
 * ---------------------------------------------------------------------------
 * 评论抽象层的核心承诺是「配置进 JSON，JSON 出选项」—— 中间这份翻译
 * （CDN 模板展开、语言映射、giscus 的 data 属性取值、默认值兜底）全是纯函数，
 * 却一直没有测试。页面上一句「评论区白屏」往往就是这里某一行坏了。
 *
 * 只测 src/comments/ 的构建期一侧；浏览器挂载（client/*.js）碰 DOM，
 * 不在这份的范围里（理由同 vitest.config.ts 头注释）。
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { commentContext, commentOrigins, hasCommentForm, resolveComments } from '../src/comments';
import { artalk } from '../src/comments/artalk';
import { giscus } from '../src/comments/giscus';
import { waline } from '../src/comments/waline';
import type { ArtalkConfig, CommentConfig, GiscusConfig, WalineConfig } from '../src/config';
import type { CommentContext } from '../src/comments/types';

/** 每个测试后把 console.warn 的清场做掉，避免 warnOnce 之外的噪声漏进结果 */
afterEach(() => vi.restoreAllMocks());

const ctx: CommentContext = {
  path: '/posts/hello/',
  href: 'https://example.dev/posts/hello/',
  lang: 'zh-CN',
  dark: 'html[data-user-color-scheme="dark"]',
};

/** 造一份只填了关键项的 CommentConfig；类型上其余字段由 defaults 填满，测试不需要 */
const asComment = (over: Partial<CommentConfig>): CommentConfig => over as CommentConfig;
const asWaline = (over: Partial<WalineConfig>): WalineConfig =>
  ({ serverURL: 'https://w.test', ...over }) as WalineConfig;

describe('waline · CDN 模板展开', () => {
  it('默认走 jsdelivr，js 与 css 各一个地址', () => {
    const payload = waline.build(asWaline({}), ctx);
    expect(payload.js).toBe('https://cdn.jsdelivr.net/npm/@waline/client@3/dist/waline.js');
    expect(payload.css).toBe('https://cdn.jsdelivr.net/npm/@waline/client@3/dist/waline.css');
    expect(payload.countClass).toBe('waline-comment-count');
  });

  it('unpkg / npmmirror 预置名展开正确', () => {
    expect(waline.build(asWaline({ cdn: 'unpkg' }), ctx).js).toContain('https://unpkg.com/');
    expect(waline.build(asWaline({ cdn: 'npmmirror', version: '3.16.1' }), ctx).js).toContain(
      'https://registry.npmmirror.com/@waline/client/3.16.1/files/dist/waline.js',
    );
  });

  it('自定义模板支持全部占位符', () => {
    const payload = waline.build(
      asWaline({ cdn: 'https://my.cdn/{name}/{version}/{basename}.{ext}', version: '3.16.1' }),
      ctx,
    );
    expect(payload.js).toBe('https://my.cdn/@waline/client/3.16.1/waline.js');
    expect(payload.css).toBe('https://my.cdn/@waline/client/3.16.1/waline.css');
  });

  it('cdn 写成不认识的名字：回落 jsdelivr 并提示一次', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const payload = waline.build(asWaline({ cdn: 'jsdlier' /* 手滑少了字母 */ }), ctx);
    expect(payload.js).toContain('cdn.jsdelivr.net');
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('锁版本号会体现在地址里', () => {
    const payload = waline.build(asWaline({ version: '3.16.1' }), ctx);
    expect(payload.js).toContain('@waline/client@3.16.1/');
  });
});

describe('waline · build 选项', () => {
  it('默认值：path 取页面、lang 映射站点语言、暗色用主题的 data 属性、分页 10、上传关', () => {
    const init = waline.build(asWaline({}), ctx).init as Record<string, unknown>;
    expect(init.path).toBe('/posts/hello/');
    expect(init.lang).toBe('zh-CN');
    expect(init.dark).toBe(ctx.dark);
    expect(init.pageSize).toBe(10);
    expect(init.imageUploader).toBe(false);
    expect(init.comment).toBe(true);
  });

  it('语言映射：ja → jp、zh-TW 保留大小写、认不出的给 en', () => {
    const lang = (site: string) => waline.build(asWaline({}), { ...ctx, lang: site }).init.lang;
    expect(lang('ja-JP')).toBe('jp');
    expect(lang('zh-TW')).toBe('zh-TW');
    expect(lang('zh-Hant-HK')).toBe('zh-TW');
    expect(lang('de-DE')).toBe('en');
  });

  it('path 配置优先于页面路径；"href" 取整页地址', () => {
    expect(waline.build(asWaline({ path: '/board/' }), ctx).init.path).toBe('/board/');
    expect(waline.build(asWaline({ path: 'href' }), ctx).init.path).toBe(ctx.href);
  });

  it('imageUpload: true 时不传 imageUploader（undefined 键会在 JSON 序列化时掉，服务端自己决定）', () => {
    const init = waline.build(asWaline({ imageUpload: true }), ctx).init as Record<string, unknown>;
    expect(init.imageUploader).toBeUndefined();
    expect(JSON.parse(JSON.stringify({ init })).init.imageUploader).toBeUndefined();
  });
});

describe('waline · origins 与 recent 接口', () => {
  it('预连接含服务端与 CDN；验证码域名只在配了 key 时出现', () => {
    const plain = waline.origins!(asWaline({}));
    expect(plain).toContain('https://w.test');
    expect(plain).toContain('https://cdn.jsdelivr.net');
    expect(plain).not.toContain('https://challenges.cloudflare.com');

    const withTurnstile = waline.origins!(asWaline({ turnstileKey: 'k' }));
    expect(withTurnstile).toContain('https://challenges.cloudflare.com');
  });

  it('recent 端点剥掉尾部斜杠，count 与 pageSize 都给', () => {
    const spec = waline.recent!(asWaline({ serverURL: 'https://w.test/' }), ctx, {
      count: 5,
      length: 60,
    });
    expect(spec!.endpoint).toBe('https://w.test/comment?type=recent&count=5&pageSize=5');
  });
});

describe('giscus', () => {
  const cfg = (over: Partial<GiscusConfig>): GiscusConfig =>
    ({ repo: 'u/r', repoId: 'R_x', ...over }) as GiscusConfig;

  it('repoId 缺一个就不算 ready（评论区整块不渲染，而不是白屏 iframe）', () => {
    expect(giscus.ready({ repo: 'u/r' } as GiscusConfig)).toBe(false);
    expect(giscus.ready(cfg({}))).toBe(true);
  });

  it('data 属性默认值：pathname 映射、懒加载关掉、元数据不发、输入框在下', () => {
    const init = giscus.build(cfg({}), ctx).init as Record<string, unknown>;
    expect(init.mapping).toBe('pathname');
    expect(init.loading).toBe('eager');
    expect(init.emitMetadata).toBe('0');
    expect(init.inputPosition).toBe('bottom');
    expect(init.themeLight).toBe('light');
    expect(init.themeDark).toBe('dark');
    /* strict / reactions 的开关值必须落成字符串 '0'/'1'，giscus 认属性不认布尔 */
    expect(init.strict).toBe('0');
    expect(init.reactionsEnabled).toBe('1');
  });

  it('mapping: specific 时才下发 term', () => {
    const init = giscus.build(cfg({ mapping: 'specific', term: 'hello' }), ctx).init as Record<
      string,
      unknown
    >;
    expect(init.term).toBe('hello');
    const other = giscus.build(cfg({ mapping: 'title', term: 'hello' }), ctx).init as Record<
      string,
      unknown
    >;
    expect(other.term).toBeUndefined();
  });

  it('亮暗两套主题分开传，且不会混入 theme 键（data-theme 只能有一个值）', () => {
    // client/giscus.js 靠解构剔除这两个键再写 dataset；这里锁定它们在 payload.init
    // 里、键名不变 —— 改任何一边都必须同步另一边，否则暗色读者会看到亮色界面。
    const payload = giscus.build(cfg({ theme: { light: 'cyanosis', dark: 'dimma' } }), ctx);
    const init = payload.init as Record<string, unknown>;
    expect(init.themeLight).toBe('cyanosis');
    expect(init.themeDark).toBe('dimma');
    expect('theme' in init).toBe(false);
  });

  it('origins 只有 giscus.app 一个域名', () => {
    expect(giscus.origins!(cfg({}))).toEqual(['https://giscus.app']);
  });
});

describe('artalk', () => {
  const cfg = (over: Partial<ArtalkConfig>): ArtalkConfig =>
    ({ server: 'https://a.test', site: 'My', ...over }) as ArtalkConfig;

  it('默认走 .mjs 的 ESM 入口（import UMD 拿到的是空命名空间）', () => {
    const payload = artalk.build(cfg({}), ctx);
    expect(payload.js).toBe('https://cdn.jsdelivr.net/npm/artalk@2/dist/Artalk.mjs');
    expect(payload.css).toBe('https://cdn.jsdelivr.net/npm/artalk@2/dist/Artalk.css');
    /* 不设 countClass → Comments.astro 自然不为它渲染「N 条」徽标 */
    expect(payload.countClass).toBeUndefined();
  });

  it('pageKey 与分页默认值', () => {
    const init = artalk.build(cfg({}), ctx).init as Record<string, unknown>;
    expect(init.pageKey).toBe('/posts/hello/');
    expect(init.pagination).toEqual({ pageSize: 20 });
    expect(init.locale).toBe('zh-CN');
  });
});

describe('注册表（index.ts）', () => {
  const walineReady = asComment({
    enable: true,
    type: 'waline',
    lazy: 600,
    waline: { serverURL: 'https://w.test' } as WalineConfig,
  });

  it('没开总开关 / 单篇关掉 / 没配好，三种情况都不出评论区', () => {
    expect(hasCommentForm(asComment({ enable: false, type: 'waline' }))).toBe(false);
    expect(hasCommentForm(walineReady, false)).toBe(false);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(
      hasCommentForm(asComment({ enable: true, type: 'waline', waline: {} as WalineConfig })),
    ).toBe(false);
  });

  it('resolveComments 把 type 与 lazy 盖进 section', () => {
    const { section } = resolveComments(walineReady, ctx);
    expect(section?.type).toBe('waline');
    expect(section?.lazy).toBe(600);
  });

  it('recent 挂件只有 Waline 提供；空配置时是 null 而不是空壳', () => {
    const withRecent = asComment({
      ...walineReady,
      recent: { enable: true, count: 5, length: 60 },
    });
    expect(resolveComments(withRecent, ctx).recent?.type).toBe('waline');
    const giscusEmpty = asComment({ enable: true, type: 'giscus', giscus: {} as GiscusConfig });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveComments(giscusEmpty, ctx)).toEqual({ section: null, recent: null });
  });

  it('commentOrigins：未配置返回空数组，不往 head 塞多余标签', () => {
    expect(commentOrigins(asComment({ enable: false, type: 'waline' }))).toEqual([]);
    expect(commentOrigins(walineReady)).toContain('https://w.test');
  });

  it('commentContext 的 path 覆盖会带着 href 一起走', () => {
    const c = commentContext(new URL('https://example.dev/posts/hello/'), {
      lang: 'zh-CN',
      path: '/board/',
    });
    expect(c.path).toBe('/board/');
    expect(c.href).toBe('https://example.dev/board/');
  });
});
