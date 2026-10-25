---
title: 写一篇文章：front matter 与内容组织
date: 2026-10-22 15:00:00
description: 文件放哪、文件名如何变成 URL、front matter 的每个字段、分类与标签的区别，以及正文里有哪些开箱可用的语法。
tags:
  - 写作
  - front-matter
  - 内容组织
categories:
  - 指南
indexImg: /img/cover-3.svg
---

主题把「一篇文章」定义成一个 Markdown 文件。没有后台、没有数据库 —— 你在编辑器里存盘，站点就变了。

这一篇讲清楚三件事：**文件怎么放、头部怎么写、正文能用什么。**

## 文件放哪，URL 长什么样

文章统一放在 `src/content/posts/` 下，可以建子目录：

```
src/content/posts/
├── getting-started.md          →  /posts/getting-started/
├── 2026/
│   └── yearly-review.md        →  /posts/2026/yearly-review/
```

**路径去掉扩展名，就是 URL。** 带子目录时子目录也会进 URL。

这个规则和 Hexo 的 `:title` 占位符一致，所以从 Hexo 迁过来的旧链接一般不会 404。但如果两篇文章出现在不同目录、文件名相同，路径不同所以不冲突 —— 这一点比 Hexo 宽松。

<div class="note note-warning">改了文件名等于改了 URL，等于让已被收藏、被搜索引擎收录的链接失效。要换文件名，最好在静态托管侧配一条 301 重定向。</div>

## front matter 全字段

只有 `title` 和 `date` 是必填的，其余都有默认值：

```yaml
---
title: 文章标题                  # 必填
date: 2026-10-22 15:00:00        # 必填，同时决定排序
updated: 2026-10-24 09:30:00     # 可选，有值时正文顶部显示「最后更新于」
description: 列表与 SEO 用的摘要   # 可选，建议写
tags: [写作, Markdown]           # 可选，字符串数组
categories: [指南]                # 可选，字符串数组
indexImg: /img/cover-3.svg       # 可选，首页卡片封面
sticky: false                    # 可选，置顶
draft: false                     # 可选，草稿
toc: true                        # 可选，单篇覆盖右侧目录开关
bannerImg: /img/banner-2.svg     # 可选，单篇 banner 图
bannerMaskAlpha: 0.5             # 可选，0~1
---
```

字段由 `src/content.config.ts` 里的 Zod schema 校验。写错会**在构建期报错，并指出是哪一篇**，比如把 `date` 写成 `2026年10月22日` 就会直接失败 —— 这是好事，别绕过它。

时间格式推荐 `YYYY-MM-DD HH:mm:ss`，不带时区时按本地时区解析。

## 分类还是标签

两者都是字符串数组，但语义不同：

| | 分类 | 标签 |
| --- | --- | --- |
| 数量 | 建议 1 个，最多 2~3 个 | 想加多少加多少 |
| 回答的问题 | 「这篇属于哪个栏目」 | 「这篇涉及哪些点」 |
| 与文章的关系 | 一对多，像文件夹 | 多对多，像索引 |
| 页面 | `/categories/<名称>/` | `/tags/<名称>/` |

中文名称会直接进 URL（`/tags/写作/`），和 Hexo 版行为一致。名称里不要带 `/`，否则会把 URL 切成多段。

<div class="note note-info">分类和标签是<strong>即时生成</strong>的：某篇文章写了 <code>tags: [Markdown]</code>，<code>/tags/Markdown/</code> 就会出现；删光所有引用，这个页面跟着消失。不需要维护任何列表文件。</div>

## 置顶、草稿、更新时间

**置顶** `sticky: true` 只影响**首页列表**（以及 `/page/N/` 分页），不影响归档、分类、标签和 RSS。多篇置顶之间仍按时间倒序。

**草稿** `draft: true` 的处理比较特别：

- `npm run dev` 里**能看到**，方便边写边看效果；
- `npm run build` 时**被剔除**，不进列表、不进搜索索引、不进 RSS、不生成页面。

所以判定逻辑在 `src/utils/posts.ts` 里，用的是 `import.meta.env.DEV`。

**更新时间** `updated` 一旦存在，正文标题下方会出现一行「本文最后更新于 X 年 X 月 X 日」。这不是自动的 —— 主题不会去读 git 提交时间，你觉得该更新就手写。

## 封面：`indexImg`

```yaml
indexImg: /img/cover-3.svg
```

放 `public/` 下就用根路径，外链就写完整 URL。卡片上封面是**固定高度 10rem、宽度 240px**（窄屏会变成上下堆叠），图片用 `object-fit: cover` 裁切，所以原图比例不重要，重要是别把关键内容放在边缘。

不写 `indexImg` 就用 `config.ts` 里 `index.defaultImg`；那个也留空，卡片就退化成纯文字块，不带图。

## 正文能用什么

Markdown 走的是 GFM 那一套，外加主题自己加的几样：

| 能写 | 效果 |
| --- | --- |
| `## 标题` ~ `#### 标题` | 自动进右侧目录，带 `#` 锚点 |
| 围栏代码块 | 构建期 Shiki 高亮 + 语言标签 + 复制按钮 + 行号 |
| 表格 | 表头加粗、边框走主题线色，窄屏横向滚动 |
| 引用 `>` | 左侧一条主题蓝竖线，无底色 |
| 脚注 `[^1]` | 底部生成编号列表，编号用 CSS 计数器 |
| `<div class="note note-info">…</div>` | 提示块，还有 `success` / `warning` / `danger` 三种 |
| 图片 | 居中、90% 宽、点开是大图灯箱 |
| `<details>` | 折叠块，默认收起 |

代码块写语言名就会高亮，写错语言名会退化成纯文本：

````markdown
```ts
const answer = 42;
```
````

脚注的写法（GFM 原生语法，不是插件）：

```markdown
这句话需要补充说明[^1]。

[^1]: 这就是那条补充说明。
```

## 一个完整的例子

```markdown
---
title: 一个完整的例子
date: 2026-10-22 15:00:00
updated: 2026-10-24 09:30:00
description: 把上面讲的字段拼在一起，可以直接照抄。
tags: [写作, 示例]
categories: [指南]
indexImg: /img/cover-3.svg
---

开篇一两句话说清楚这篇要讲什么。

## 第一节

正文。`行内代码`、**加粗**、[链接](https://astro.build/)都正常。

## 第二节

> 引用块适合放别人的话，或者一段需要被单独拎出来的结论。

<div class="note note-warning">这里放需要提醒的坑。</div>
```

## 几个容易踩的点

**标题层级从 `##` 开始**：文章 `title` 就是 `h1`（banner 上那个），正文里再用 `#` 会出现第二个 `h1`，目录也不会收它。

**目录只收 h2~h4**：h5 以下不进目录。如果一篇文章的 h2 全是「第一节/第二节」这种没信息量的标题，目录就白做了 —— 标题写成能独立读懂的一句话。

**图片路径**：`public/img/foo.png` 对应正文里 `![](/img/foo.png)`。别写成相对路径，Markdown 里的相对路径在构建后解析基准是当前页面 URL，很容易挂。

**别手写 HTML 排版**：想加间距、想换颜色，改 CSS 变量或者加 class，直接在正文里塞 `<span style="...">` 会让你以后改主题时很难受。
