/**
 * Flux · 配置总出口
 * ---------------------------------------------------------------------------
 * 全站只认一个东西：从 `src/config` 导入的 `SITE`。
 *
 *   你改的地方          src/config/user/          ← 只写差异
 *   主题的出厂默认值    src/config/defaults.ts    ← 升级时被替换，别改
 *   类型契约            src/config/types.ts       ← 字段含义都写在这
 *   合并规则            src/config/merge.ts       ← 三十行，读得完
 *
 * 为什么这样分：配置和主题代码混在一个文件里，升级主题就得分清「哪些行是我改的」。
 * 拆开之后，升级只需要整块替换主题文件，`user/` 原样保留 —— 不用备份、不用还原。
 * 顺带的好处是 `config.ts` 从 476 行（370 行类型 + 100 行值）变成「类型 / 默认值 /
 * 你的值」三份，各看各的，谁也不挡谁。
 *
 * ⚠️ 这个文件你不需要改。
 */
import type { SiteConfig } from './types';
import DEFAULT_CONFIG from './defaults';
import USER_CONFIG from './user';
import { deepMerge } from './merge';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** 默认值 ⊕ 你的覆盖值 = 最终生效的配置（每一项都有值，业务代码不用写 `??` 兜底） */
export const SITE: SiteConfig = deepMerge(DEFAULT_CONFIG, USER_CONFIG);

/* ---------------------------------------------------------------------------
 * 构建期体检
 * ---------------------------------------------------------------------------
 * 这些错误不会让构建失败（配置本身合法），但会得到一个「看着正常、其实少了东西」
 * 的站点 —— 比如评论区开着却没填服务端地址，页面里连骨架都不渲染，只能靠肉眼发现。
 * 与其让人对着空白文档猜，不如在构建输出里直接说。
 *
 * 只在模块首次求值时跑一次，所以不会 59 个页面刷 59 行。
 * ------------------------------------------------------------------------- */
function inspect(config: SiteConfig): string[] {
  const issues: string[] = [];
  const { comment } = config;

  /* ---- 图片路径 -------------------------------------------------------------
     写成 '/img/x.webp' 时，文件不在 public/ 里不会有任何报错：页面照常生成，
     只是那一块空着（banner 退化成纯色底）。这种「静默失效」最难查 ——
     多半是文件名大小写、扩展名，或者图根本还放在 src/assets。
     外链（http、//）和 import 进来的资源不归这里管。 */
  const missingFile = (src: unknown): string | null => {
    if (typeof src !== 'string' || !src.startsWith('/') || src.startsWith('//')) return null;
    const rel = src.split(/[?#]/)[0].replace(/^\/+/, '');
    if (!rel) return null;
    return existsSync(join(process.cwd(), 'public', rel)) ? null : src;
  };

  for (const [key, src] of [
    ['banner.img', config.banner.img],
    ['postBanner.img', config.postBanner.img],
    ['ogImage', config.ogImage],
    ['index.defaultImg', config.index.defaultImg],
  ] as const) {
    const missing = missingFile(src);
    if (missing) {
      issues.push(
        `${key} 写的是 "${missing}"，但 public/ 下找不到这个文件 —— 那一块会是空白或纯色。` +
          '检查文件名的大小写和扩展名（.webp / .jpg / .png），或者换成就近的 import 写法。',
      );
    }
  }

  if (comment.enable && comment.type === 'waline') {
    const url = comment.waline?.serverURL?.trim() ?? '';
    if (!url) {
      issues.push(
        'comment.type 是 waline 且 enable 为 true，但 waline.serverURL 是空的 —— 文章页不会出现评论区。' +
          '填上你自己的服务端地址（形如 https://comment.example.com），或把 enable 改成 false。',
      );
    } else if (!/^(https?:\/\/|\/)/.test(url)) {
      issues.push(
        `waline.serverURL 是 "${url}"，看起来不像地址 —— 应该以 https:// 开头（或 / 开头走同源）。`,
      );
    }
  }

  if (comment.enable && comment.type === 'giscus' && !comment.giscus?.repo?.trim()) {
    issues.push(
      'comment.type 是 giscus 且 enable 为 true，但 giscus.repo 是空的 —— 评论区不会出现。' +
        '去 https://giscus.app 填仓库信息，把生成的 repo / repoId 抄到 user/comment.ts。',
    );
  }

  if (comment.enable && comment.type === 'waline') {
    const waline = comment.waline;

    /* 两个验证码都配：服务端只按自己的顺序验一个，另一个白配，
       而且客户端两个脚本都会加载 —— 纯浪费，还可能互相干扰 */
    if (waline?.turnstileKey?.trim() && waline?.recaptchaV3Key?.trim()) {
      issues.push(
        'waline.turnstileKey 和 waline.recaptchaV3Key 同时配了 —— 只需要一个。' +
          'Turnstile 国内可直连，推荐留它、删掉 recaptchaV3Key。',
      );
    }

    /* 必填项不在显示项里 = 那个字段根本不出现在表单上，却要求必填 → 谁都提交不了 */
    if (waline?.meta && waline.requiredMeta) {
      const hidden = waline.requiredMeta.filter((key) => !waline.meta?.includes(key));
      if (hidden.length > 0) {
        issues.push(
          `waline.requiredMeta 要求填 ${hidden.join(' / ')}，但 waline.meta 里没有它 —— ` +
            '字段不显示却要求必填，评论永远提交不了。把这项加回 meta，或从 requiredMeta 里去掉。',
        );
      }
    }
  }

  /* 社交平台不吃 SVG，分享出去就是一张空白卡片。默认值里就踩过这个坑，所以拦一道 */
  if (config.ogImage && /\.svg(\?|$)/i.test(config.ogImage)) {
    issues.push(
      `ogImage 指向 SVG（${config.ogImage}）—— 微博 / 微信 / Twitter 不会渲染它，分享卡片会是空白的。` +
        '换成 1200×630 的 PNG 或 JPG。',
    );
  }

  if (config.pageSize < 1) {
    issues.push(`pageSize 是 ${config.pageSize} —— 每页至少要有 1 篇，否则列表页会除零。`);
  }

  if (config.nav.length === 0) {
    issues.push('nav 是空数组 —— 顶栏会一个链接都没有。');
  }

  return issues;
}

const issues = inspect(SITE);
if (issues.length > 0) {
  console.warn(
    `\n\x1b[33m[Flux] 配置检查发现 ${issues.length} 处需要注意的地方：\x1b[0m\n` +
      issues.map((text, i) => `  ${i + 1}. ${text}`).join('\n') +
      '\n  改完重新构建即可，这些提示不影响当前构建。\n',
  );
}

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
  WalineConfig,
  WalineCdn,
  WalineEmojiInfo,
  GiscusConfig,
} from './types';
export type { DeepPartial, UserConfig } from './merge';
export { defineConfig } from './merge';
export { LINKS } from './user/links';
export type { LinkItem } from './user/links';
