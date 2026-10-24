---
title: 从 Hexo 迁到 Astro 的对照表
date: 2026-10-08 09:40:00
description: source/_posts、_config.yml、layout、i18n、生成器——Hexo 的每一块在 Astro 里对应什么，一次讲清。
tags:
  - 迁移
  - Hexo
categories:
  - 实现
indexImg: /img/cover-4.svg
---

如果你手上已经有一个用 Fluid 的 Hexo 站点，这张表大概能省下半天时间。

## 目录对照

| Hexo | Astro |
| --- | --- |
| `source/_posts/*.md` | `src/content/posts/*.md` |
| `source/_data/links.yml` | `src/data/links.ts` |
| `themes/fluid/_config.yml` | `src/config.ts` |
| `themes/fluid/layout/*.ejs` | `src/pages/*.astro` + `src/components/*.astro` |
| `themes/fluid/languages/*.yml` | `src/i18n.ts` |
| `hexo-generator-searchdb` | `src/pages/searchindex.json.ts` |

## front matter

大部分字段不用改：

```yaml
---
title: 文章标题
date: 2026-10-08 09:40:00
tags: [迁移, Hexo]
categories: [实现]
index_img: /img/cover-1.svg
sticky: true
---
```

⚠️ 唯一要动的是 `index_img` 的写法。Astro 用驼峰，所以这里写成 `indexImg`；值仍然可以是根路径或完整 URL。

## 链接与路径

`permalink` 不用配。文章 URL 由文件位置决定：`src/content/posts/hello-flux.md` → `/posts/hello-flux/`，和 Hexo 默认的 `:title` 一致。

想让旧链接继续可用，把 `trailingSlash: 'always'` 留着（默认已开），`/posts/hello/` 这种带尾斜杠的地址不会 404。

## 分页

Hexo 的 `per_page` 换成 `SITE.pageSize`。列表页第 1 页在 `/`，第 2 页起在 `/page/N/`——与原版的 `page/2/` 完全一致。

## 搜索

原版靠 `hexo-generator-searchdb` 生成索引，这里由 `src/pages/searchindex.json.ts` 在构建期输出。前端匹配逻辑都写在 `src/scripts/search.js` 里，改权重很方便。

## 最后

迁移的本质不是「把 EJS 翻译成 Astro」，而是**把「谁在什么时候算」想清楚**：能在构建期算的，就不要留给浏览器。想通这一条，剩下的都是体力活。
