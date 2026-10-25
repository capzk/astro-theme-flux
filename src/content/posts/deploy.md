---
title: 部署上线：三种托管方案与常见坑
date: 2026-10-23 16:00:00
description: 构建产物长什么样、GitHub Pages / Vercel / 自建服务器分别怎么配，以及那两个几乎每个人都会踩一次的坑。
tags:
  - 部署
  - GitHub-Pages
  - nginx
categories:
  - 指南
cover: ../../assets/covers/cover-1.webp
---

构建这个主题只产出一堆静态文件，所以「部署」本质上就是**把这些文件放到一个能返回 HTTP 的地方**。没有 Node 运行时、没有数据库、没有环境变量。

## 构建产物长什么样

```bash
npm run build
```

产物在 `dist/`，结构大致是：

```
dist/
├── index.html
├── 404.html
├── rss.xml
├── sitemap-index.xml
├── sitemap-0.xml
├── searchindex.json
├── favicon.svg
├── _astro/                     # 带 hash 的 CSS / JS / 字体
├── img/                        # public/ 原样搬过来
├── posts/hello-flux/index.html # ← 目录式，不是 hello-flux.html
├── tags/写作/index.html
├── page/2/index.html
└── …
```

两个细节值得注意：

1. **每篇文章是一个目录 + `index.html`**（`build.format: 'directory'`），配合 `trailingSlash: 'always'`，URL 是 `/posts/hello-flux/`。这跟 Hexo 的默认行为一致，所以老链接不会 404。
2. **`_astro/` 里的文件名带内容 hash**，可以放心给它们设永久缓存。

本地先验一遍生产行为，比上线后发现问题便宜：

```bash
npm run preview    # 起一个静态服务器指向 dist/
```

<div class="note note-danger">上线前必须改 <code>astro.config.mjs</code> 里的 <code>site</code>。留成 <code>https://example.com</code> 的话，RSS 里的链接、sitemap 的 URL、页面里的 canonical 和 OG 标签全是错的 —— 不报错，但搜索引擎会认为你抄了别人的站。</div>

## 方案一：GitHub Pages

适合：不想花钱、能接受几分钟的构建延迟、仓库公开。

在仓库的 **Settings → Pages → Source** 里选 **GitHub Actions**，然后加一个 workflow：

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: withastro/action@v6

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

（`withastro/action@v6` 是官方当前的版本，默认用 Node 24。如果你看这篇文章时它已经更新了大版本，以 [Astro 官方部署文档](https://docs.astro.build/zh-cn/guides/deploy/github/) 为准。）

`withastro/action` 会自己识别锁文件决定用哪个包管理器、跑 `npm ci`、跑 `npm run build`、把 `dist/` 传成 Pages 的 artifact。你不需要在 workflow 里写 `npm install`。它默认用 Node 24，想指定版本就传 `node-version`。

`site` 填 `https://<用户名>.github.io`；如果用自定义域名，填那个域名，并在 `public/` 下放一个 `CNAME` 文件。

<div class="note note-warning">如果仓库名不是 <code>&lt;用户名&gt;.github.io</code>，站点会部署在 <code>/仓库名/</code> 子路径下。这个主题默认按「根路径部署」写所有绝对路径（<code>/img/…</code>、<code>/favicon.svg</code>、<code>/rss.xml</code>），子路径会全部 404。要么用 <code>&lt;用户名&gt;.github.io</code> 这个仓库名，要么绑自定义域名，别硬扛。</div>

## 方案二：Vercel / Netlify / Cloudflare Pages

适合：想要预览部署（每个 PR 一个独立 URL）、想要 CDN、不想写 workflow。

三家都是纯图形界面或一条命令：

| | 配置 |
| --- | --- |
| **Vercel** | 导入仓库 → Framework 选 Astro（自动识别）→ 直接 Deploy |
| **Netlify** | 导入仓库 → Build command `npm run build` → Publish directory `dist` |
| **Cloudflare Pages** | 导入仓库 → Framework preset 选 Astro → Build output `dist` |

都能识别 Node 版本（读 `engines`），提交后自动构建，几十秒出结果。

这三家在 `site` 上有一个共同点：**先把域名定下来再填**。用 `*.vercel.app` 预览域名也能跑，但等绑了自定义域名再回来改一次是常规操作。

## 方案三：自己的服务器（nginx）

适合：已有 VPS、要自己控制缓存策略、或者站点必须在国内。

把 `dist/` 整个传到服务器（`rsync -av --delete dist/ /var/www/blog/`），然后一段 nginx 配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/blog;
    index index.html;

    # 目录式 URL：/posts/hello-flux/ → /posts/hello-flux/index.html
    location / {
        try_files $uri $uri/ $uri/index.html =404;
    }

    # 带 hash 的静态资源，永久缓存
    location /_astro/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 图片和字体给一个中等缓存期
    location ~* \.(svg|png|jpg|jpeg|webp|woff2)$ {
        expires 30d;
        add_header Cache-Control "public";
    }

    # 自定义 404
    error_page 404 /404.html;

    # HTML 不缓存，保证改完立刻生效
    location ~* \.html$ {
        add_header Cache-Control "no-cache";
    }
}
```

`try_files` 里那行 `$uri/index.html` 是关键 —— 少了它，所有文章页都会 404，而首页正常，很容易误判成「构建坏了」。

用 Caddy 更省事，它默认就会处理 `index.html`：

```
your-domain.com {
    root * /var/www/blog
    file_server
    try_files {path} {path}/ {path}/index.html
}
```

## 那几个几乎人人踩一次的坑

**页面能开，样式全丢**：通常是子路径部署（见上面 GitHub Pages 那段）。检查浏览器控制台里 `_astro/*.css` 是不是 404。

**文章页 404，首页正常**：`try_files` 缺 `$uri/index.html`，或者托管平台把 URL 当成了文件路径。

**改完推上去，看到的还是旧页面**：静态托管的 CDN 缓存。HTML 设 `no-cache`，`_astro/` 设 immutable，这个组合能避免 99% 的困惑。

**RSS 里没有新文章**：检查是不是写了 `draft: true`；也检查 `site` 是否配了正确域名，有些阅读器会因为域名不一致而丢弃条目。

**中英文混排的标签页 404**：`/tags/写作/` 这种中文路径，绝大多数托管平台没问题。但如果 404，多半是服务器没做 URL 解码，换英文标签最省事。

## 上线之后值得做的三件事

1. 把站点提交到 [Google Search Console](https://search.google.com/search-console) 和百度站长平台，提交 `sitemap-index.xml`。
2. 给 `robots.txt` 加一行 `Sitemap: https://your-domain.com/sitemap-index.xml`（`public/robots.txt`）。
3. 自己用手机打开一次 —— 主题在窄屏会隐藏目录、把卡片改成上下堆叠，这些都是看桌面版看不出来的。
