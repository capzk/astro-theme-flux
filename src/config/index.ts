/**
 * Flux · 配置总出口
 * ---------------------------------------------------------------------------
 * 全站只认一个东西：从 `src/config` 导入的 `SITE`。
 *
 *   你改的地方          src/config/user/          ← 只写差异
 *   主题的出厂默认值    src/config/defaults.ts    ← 升级时被替换，别改
 *   类型契约            src/config/types.ts       ← 字段含义都写在这
 *   合并规则            src/config/merge.ts       ← 三十行，读得完
 *   构建期体检          src/config/validate.ts    ← 读文件系统、挑「合法但不对」的值
 *
 * 为什么这样分：配置和主题代码混在一个文件里，升级主题就得分清「哪些行是我改的」。
 * 拆开之后，升级只需要整块替换主题文件，`user/` 原样保留 —— 不用备份、不用还原。
 *
 * ⚠️ 这个文件你不需要改。
 *
 * 这个文件只做一件事：把默认值与你的覆盖值合并，然后把结果和类型导出去。
 * 它刻意不碰 node:fs、不读 import.meta.env —— 那样任何 `import { SITE }` 的场合
 * （单测、Node 脚本、将来的 SSR）都会被拖进「构建期才有意义」的假设里。
 * 需要体检时显式调 `reportConfigIssues(SITE, { site: import.meta.env.SITE })`，
 * 调用点只有 BaseLayout（见 src/layouts/BaseLayout.astro）。
 */
import type { SiteConfig } from './types';
import DEFAULT_CONFIG from './defaults';
import USER_CONFIG from './user';
import { deepMerge } from './merge';

/** 默认值 ⊕ 你的覆盖值 = 最终生效的配置（每一项都有值，业务代码不用写 `??` 兜底） */
export const SITE: SiteConfig = deepMerge(DEFAULT_CONFIG, USER_CONFIG);

/* ---------------------------------------------------------------------------
 * 对外的 API
 * ---------------------------------------------------------------------------
 * 全站的导入写法统一是 `import { SITE } from '../config'` —— 目录里的 index.ts。
 * 类型也一起从这里出，组件不用知道配置是怎么拼起来的。
 * ------------------------------------------------------------------------- */
export type {
  NavItem,
  SiteConfig,
  BannerConfig,
  TypingConfig,
  CommentConfig,
  RecentConfig,
  WalineConfig,
  WalineCdn,
  WalineEmojiInfo,
  GiscusConfig,
  ArtalkConfig,
  AnalyticsConfig,
  GoogleAnalyticsConfig,
  UmamiConfig,
  ClarityConfig,
  VerificationConfig,
} from './types';
export type { DeepPartial, UserConfig } from './merge';
export { defineConfig } from './merge';
export { LINKS } from './user/links';
export type { LinkItem } from './user/links';
