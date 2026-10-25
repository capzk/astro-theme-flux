---
title: URL 与 slug：把地址栏收拾干净
date: 2026-10-25 19:00:00
slug: post-url
description: 文章地址默认怎么生成、front matter 的 slug 怎么写、中文怎么转拼音、两篇撞车时会发生什么，以及改完地址之后怎么补救。
tags: [URL, slug, front-matter]
categories: [指南]
indexImg: /img/cover-4.svg
---

地址栏是读者最先看到、也是最后会用到的东西。写得好，一条链接扔进聊天窗口就能自解释；写得随意，它会变成一串 `%E4%B8%AD%E6%96%87`，复制三遍就断一次。

这篇只讲一件事：**一篇文章的 URL 是怎么算出来的**，以及什么时候该手动接管。你正在读的这一篇自己就是例子 —— 文件放在 `src/content/posts/guide/` 下，地址却是 `/posts/guide/post-url/`，目录来自文件位置，最后一段来自 front matter。

## 默认：文件路径就是地址

文章放在 `src/content/posts/` 下，路径去掉扩展名就是地址，子目录原样进 URL：

```
src/content/posts/
├── hello-flux.md              →  /posts/hello-flux/
├── 2026/
│   └── yearly-review.md       →  /posts/2026/yearly-review/
└── 年度总结.md                 →  /posts/nian-du-zong-jie/
```

第三行值得多看一眼：文件名是中文，地址却是拼音。**地址里不会出现中文** —— 这是硬规则，下面会讲它怎么做到的。

这条默认规则和 Hexo 的 `:title` 占位符基本一致，但比 Hexo 宽松一点：不同目录下的同名文件路径不同，所以不冲突。

## 想换地址：写 slug

在 front matter 加一行 `slug`，就能把最后一段换成你想要的：

```yaml
---
title: URL 与 slug：把地址栏收拾干净
date: 2026-10-25 19:00:00
slug: post-url
---
```

`slug` 有两种写法，区别只在于带不带 `/`：

| 写法 | 文件在哪 | 实际地址 |
| --- | --- | --- |
| 不写 | `getting-started.md` | `/posts/getting-started/` |
| 不写 | `2026/yearly-review.md` | `/posts/2026/yearly-review/` |
| `slug: hello` | `getting-started.md` | `/posts/hello/` |
| `slug: year-review` | `2026/yearly-review.md` | `/posts/2026/year-review/` |
| `slug: life/year-review` | `2026/yearly-review.md` | `/posts/life/year-review/` |

- **只写一段**：替换文件名那一段，子目录保留。适合「目录代表专题、最后一段代表文章」的结构。
- **写了 `/`**：整条路径都由 `slug` 决定，文件放在哪个目录不再参与。适合临时把一篇文章挪到别的专题下，又不想动文件。

<div class="note">`slug` 只影响 URL，不影响排序、分类、标签，也不影响「上一篇/下一篇」的顺序 —— 那些只看 `date`。</div>

## 清洗规则

不管是文件名还是你自己写的 `slug`，都要过同一道工序。目标是：**地址里只剩小写字母、数字和 `-`**。

| 输入 | 输出 | 做了什么 |
| --- | --- | --- |
| `Hello World` | `hello-world` | 小写，空格转 `-` |
| `我的第一篇文章` | `wo-de-di-yi-pian-wen-zhang` | 中文转拼音 |
| `重庆火锅` | `chong-qing-huo-guo` | 多音字按词组取音 |
| `C++ 与 Rust` | `c-yu-rust` | 标点丢弃，`C` 保留 |
| `café` | `cafe` | 去掉变音符号 |
| `2026 Q1 总结` | `2026-q1-zong-jie` | 数字与英文原样保留 |

几条细节：

- **多音字按词组判断**，不是逐字查表。`重庆` 是 `chong-qing` 而不是 `zhong-qing`，`音乐` 是 `yin-yue` 而不是 `yin-le`。这类判断覆盖了常见词组，但中文的多音字本来就没有 100% 的方案，遇到人名、生僻词，写 `slug` 更稳。
- **每段最多 80 个字符**，超出截断。够放二十多个汉字，正常情况下碰不到。
- **emoji 和纯符号会被丢掉**。如果一个名字清洗完什么都不剩（比如文件名就是一个 `🎉`），构建会**直接失败**并提示你写 `slug` —— 静默生成一个 `/posts//` 比报错难查得多。
- 目录名同样过这道工序。用一个中文目录名建文件夹，URL 里也不会出现中文。

## 两篇撞到同一个地址

`我的文章.md` 和 `wo-de-wen-zhang.md` 会算出同一个地址。这种事在拼音方案里是真实存在的风险（同音字），所以构建时会检查：

```
以下文章生成了同一个 URL（后一篇会覆盖前一篇）：
  /posts/same-name/
    - clash-a
    - clash-b
给其中一篇加 `slug:` 指定别的路径，或改掉重名的文件名。
```

为什么不让后一篇覆盖前一篇就算了：两篇文章都会出现在首页、归档和 sitemap 里，但磁盘上只有一个页面文件。读者点进去，总有一篇是错的 —— 而你在列表里看不出任何异常。**构建期失败是这里唯一正确的选择。**

## 地址改了，旧链接怎么办

改了文件名或 `slug`，就等于改了 URL。已经发出去的链接、搜索引擎的收录、别人的收藏夹，全都指向旧地址。

静态站点没有服务端路由，补救办法是在托管平台配重定向。Cloudflare Pages 认 `public/_redirects`（和 `_headers` 放一起）：

```
/posts/old-name/  /posts/new-name/  301
/posts/2026/*     /posts/archive/:splat  301
```

`301` 是永久重定向，权重会传给新地址；临时换着玩用 `302`。GitHub Pages 不支持这种写法，只能用 `meta refresh` 的静态页面凑合，效果差得多。

<div class="note note-warning">最省事的做法是**发布之前**就把 URL 定好。真要改，一次改完、一次配齐重定向，别让旧链接悬在半空。</div>

## 几条建议

1. **发布后就别再改**。URL 不是标题，不需要跟着内容一起迭代。
2. **slug 短一点、有语义**。`post-url` 比 `2026-10-25-url-and-slug-guide` 好记，也比 `p123` 有信息量。
3. **中文文件名不用怕**，拼音方案能兜住。但涉及人名、多音字、生造词时，显式写一个 `slug` 更可控。
4. **用目录做专题**。`/posts/guide/...`、`/posts/notes/...` 比把所有文章摊在 `/posts/` 下更好逛，而且不影响每篇文章自己的 `slug`（只要它不带 `/`）。
