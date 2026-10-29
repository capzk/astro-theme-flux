/**
 * 访客统计 · 站长验证
 * ---------------------------------------------------------------------------
 * 这里其实是**两件不同的事**，只是常常一起配，所以放在一个文件里：
 *
 *   analytics      访客统计 —— 每页加载一份第三方脚本，数据在对方报表里看
 *   verification   站长认领 —— 只在 head 里出一行 meta，不放脚本、不发请求
 *
 * 最大的一个坑是把它们当成同一件事：
 *
 *   | 你想要的 | 配哪 | 填什么 |
 *   | --- | --- | --- |
 *   | 多少人看了哪篇文章 | analytics | GA4 的 `G-XXXXXXXXXX` 或 Umami 的站点 ID |
 *   | 搜索里哪些词带来了流量 | verification.google | Search Console 的验证串 |
 *   | Bing 的收录与抓取情况 | verification.bing | `msvalidate.01` 的验证串 |
 *
 * **Bing 没有客户端访问统计脚本** —— 它不像 GA 那样给你一段 gtag.js。Bing 的
 * 访问数据并进了 Microsoft Clarity（另一段脚本，在 Clarity 后台单独申请），
 * 所以这里只有 `bing` 这一行验证串，用来认领站点、看搜索与抓取的报表。
 *
 * 两边都默认关闭：统计要在读者浏览器里跑第三方脚本，示例站不该替别人做这个决定。
 */
import { defineConfig } from '../merge';

export default defineConfig({
  analytics: {
    /** 总开关。false 时一行标签都不输出，也不会下载任何第三方脚本 */
    enable: false,

    /**
     * 用哪一家，`'google'` 或 `'umami'`。改这一行就切换，下面两段留着不影响构建。
     *
     * 只支持同时开一家：两套并行会让同一份流量被记两次，之后每次看报表都要先解释
     * 「为什么两边差 8%」。真要迁移期对比几天，把另一家的脚本临时贴进
     * `BaseLayout.astro` 里 head 的末尾，跑完删掉即可。
     */
    type: 'google',

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
      src: '',
      websiteId: '',
      /**
       * 只在这些域名上统计，逗号分隔，如 `'capzk.com,www.capzk.com'`。
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
