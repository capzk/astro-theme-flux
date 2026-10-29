/**
 * 评论系统 · 注册表与解析
 * ---------------------------------------------------------------------------
 * 页面模板只跟这里打交道，不认任何具体评论系统的名字：
 *
 *   hasCommentForm(SITE.comment, post.data.comment)  → 这一篇要不要评论区
 *   <Comments />                                     → 组件内部自己解析
 *
 * 加一个评论系统 = 写一个 provider（本目录）+ 一个 mounter（client/ 目录），
 * 然后在下面两处各加一行。别的文件都不用动。
 */
import type { CommentConfig } from '../config';
import type {
  CommentContext,
  CommentProvider,
  CommentType,
  RecentCommentsSpec,
  ResolvedComments,
} from './types';
import { artalk } from './artalk';
import { giscus } from './giscus';
import { waline } from './waline';
import { warnOnce } from './warn';

/** 暗色模式的判定选择器。主题固定写在 html 的 data 属性上，见 BaseLayout 首帧脚本 */
export const DARK_SELECTOR = 'html[data-user-color-scheme="dark"]';

/**
 * 注册表。`type` 窄化成字面量，键名和 config 里的 `type` 一一对应。
 *
 * 这里把各家统一存成 `CommentProvider<any>`：调用方只按 `type` 取，不关心具体配置，
 * 而 `never` / `unknown` 这种「安全的擦除」在调用 build(config) 时都会把参数收窄成
 * never，反而要一堆断言。配置本身在 src/config 里已经按 type 约束过一遍了。
 */
type AnyProvider = CommentProvider<any>;

const LIST: readonly AnyProvider[] = [waline, giscus, artalk];

const PROVIDERS = new Map<CommentType, AnyProvider>(
  LIST.map((provider) => [provider.type, provider]),
);

/** 支持评论系统的名单，给配置校验和文档用 */
export const COMMENT_TYPES = LIST.map((provider) => provider.type);

function providerOf(comment: CommentConfig): AnyProvider | null {
  const provider = PROVIDERS.get(comment.type);
  if (!provider) {
    warnOnce(
      `type:${comment.type}`,
      `[flux] src/config 里的 comment.type = ${JSON.stringify(comment.type)} 没有实现，` +
        `可选：${COMMENT_TYPES.join(' / ')}。评论区已跳过。`,
    );
  }
  return provider ?? null;
}

/**
 * 配好没有 —— 配好了才拿得到 provider，否则 null。
 * 各家的「配好」标准不同（Waline 要 serverURL，Giscus 要 repo + repoId），
 * 交给各自的 `ready()` 判断，主题不写 if。
 */
function configured(comment: CommentConfig): AnyProvider | null {
  const provider = providerOf(comment);
  if (!provider) return null;

  const config = provider.configOf(comment);
  if (!provider.ready(config)) {
    /* 只在真打算用这一家的时候才提示：留着另一家的空配置是常态，不该刷警告 */
    if (comment.enable) {
      warnOnce(
        `ready:${provider.type}`,
        `[flux] 评论系统选了 ${provider.label}，但 ${provider.diagnose()}。` +
          `文章页暂时不显示评论区。`,
      );
    }
    return null;
  }
  return provider;
}

/** 这一篇要不要评论区。front matter 的 `comment: false` 优先于全局开关 */
export function hasCommentForm(comment: CommentConfig, postComment?: boolean): boolean {
  if (!comment.enable || postComment === false) return false;
  return configured(comment) !== null;
}

/** 解析出评论区 / 最新评论两块，各管各的 */
export function resolveComments(comment: CommentConfig, ctx: CommentContext): ResolvedComments {
  const provider = configured(comment);
  if (!provider) return { section: null, recent: null };

  const config = provider.configOf(comment);
  const section = comment.enable
    ? { ...provider.build(config, ctx), type: provider.type, lazy: comment.lazy }
    : null;

  const recent =
    comment.enable && comment.recent?.enable === true
      ? (provider.recent?.(config, ctx, {
          count: comment.recent.count ?? 5,
          length: comment.recent.length ?? 60,
        }) ?? null)
      : null;

  return { section, recent };
}

/** 只要最新评论挂件。任何一家不支持就是 null，组件据此整块不渲染 */
export function resolveRecent(comment: CommentConfig, ctx: CommentContext): RecentCommentsSpec | null {
  return resolveComments(comment, ctx).recent;
}

/**
 * 这一页要提前握手的域名（喂给 `<link rel="preconnect">`）。
 * 评论没开、或者没了配置，就返回空数组 —— 空数组不会产生多余标签。
 */
export function commentOrigins(comment: CommentConfig): string[] {
  const provider = configured(comment);
  if (!provider?.origins) return [];
  return provider.origins(provider.configOf(comment));
}

/**
 * 拼一份 CommentContext。页面只给 Astro.url，其余语言、暗色选择器由这里补。
 * `path` 可以覆盖 —— 例如关于页想让留言板归到 `/about/` 而不是当前地址。
 */
export function commentContext(
  url: URL,
  options: { site?: URL | undefined; lang: string; path?: string },
): CommentContext {
  const path = options.path || url.pathname;
  return {
    path,
    href: new URL(path, options.site ?? url.origin).href,
    lang: options.lang,
    dark: DARK_SELECTOR,
  };
}

export type { CommentContext, CommentSection, RecentCommentsSpec } from './types';
