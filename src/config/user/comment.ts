/**
 * 评论
 * ---------------------------------------------------------------------------
 * 四套都在这里，改 `type` 一行就切换 —— 用不到的那段留着不影响构建。
 *
 *   'waline'  自建服务端，功能最全（评论 / 反应 / 登录 / 表情包）
 *   'giscus'  存在 GitHub Discussions，零服务端，只有评论
 *   'artalk'  自建服务端，Go 单二进制、比 Waline 轻，插件少一些
 *   'nest'    自研自托管服务（github.com/capzk/nest），单进程 + SQLite，
 *             组件挂 Shadow DOM、CSS 与主题互不干扰；没有 recent 挂件
 *
 * 示例站默认关闭：这四家都得先有自己的服务端（Giscus 要先开 Discussions），
 * 示例站都没有。所以这里 `enable: false`，页面里连骨架都不渲染。
 *
 * 全量字段说明见 `src/config/types.ts` 的 WalineConfig / GiscusConfig /
 * ArtalkConfig / NestConfig —— 每一项都写了默认值，下面只列最常改的几个。
 */
import { defineConfig } from '../merge';

export default defineConfig({
  comment: {
    enable: false,
    type: 'waline',
    /* 滚到距评论区 600px 时才开始拉脚本；0 表示进页面就拉 */
    lazy: 600,

    /**
     * 文章页底部的「本站最新评论」。
     * 目前只有 Waline 能提供（它的 `/comment?type=recent` 是公开读接口），
     * 换到 giscus / artalk 时这一块自动不出现。
     */
    // recent: { enable: true, count: 5, length: 60 },

    waline: {
      /* 填你自己的服务端地址，例如 'https://comment.example.com' */
      serverURL: '',
      /**
       * 客户端从哪加载：'jsdelivr'（默认）/ 'unpkg' / 'npmmirror'，
       * 或自托管模板 '/waline/{basename}-{version}.{ext}'。
       * 国内 jsDelivr 不稳，换镜像只改这一行。
       */
      // cdn: 'jsdelivr',
      // version: '3.16.1',

      /**
       * 人机验证 —— 三处必须配对，少一处评论就提交不了（详见 README）：
       *
       *   这里      turnstileKey: '<Site Key>'        ← 公开，会被下发到浏览器
       *   服务端    TURNSTILE_KEY=<同一个 Site Key>
       *   服务端    TURNSTILE_SECRET=<Secret Key>    ← 保密，只在服务端
       *
       * 只配这一处：验证框能点，点完提交 403。只配服务端：页面上没验证框，评论直接拒。
       * reCAPTCHA v3 同理（recaptchaV3Key + RECAPTCHA_V3_KEY + RECAPTCHA_V3_SECRET），
       * 两个**只能留一个**，同时配会在构建期收到警告。
       * Turnstile 国内直连可用，推荐。
       */
      // turnstileKey: '',

      locale: { placeholder: '说点什么吧，支持 Markdown…' },
      /* 昵称必填、邮箱选填。想全匿名改成 []。
         注意 requiredMeta 里的项必须在 meta 里显示，否则字段不出现却要求必填 */
      requiredMeta: ['nick'],
      pageSize: 10,
    },

    giscus: {
      repo: '',
      repoId: '',
      mapping: 'pathname',
      reactionsEnabled: true,
      inputPosition: 'bottom',
      theme: { light: 'light', dark: 'dark' },
    },

    artalk: {
      /* 你自己的 Artalk 后端地址，例如 'https://comment.example.com' */
      server: '',
      /**
       * 站点名。**要和 Artalk 后台建站时填的一致**，否则评论会落进
       * 后端的「默认站点」，后台管理列表里看不见。
       */
      site: '',
    },

    nest: {
      /**
       * 你自己的 Nest 服务地址，例如 'https://comment.example.com'。
       * 必须前端可达，且服务端的 ALLOWED_ORIGINS 里写了本站域名 ——
       * 少这一条的表现是「网络异常，请稍后再试」。
       */
      server: '',
      /* 每页几条根评论，默认 20 */
      pageSize: 20,
      /**
       * 服务端版本号，会拼成 `/widget/comment.min.js?v=0.1.0`。
       *
       * 组件脚本的缓存是 `max-age=300`，**升级 Nest 之后浏览器里那份旧脚本最多还会活
       * 5 分钟**。每次升级服务端把这里改成新镜像的 tag，URL 一变就是新的缓存键，
       * 下次打开页面立刻是新脚本。不填只是回到「最多旧 5 分钟」，不影响功能。
       */
      // version: '0.1.0',
    },
  },
});
