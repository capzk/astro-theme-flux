/**
 * Flux · 构建期配置体检
 * ---------------------------------------------------------------------------
 * 这里回答一个问题：配置「合法但不对」时，能不能在构建输出里直接说清楚？
 * 比如：评论区开着却没填服务端地址、ogImage 指向 SVG、导航是空数组。
 *
 * 为什么从 src/config/index.ts 拆出来：
 *   体检要读文件系统（public/ 里有没有这张图）、要读 Astro 注入的 site，
 *   而 SITE 本身应当只是「默认值 ⊕ 用户值」的纯数据。混在一起的话，
 *   任何 import SITE 的场合（单测、Node 脚本、未来的 SSR）都会被迫带上
 *   node:fs 与 process.cwd() 的假设。
 *
 * 依赖全部走参数注入（publicDir / fileExists / site），所以这个模块本身可测：
 *   inspect(config, { site: 'https://x.test', fileExists: () => true })
 *
 * 调用点：BaseLayout 首次渲染时调一次（reportConfigIssues 内部有幂等守卫）。
 * 只在构建 / 开发的服务端执行，不会进浏览器产物。
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import DEFAULT_CONFIG from './defaults';
import type { SiteConfig } from './types';

export interface InspectOptions {
  /** Astro 的 site（绝对地址），用于「还是示例域名」这类判断 */
  site?: string;
  /** public/ 的绝对路径，默认 <cwd>/public */
  publicDir?: string;
  /** 文件存在性判断，默认 fs.existsSync；单测可注入 */
  fileExists?: (absPath: string) => boolean;
}

export function inspect(config: SiteConfig, options: InspectOptions = {}): string[] {
  const publicDir = options.publicDir ?? join(process.cwd(), 'public');
  const fileExists = options.fileExists ?? ((abs: string) => existsSync(abs));
  const siteUrl = options.site ?? '';
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
    return fileExists(join(publicDir, rel)) ? null : src;
  };

  for (const [key, src] of [
    ['banner.img', config.banner.img],
    ['postBanner.img', config.postBanner.img],
    ['ogImage', config.ogImage],
    ['avatar', config.avatar],
    ['favicon', config.favicon],
    ['appleTouchIcon', config.appleTouchIcon],
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

  if (comment.enable && comment.type === 'giscus') {
    const g = comment.giscus;
    if (!g?.repo?.trim()) {
      issues.push(
        'comment.type 是 giscus 且 enable 为 true，但 giscus.repo 是空的 —— 评论区不会出现。' +
          '去 https://giscus.app 填仓库信息，把生成的 repo / repoId 抄到 user/comment.ts。',
      );
    } else if (!g?.repoId?.trim()) {
      issues.push(
        'giscus.repo 填了，但 giscus.repoId 是空的 —— 评论区会白屏（iframe 载入失败）。' +
          '在 https://giscus.app 生成完整配置后把 repoId（R_kgDO… 开头）也抄过来。',
      );
    }
    /* category 与 categoryId 需要同时填；只填其一时 Giscus 会忽略分类并退回仓库默认，
       但容易让人以为配置生效了，所以提示一句 */
    if (g?.category?.trim() && !g?.categoryId?.trim()) {
      issues.push(
        `giscus.category 填了「${g.category}」但 giscus.categoryId 是空的 ——` +
          ' Giscus 会忽略分类设置，退回仓库的默认分类。' +
          '在 https://giscus.app 生成配置时 categoryId（DIC_kwDO… 开头）和 category 是一对，一起复制。',
      );
    }
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

  /* 头像是 SVG 时页面照常显示，但 JSON-LD 的 Organization.logo 会被跳过
     （Google 不渲染 SVG logo）—— 富媒体结果里就没有品牌图了。 */
  if (config.avatar && /\.svg(\?|$)/i.test(config.avatar)) {
    issues.push(
      `avatar 指向 SVG（${config.avatar}）—— 页面能正常显示，但结构化数据的 Organization.logo ` +
        '会缺失（Google 只认 PNG/JPG 这类位图）。想让搜索结果 / 知识面板出现 logo，换成 png 头像。',
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
  /* 手机端卡片流的篇数：0 会让手机首页只剩一个「全部文章」按钮（页面不崩，
     但看起来像坏了），所以按错误处理。 */
  if (config.index.mobileFeed.count < 1) {
    issues.push(
      `index.mobileFeed.count 是 ${config.index.mobileFeed.count} —— 手机首页至少展示 1 篇。` +
        '想彻底不要卡片流就把 mobileFeed.enable 改 false（改回门户版式）。',
    );
  }

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
     构建期由调用方从 `import.meta.env.SITE` 取出来传进 options.site。 */
  const EXAMPLE_SITE = /(^https?:\/\/)?(localhost|127\.0\.0\.1|example\.(com|org|net)|.*\.pages\.dev)/i;
  /* pages.dev 既是模板占位，也是 Cloudflare Pages 的正规免费域名 ——
     真部署在那上的站不该每次构建都被念一句。所以对 pages.dev 多要求一步：
     地址或身份还带着模板指纹（示例站域名、没改过的标题/作者）才报；
     localhost 不分情境，总是报。 */
  const TEMPLATE_FINGERPRINT =
    /astro-theme-flux\.pages\.dev/i.test(siteUrl) ||
    config.title === DEFAULT_CONFIG.title ||
    config.author === DEFAULT_CONFIG.author;
  if (siteUrl && EXAMPLE_SITE.test(siteUrl) && (!/\.pages\.dev/i.test(siteUrl) || TEMPLATE_FINGERPRINT)) {
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

/**
 * 跑一次体检并把结果打到控制台。幂等：一次构建只输出一次，不会 77 页刷 77 遍。
 * 返回 issues 方便测试与将来接 CI（比如把某些项升级成构建失败）。
 */
let reported = false;

export function reportConfigIssues(config: SiteConfig, options: InspectOptions = {}): string[] {
  if (reported) return [];
  reported = true;

  const issues = inspect(config, options);
  if (issues.length > 0) {
    console.warn(
      `\n\x1b[33m[Flux] 配置检查发现 ${issues.length} 处需要注意的地方：\x1b[0m\n` +
        issues.map((text, i) => `  ${i + 1}. ${text}`).join('\n') +
        '\n  改完重新构建即可，这些提示不影响当前构建。\n',
    );
  }
  return issues;
}
