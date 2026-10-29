/**
 * 页脚
 * ---------------------------------------------------------------------------
 * 三块，各自有开关：站龄、订阅入口、ICP 备案。
 *
 * 默认值的意思是：**站龄和订阅入口开着，备案关着**。备案是境内托管才需要的东西，
 * 海外托管、写给自己看的站都没有 —— 默认摆一行空的「京ICP备」是脏数据。
 */
import { defineConfig } from '../merge';

export default defineConfig({
  footer: {
    /**
     * 版权行文案。支持 {since} / {year} / {title}；留空则自动
     * 「© 起始年–今年 站点标题 · 保留所有权利」。想改就取消注释并调整：
     */
    // copyright: '© {since} {title} · 保留所有权利',

    /**
     * 「已运行 N 天」。
     *
     * `since` 是建站日期，写 `'2024-03-15'`。**留空就用 `site.since` 那一年的
     * 1 月 1 日** —— 大多数人记不清具体哪一天开始写，只记得年份，那就别逼着填。
     *
     * 天数在浏览器里算，不是构建期定死的：静态站可能一年不重新构建，
     * 定死的数字会停在构建那天。
     */
    runtime: {
      enable: true,
      since: '2026-01-01',
    },

    /**
     * RSS / Atom / Sitemap 三个入口。
     * 它们是对外接口，藏着没好处；想做成极简页脚再设 false。
     */
    links: true,

    /**
     * 第二行「技术栈」胶囊。每项 { label, href, icon? }，icon 可选
     * astro / vercel / cloudflare / flux / github / link。空数组 = 不显示这一行。
     * 数组整体替换（不做合并），想加自己的部署方 / 友链就往里加。
     */
    poweredBy: [
      { label: 'Built with Astro', href: 'https://astro.build/', icon: 'astro' },
      { label: 'Theme Flux', href: 'https://github.com/capzk/astro-theme-flux', icon: 'flux' },
      { label: 'Hosted on Vercel', href: 'https://vercel.com/', icon: 'vercel' },
      { label: 'CDN by Cloudflare', href: 'https://www.cloudflare.com/', icon: 'cloudflare' },
    ],

    /**
     * ICP 备案信息。**默认关**，需要时才打开 —— 打开的三个步骤：
     *
     *   1. `enable: true`
     *   2. `text` 填备案号原文，如 `'京ICP备12345678号-1'`（带 `-1` 的那种要写全）
     *   3. `link` 一般不用改，工信部要求备案号链接到 beian.miit.gov.cn
     *
     * 网页上的备案号必须**可点击跳转**，纯文本挂着不算合规，所以这里默认带了链接。
     */
    beian: {
      /* 这里是示例占位，上线前换成你真实的备案号 */
      enable: true,
      text: '京ICP备12345678号-1',
      link: 'https://beian.miit.gov.cn/',
    },
  },
});
