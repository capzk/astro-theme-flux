/**
 * 评论 · Giscus（构建期）
 * ---------------------------------------------------------------------------
 * Giscus 不是 ES 模块，而是一个「带 data-* 属性、插进页面就自己干活」的传统脚本。
 * 所以它的 payload 里 `init` 全是 giscus 的 data 属性（驼峰的，挂载时转成 data-*）。
 *
 * 它不提供评论数 —— 不设 `countClass`，标题旁边那枚徽标就不出现。
 *
 * @see https://giscus.app
 */
import type { CommentConfig, GiscusConfig } from '../config';
import type { CommentPayload, CommentProvider } from './types';

const SCRIPT = 'https://giscus.app/client.js';
const ORIGIN = 'https://giscus.app';

/** 默认配色：跟主题的亮/暗两套走。换成别的见 https://giscus.app 的 Theme 一栏 */
const LIGHT = 'light';
const DARK = 'dark';

export const giscus: CommentProvider<GiscusConfig> = {
  type: 'giscus',
  label: 'Giscus',

  configOf: (comment: CommentConfig) => comment.giscus,

  ready: (config): config is GiscusConfig => Boolean(config && config.repo && config.repoId),

  diagnose: () => 'comment.giscus.repo / repoId 还没填 —— 这两项在 https://giscus.app 填完仓库后生成',

  /** 脚本和 iframe 都在 giscus.app，握手一次两条连接都能复用 */
  origins: () => [ORIGIN],

  build(config): CommentPayload {
    const theme = config.theme || {};
    return {
      js: SCRIPT,
      /* giscus 的样式全在它自己的 iframe 里，没有外链 CSS */
      init: {
        repo: config.repo,
        repoId: config.repoId,
        category: config.category,
        categoryId: config.categoryId,
        /* 默认按 pathname 映射，和 Waline 的 path 行为一致：换域名不丢评论 */
        mapping: config.mapping || 'pathname',
        term: config.mapping === 'specific' ? config.term : undefined,
        strict: config.strict ? '1' : '0',
        reactionsEnabled: config.reactionsEnabled === false ? '0' : '1',
        emitMetadata: '0',
        inputPosition: config.inputPosition || 'bottom',
        lang: config.lang,
        /* 懒加载由主题的 lazy 管，别让它自己再拖一层 */
        loading: 'eager',
        /* 亮暗两套分开传：挂载时用当前那套，之后由 MutationObserver 切换。
           注意这里**不发** `theme` —— 它会被 data-theme 用掉，而 data-theme
           只能有一个值，混在一起会让暗色读者看到亮色界面 */
        themeLight: theme.light || LIGHT,
        themeDark: theme.dark || DARK,
      },
    };
  },
};
