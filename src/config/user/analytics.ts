/**
 * 访客统计 · 站长验证
 * ---------------------------------------------------------------------------
 * 这里其实是**两件不同的事**，只是常常一起配，所以放在一个文件里：
 *
 *   analytics      访客统计 —— 每页加载第三方脚本，数据在对方报表里看
 *   verification   站长认领 —— 只在 head 里出一行 meta，不放脚本、不发请求
 *
 * 统计有三家，**每家一个开关，可以同时开**：
 *
 *   google    GA4 —— 生态最全，境内基本连不上
 *   umami     自托管统计 —— 2KB、不用 Cookie、境内能跑
 *   clarity   热图与会话回放 —— 和上面两个不是一类东西，所以能并存
 *
 * 打开某一家要两步：本段总开关 `enable: true`，再把那一家的 `enable` 也改成 true
 * 并填上 id。只改一家不改总开关，什么都不会输出 —— 这是最容易踩的一步。
 *
 * 示例站三家全关：统计要在读者浏览器里跑第三方脚本，示例站不该替别人做这个决定。
 */
import { defineConfig } from '../merge';

export default defineConfig({
  analytics: {
    /** 总开关。false 时一行标签都不输出，也不会下载任何第三方脚本 */
    enable: false,

    /**
     * Google Analytics 4。
     *
     * 在 GA 后台 → 管理 → 数据流 → 点开你的网站，「衡量 ID」就是 `G-` 开头那一行。
     * 不是「数据流 ID」（纯数字），也不是 `GT-` 的容器 ID —— 填错不会报错，
     * 只是报表永远是空的，所以构建期会拦一道。
     *
     * ⚠️ 境内访问 googletagmanager.com 基本不通，脚本会挂到超时（async，不挡渲染，
     * 但这一页白等一个连接）。读者主要在国内的话，用下面的 Umami 更实际。
     */
    google: {
      enable: false,
      measurementId: '',
    },

    /**
     * Umami —— 开源自托管统计。相对 GA 的三个优势：不用 Cookie（不需要同意弹窗）、
     * 脚本只有 2KB 左右、可以自己部署所以境内也能跑，数据在自己库里。
     *
     * 自托管示例（Docker 起一个，再拿 Caddy / Nginx 挂个域名）：
     *
     *   src: 'https://umami.你的域名/script.js',
     *   websiteId: '3f2a…-…-…',      // 后台 → 网站 → 编辑里的「网站 ID」
     *
     * 用官方云就是 `src: 'https://cloud.umami.is/script.js'`。
     * 也可以反代到主域下走同源（`src: '/stats/script.js'`），省掉一次跨域握手。
     */
    umami: {
      enable: false,
      src: '',
      websiteId: '',
      /**
       * 只在这些域名上统计，逗号分隔，如 `'example.com,www.example.com'`。
       * 不写 = 不限制。填了之后 localhost 和预览部署都不会污染数据。
       *
       * 主题本身已经在构建期做了「只在生产构建里输出」的判断，这一项是第二道闸：
       * 构建期那道管的是 `astro dev`，这道管的是「同一个产物部署到了测试域名」。
       */
      // domains: 'example.com,www.example.com',

      /* 自动记页面浏览。默认开。设 false 就得自己在代码里调 umami.track() */
      autoTrack: true,
      /** 查询参数（`?from=rss`）算不算进页面路径。默认算 */
      excludeSearch: false,
      /** hash（`#某标题`）算不算进页面路径。默认算 */
      excludeHash: false,

      /**
       * 真实用户的 Core Web Vitals（LCP / CLS / INP / TTFB）。默认关。
       *
       * Lighthouse 跑在模拟环境里，这个是你读者的真实网络与设备 —— 想知道优化有没有
       * 落到实处，打开它比看 Lighthouse 分数有用。需要 Umami 3.1+。
       */
      performance: false,
      /**
       * 访客侧 JS 异常上报。默认关。需要 Umami 3.5+。
       * 博客页面脚本很少，一般不会报错；但这是唯一能看到「读者那边挂了」的途径。
       * 打开后可以顺手填 `errorRelease`（如 `'web@1.0.0'`），出问题时能分清是哪个版本。
       */
      errors: false,
      // errorRelease: 'web@1.0.0',

      /**
       * 从 Umami 回读统计 —— 文章阅读量、全站访客数。
       *
       * 上面那些是**往外发**（埋点脚本在读者浏览器里跑），这一段是**往里取**：
       * 构建时调一次 Umami 的只读 API，把数字写进 HTML。所以它不需要前端脚本，
       * 也不需要读者那边联网 —— 页面里就是一个静态数字。
       *
       * 要准备的就一个 key：Umami 后台 → Settings → API keys → 新建，拿到
       * `umami_` 开头那串，填下面的 `apiKey`。它只在构建期的 Node 进程里用，
       * **不会出现在页面里** —— 产出的 HTML/JS 里只有取回来的数字。
       *
       * 仓库是私有的就直接写在这（最省事）；仓库公开才需要改用环境变量
       * `UMAMI_API_KEY`（别把 key 提交上去）。
       *
       * 还有一件事：**数字是构建那一刻的**。今天发的文章，明天不会自己涨 ——
       * 得重新构建。想要实时数字，得自己加一层边缘函数代理，别把密钥塞进页面。
       *
       * 取不到（key 过期、API 抽风、超时）时静默降级：数字消失，构建照常成功。
       */
      stats: {
        /** 默认关。开着就一定会在构建时联网，接口慢会拖慢构建 */
        enable: false,

        /**
         * Umami 的 API key，`umami_` 开头。
         * 留空则去读环境变量 `UMAMI_API_KEY` —— 公开仓库用那条路。
         */
        // apiKey: 'umami_xxxxxxxxxxxxxxxxxxxx',

        /** 文章页 banner 上显示「阅读 1,234 次」。没有数据的文章不显示，而不是显示 0 */
        postViews: true,
        /** 页脚显示全站累计「12,345 次浏览 · 6,789 位访客」 */
        siteTotal: true,

        /**
         * 一次最多取多少条路径。默认 500，够几百篇文章。
         * 超出的部分只是没有阅读量，其余功能不受影响 —— 所以不值得为它加翻页。
         */
        limit: 500,

        /**
         * API 基址。**一般不用填**，从 src 推得出来：
         *   https://umami.你的域名/script.js → https://umami.你的域名/api
         *
         * 两种必须手写的情况：
         *   · src 是站内反代（`/stats/script.js`）—— 构建时没有 origin 可推
         *   · 脚本走 CDN、接口在另一个域名
         */
        // apiUrl: 'https://analytics.你的域名/api',
      },
    },

    /**
     * Microsoft Clarity —— 热图、点击分布、会话回放。
     *
     * 它不是「多少人看了哪篇文章」，而是「读者在页面上怎么点、滚到哪、卡在哪」，
     * 所以可以和 Umami 一起开，两边看的是不同问题。免费、无流量上限。
     *
     * ⚠️ 它**用 Cookie**（`_clck` / `_clsk`），和 Umami 的无 Cookie 正好相反：
     * 面向欧盟读者时按 GDPR 得先拿到同意，主题不会替你弹窗。会话回放还会录到
     * 页面内容，敏感区域先在 Clarity 面板里配好遮罩再上线。
     *
     * projectId 在 Clarity 后台 → 设置 → 概览里，是 10 位左右的字母数字
     * （形如 `abcdefghij`，没有连字符）—— 不是整段安装代码。
     */
    clarity: {
      enable: false,
      projectId: '',
    },
  },

  /**
   * 站长验证 —— 只输出 meta，不放脚本、不发请求。
   *
   * **填的是 content 的值，不是整段标签。** 从平台复制时只取引号里那串：
   *
   *   ✗ <meta name="msvalidate.01" content="ABC123" />
   *   ✓ ABC123
   *
   * 粘整段进来验证必然不过，而平台上只显示「验证失败」，不告诉你原因 ——
   * 构建期会点出来。
   */
  verification: {
    /** Search Console（`google-site-verification`） */
    google: '',
    /** Bing Webmaster Tools（`msvalidate.01`） */
    bing: '',

    /**
     * 其他平台，有几条写几条。`name` 是 meta 的 name 属性，`content` 是值。
     * 常用：
     *
     *   百度搜索资源平台  { name: 'baidu-site-verification', content: 'codeva-xxxxxxxx' }
     *   Yandex            { name: 'yandex-verification',     content: 'xxxxxxxx' }
     *   Pinterest         { name: 'p:domain_verify',         content: 'xxxxxxxx' }
     *
     * `name` 或 `content` 为空的条目会被跳过，不会输出空标签。
     */
    other: [],
  },
});
