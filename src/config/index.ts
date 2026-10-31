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

  /* ---- 门户首页（实验） -----------------------------------------------------
     首页 portal 的数值都有合法区间，越界不会报错，只会让版式静默塌掉：
     `cardsPerRow` 写成 0 → `grid-template-columns: repeat(0, 1fr)` 是非法值，
     整条声明被丢弃、卡片掉成单列；`latest.cols` 同理。这些在页面上不会崩，
     只是「看着不对」，所以提到构建期来说。
     分类名是否真的存在，要拿内容集合去核，这里拿不到 —— 放到 index.astro 里提示。 */
  const { portal } = config.index;
  if (portal.cardsPerRow < 1) {
    issues.push(
      `index.portal.cardsPerRow 是 ${portal.cardsPerRow} —— 每行卡片数至少为 1。` +
        '设成 0 会让卡片网格失效（整行掉成单列）。',
    );
  }
  if (portal.featured < 0) {
    issues.push(`index.portal.featured 是 ${portal.featured} —— 置顶篇数不能为负。`);
  }
  if (portal.heroAutoplay < 0) {
    issues.push(
      `index.portal.heroAutoplay 是 ${portal.heroAutoplay} —— 轮播间隔不能为负（0 表示不自动播放）。`,
    );
  }
  if (portal.latest.count < 0) {
    issues.push(`index.portal.latest.count 是 ${portal.latest.count} —— 最新文章篇数不能为负。`);
  }
  if (portal.latest.cols < 1) {
    issues.push(
      `index.portal.latest.cols 是 ${portal.latest.cols} —— 列数至少为 1（0 会让列表格式失效）。`,
    );
  }
  portal.categories.forEach((cat, i) => {
    if (!cat.name.trim()) {
      issues.push(`index.portal.categories[${i}].name 是空的 —— 这一项会被跳过，写个分类名。`);
    }
    if (cat.layout === 'card' && cat.rows !== undefined && cat.rows < 1) {
      issues.push(
        `index.portal.categories「${cat.name}」的 rows 是 ${cat.rows} —— 卡片行数至少为 1。`,
      );
    }
    if (cat.layout === 'list' && cat.cols !== undefined && cat.cols < 1) {
      issues.push(
        `index.portal.categories「${cat.name}」的 cols 是 ${cat.cols} —— 列表列数至少为 1。`,
      );
    }
    if (cat.count !== undefined && cat.count < 1) {
      issues.push(
        `index.portal.categories「${cat.name}」的 count 是 ${cat.count} —— 展示篇数至少为 1。`,
      );
    }
  });

  /* ---- 页脚 ---------------------------------------------------------------
     这两项错了都不会报错，只是页脚少一行 / 少一处内容，而页脚恰恰是最没人
     盯着看的地方，所以更值得在构建时说一句。 */
  const { footer } = config;
  if (footer.beian.enable && !footer.beian.text.trim()) {
    issues.push(
      'footer.beian.enable 是 true，但 footer.beian.text 是空的 —— 页脚不会出现备案那一行。' +
        '填上备案号原文（如 "京ICP备12345678号-1"），或者把 enable 改回 false。',
    );
  }
  if (footer.runtime.enable && footer.runtime.since && Number.isNaN(Date.parse(footer.runtime.since))) {
    issues.push(
      `footer.runtime.since 是 "${footer.runtime.since}"，解析不出日期 —— 应该写成 2024-03-15 这样。` +
        '现在的效果是页脚不显示站龄（不会报错，只是那一行没了）。',
    );
  }

  /* ---- 访客统计 -----------------------------------------------------------
     这三项填错的症状高度一致：页面照常生成，脚本也照常下载，只是报表里一条数据
     都没有 —— 而报表恰恰是「没人天天盯着」的东西，可能一个月后才发现。
     所以在构建期把「格式明显对不上」的值挑出来。 */
  const { analytics, verification } = config;

  if (analytics.enable) {
    const { google, umami, clarity } = analytics;

    /* 同类工具开两个：多半是迁移期对比，也可能只是忘关了一个。
       不拦，但说出来 —— 之后对不上数的时候会想起这句话。 */
    if (google.enable && umami.enable) {
      issues.push(
        'analytics.google 和 analytics.umami 同时开着 —— 同一份流量会被记两次，两边报表永远对不上。' +
          '对比几天之后记得关掉一个。',
      );
    }

    if (google.enable) {
      const id = google.measurementId.trim();
      if (!id) {
        issues.push(
          'analytics.google.enable 是 true，但 analytics.google.measurementId 是空的 —— ' +
            '不会输出统计脚本。去 GA 后台 → 管理 → 数据流里抄「衡量 ID」（G- 开头），或把 enable 改回 false。',
        );
      } else if (!/^G-[A-Z0-9]{4,}$/i.test(id)) {
        issues.push(
          `analytics.google.measurementId 是 "${id}"，不像 GA4 的衡量 ID（应为 G- 开头加一串字母数字）。` +
            (/^UA-/i.test(id)
              ? 'UA- 那套 Universal Analytics 已在 2023 年停服，收不到任何数据 —— 去后台建一个 GA4 数据流。'
              : '注意别填成「数据流 ID」（纯数字）或 GT- 开头的容器 ID，那两个都不会报错，只是没有数据。'),
        );
      }
    }

    if (umami.enable) {
      const src = umami.src.trim();
      if (!src) {
        issues.push(
          'analytics.umami.enable 是 true，但 analytics.umami.src 是空的 —— 不会输出统计脚本。' +
            '填 https://umami.你的域名/script.js（或官方云 https://cloud.umami.is/script.js）。',
        );
      } else if (!/^(https?:\/\/|\/)/.test(src)) {
        issues.push(
          `analytics.umami.src 是 "${umami.src}"，看起来不像地址 —— 应该以 https:// 开头` +
            '（或 / 开头，走站内反代）。',
        );
      }
      if (!umami.websiteId.trim()) {
        issues.push(
          'analytics.umami.enable 是 true，但 analytics.umami.websiteId 是空的 —— ' +
            '脚本会加载但一条数据都不记。去 Umami 后台 → 网站 → 编辑里抄「网站 ID」（一串 UUID）。',
        );
      }
      if (umami.hostUrl && !/^https?:\/\//.test(umami.hostUrl.trim())) {
        issues.push(
          `analytics.umami.hostUrl 是 "${umami.hostUrl}" —— 它是要发数据的地址，` +
            '必须写完整的 https://…（不带结尾斜杠）。只写域名不会报错，只是数据发不出去。',
        );
      }
    }

    if (clarity.enable) {
      const id = clarity.projectId.trim();
      if (!id) {
        issues.push(
          'analytics.clarity.enable 是 true，但 analytics.clarity.projectId 是空的 —— 不会输出脚本。' +
            '去 Clarity 后台 → 设置 → 概览里抄项目 ID，或把 enable 改回 false。',
        );
      } else if (!/^[a-z0-9]{6,20}$/i.test(id)) {
        issues.push(
          `analytics.clarity.projectId 是 "${id}"，不像 Clarity 的项目 ID（10 位左右的字母数字，` +
            '没有连字符和斜杠）。注意别把整段安装代码粘进来。',
        );
      }
    }
  }

  /* 整段标签粘进 content 字段是这一段最常见的错：属性会被当成值的一部分，
     验证必然不过，而平台上只显示「验证失败」，不说为什么。 */
  const verifyValues: [string, string][] = [
    ['verification.google', verification.google],
    ['verification.bing', verification.bing],
    ...verification.other.map((item, i): [string, string] => [
      `verification.other[${i}].content`,
      item.content,
    ]),
  ];
  for (const [key, value] of verifyValues) {
    if (value.includes('<')) {
      issues.push(
        `${key} 里带着 HTML 标签 —— 这里只填 content 的值（引号里那一串），` +
          '整段 <meta> 粘进来验证不会通过。',
      );
    }
  }

  /* ---- 还是示例值 -----------------------------------------------------------
     这几项不改也能跑，站看着完全正常 —— 直到分享链接、RSS 里的地址、canonical、
     og:url 全都指向示例站。这是 fork 主题后最容易漏的一步，而且症状要等别人
     把文章转到群里才看得出来。只在「明显还是模板值」时提示，正常的自定义域名不打扰。

     `site` 不在 SITE 里：它是 astro.config 的顶层字段（绝对 URL 的来源），
     构建期由 Vite 注入到 `import.meta.env.SITE`。这里取回来做同一个体检。 */
  const EXAMPLE_SITE = /(^https?:\/\/)?(localhost|127\.0\.0\.1|example\.(com|org|net)|.*\.pages\.dev)/i;
  const siteUrl = typeof import.meta.env.SITE === 'string' ? import.meta.env.SITE : '';

  if (siteUrl && EXAMPLE_SITE.test(siteUrl)) {
    issues.push(
      `site 还是示例地址（${siteUrl}）—— RSS、canonical、og:url 里的绝对链接都会指向它。` +
        '在 astro.config.mjs 里换成你自己的域名，形如 https://你的域名（结尾不要带斜杠）。',
    );
  }

  if (/example\.(com|org|net)/i.test(config.author) || /example\.(com|org|net)/i.test(config.title)) {
    issues.push(
      `site 的标题 / 作者还是示例值（${config.title} / ${config.author}）—— 改 src/config/user/site.ts。`,
    );
  }

  /* 评论服务端填了但没改过：Waline 的默认示例就是 comment.example.com，
     留着它不会报错，只是评论永远发不出去（域名解析不到） */
  if (config.comment.waline?.serverURL && /example\.(com|org|net)/i.test(config.comment.waline.serverURL)) {
    issues.push(
      `waline.serverURL 里还带着 example.com（${config.comment.waline.serverURL}）—— ` +
        '这是模板里的占位地址，评论会静默提交失败。',
    );
  }

  /* Artalk 同理：server 必须指向真的部署，且 site 名要和后台建站时填的一致，
     否则评论会落到「默认站点」里，后台看不见 */
  if (config.comment.artalk?.server && /example\.(com|org|net)/i.test(config.comment.artalk.server)) {
    issues.push(
      `artalk.server 里还带着 example.com（${config.comment.artalk.server}）—— ` +
        '这是模板里的占位地址，评论会静默提交失败。',
    );
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
