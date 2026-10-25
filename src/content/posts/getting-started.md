---
title: 快速开始：十分钟把站点跑起来
date: 2026-10-21 09:00:00
description: 环境要求、三步启动、目录结构对照，以及第一次改动该改哪个文件。看完这篇就不用再翻文档了。
tags:
  - 上手
  - 安装
  - Node
categories:
  - 指南
cover: ../../assets/covers/cover-1.webp
---

这篇是「指南」系列的第一篇。目标是：**从零到一个能在本地打开的站点，不超过十分钟。**

<div class="note note-info">这是示例站点自带的一篇文档。你 fork 之后可以直接删掉「指南」这个分类下的全部文章，不影响任何功能。</div>

## 环境要求

只有一个硬性条件：**Node ≥ 22.23.4**。这是 Astro 7 的下限，低于这个版本 `astro build` 会直接拒绝执行。

```bash
node -v
# v22.23.4 及以上
```

其余什么都不用装 —— 不需要 Hexo、不需要 Ruby、不需要全局 CLI。包管理器用 npm / pnpm / yarn 都行，仓库里附带的是 `package-lock.json`。

## 三步启动

```bash
git clone https://github.com/capzk/astro-theme-flux.git my-blog
cd my-blog
npm install
npm run dev
```

打开 `http://localhost:4321`，应该能看到全屏 banner 和卡片流。

如果嫌拉 git 历史麻烦，用模板仓库的 **Use this template**，或者：

```bash
npx degit capzk/astro-theme-flux my-blog
```

## 四条常用命令

| 命令 | 作用 | 什么时候用 |
| --- | --- | --- |
| `npm run dev` | 本地开发服务器，热更新 | 写作、调样式 |
| `npm run build` | 构建到 `dist/` | 上线前，也是唯一会做完整校验的一步 |
| `npm run preview` | 预览 `dist/` 的构建产物 | 验证生产环境行为 |
| `npm run check` | `astro check`，类型检查 | 改过 TS / 组件 props 之后 |

第一次跑 `check` 时它会提示安装 `@astrojs/check` 和 `typescript` 两个开发依赖 —— 仓库为了保持干净没有预装，按提示装一次就行。只写文章、不改代码的话，这条命令可以不用。

<div class="note note-warning"><code>dev</code> 和生产构建有两处行为差异，别被本地骗了：草稿（<code>draft: true</code>）只在 dev 里可见；<code>astro sync</code> 生成的内容类型在 dev 里更宽松。</div>

## 目录结构

```
src/
├── config.ts            # ★ 站点配置，90% 的改动都在这里
├── i18n.ts              # 界面文案（中文一份）
├── content.config.ts    # 文章 front matter 的 Zod 校验
├── content/posts/       # ★ 文章 Markdown
├── data/links.ts        # 友链
├── layouts/BaseLayout.astro   # <head>、主题、全局脚本
├── components/          # Navbar / Banner / Board / PostCard / Toc …
├── pages/               # 一个文件一个路由
├── plugins/markdown.js  # 标题锚点、代码块工具栏、外链新窗口
├── scripts/theme.js     # 顶栏、深浅色、目录高亮、复制、回顶、灯箱
├── scripts/search.js    # 站内搜索
└── styles/main.css      # 全部样式（变量分亮暗两套）
```

只有两个文件带 ★，因为它们覆盖了绝大部分需求。剩下的文件是**想看再改**，不看也能跑。

## 第一次改动

按顺序做这三件事，站点就变成「你的」了：

**1. 改站名和作者** —— `src/config.ts`

```ts
export const SITE: SiteConfig = {
  title: '你的站名',
  subtitle: '一句话副标题',
  description: '给搜索引擎和 RSS 用的描述',
  author: '你的名字',
  // …
};
```

**2. 改域名** —— `astro.config.mjs`

```js
export default defineConfig({
  site: 'https://your-domain.com',   // ← 这行必须改
  // …
});
```

它决定了 RSS、sitemap、canonical、Open Graph 里的绝对地址。忘了改的话，分享出去的链接会指向 `example.com`。

**3. 写第一篇文章** —— `src/content/posts/`

```bash
touch src/content/posts/my-first-post.md
```

文件名就是 URL：`my-first-post.md` → `/posts/my-first-post/`。最小 front matter 只要三行：

```yaml
---
title: 我的第一篇文章
date: 2026-10-25 10:00:00
---
```

正文从空行之后开始写。其它字段（分类、标签、封面、置顶、草稿）见《写一篇文章：front matter 与内容组织》。

## 常见问题

**端口被占用**：Astro 会自动往后找端口（4322、4323…），看终端输出即可。想固定就用 `npm run dev -- --port 3000`。

**`astro build` 报 Node 版本不支持**：装个新 Node。Windows 上如果系统里同时有多个版本，注意 `PATH` 里排在前面的那个。

**中文 URL 会不会乱码**：标签和分类页的路径是 `/tags/前端/`，构建产物里是 `dist/tags/前端/index.html`。静态托管一般没问题，但如果你的服务器不做 URL 解码，改用英文标签更省事。

**改了 `config.ts` 没生效**：dev 下改配置会触发整页重载，等一两秒。如果还是旧的，`Ctrl+C` 重开一次。

## 接下来读什么

- 《站点配置详解》—— `config.ts` 每一个字段的取值与效果
- 《写一篇文章》—— front matter 全字段、分类与标签的区别、图片怎么放
- 《换成你自己的样子》—— 配色、字号、版心宽度
- 《部署上线》—— 三种托管方案与常见坑
