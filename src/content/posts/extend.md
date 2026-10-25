---
title: 改造与扩展：加页面、加语言、加评论
date: 2026-10-24 10:00:00
description: 组件职责一览，以及五种常见改造的具体做法：加一个页面、加图标、加语言、接评论、换搜索。都不需要动核心逻辑。
tags:
  - 扩展
  - 组件
  - i18n
categories:
  - 指南
indexImg: /img/cover-2.svg
---

前面几篇都是「用」，这一篇是「改」。主题的设计目标是**每一块功能都能单独拆走**，所以改造的路径基本都是：找到那个 `.astro`，加东西，或者在它旁边加个新文件。

先给一张地图。

## 组件职责

| 组件 | 负责 | 在哪用 |
| --- | --- | --- |
| `BaseLayout.astro` | `<head>`、深色模式首帧脚本、顶栏、页脚、搜索弹窗、回顶按钮 | 所有页面 |
| `Navbar.astro` | 顶栏、菜单、移动端抽屉、主题切换按钮 | `BaseLayout` |
| `Banner.astro` | 顶部大图 + 标题 + 元信息行 | 首页、文章页、各列表页 |
| `Board.astro` | 那张浮起的白卡片，含可选的右侧栏插槽 | 同上 |
| `Toc.astro` | 右侧目录 | 文章页（作为 `Board` 的 `aside` 插槽） |
| `PostCard.astro` | 首页单张卡片 | `PostList` |
| `PostList.astro` | 卡片列表 + 空状态 | 首页、`/page/N/` |
| `Pagination.astro` | 上一页 / 下一页 | 首页、`/page/N/` |
| `SearchModal.astro` | 搜索弹窗的 DOM | `BaseLayout` |
| `Icon.astro` | 内联 SVG 图标表 | 到处 |
| `Footer.astro` | 页脚、备案号 | `BaseLayout` |

数据层只有两个：`src/utils/posts.ts`（取文章、排序、统计、摘要）和 `src/config.ts`（站点配置）。**页面不直接读 `getCollection`**，都过 `utils/posts.ts` —— 想换排序规则或加「相关文章」，改一个函数就够了。

## 加一个页面

Astro 是文件即路由。`src/pages/guestbook.astro` 就是 `/guestbook/`：

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Banner from '../components/Banner.astro';
import Board from '../components/Board.astro';

const title = '留言板';
---

<BaseLayout title={title} description="想说什么都可以">
  <Banner title={title} img="/img/banner.svg" height="40vh" maskAlpha={0.4} />

  <Board>
    <div class="markdown-body">
      <p>这里是一块空白的地方，你可以随便写。</p>
    </div>
  </Board>
</BaseLayout>
```

三件事就位，观感自动跟全站一致：

- `BaseLayout` 提供骨架、顶栏、页脚；
- `Banner` 给顶部图，`height` 建议比首页矮（`40vh` 左右）；
- `Board` 是白卡片，普通模式（不加 `wide`）会自动套 10% 的左右内边距。

内容想用 Markdown 排版，就包一层 `<div class="markdown-body">`；想铺满卡片不留白，给 `<Board wide>` —— 但它适合放图片或表格，文字贴边不好看。

加完页面别忘了在 `config.ts` 的 `nav` 里加一项，否则没人能找到它。

## 加一个图标

图标是 `Icon.astro` 里一个 `Record<string, string>`，值是 24×24 视框的 `<path>`：

```ts
const PATHS: Record<string, string> = {
  // …
  heart: '<path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21l8.8-8.3a5 5 0 0 0 0-7.1z"/>',
};
```

然后 `<Icon name="heart" />`。尺寸跟着 `font-size`（`width/height` 是 `1em`），颜色跟着 `currentColor` —— 不需要为它写任何 CSS。

图标风格建议保持 **2px 描边、24×24 视框**，和现有那一批一致。找图标可以从 [Feather](https://feathericons.com/) 或 [Lucide](https://lucide.dev/) 里挑。

## 加一种语言

现在 `src/i18n.ts` 导出的是一个常量 `T`，所有界面文案都在里面：

```ts
export const T = {
  home: '首页',
  readMore: '阅读全文',
  // …
  totalPosts: (n: number) => `共 ${n} 篇文章`,
} as const;
```

要加英文，把它改成两层字典，然后按当前 `SITE.lang` 取：

```ts
const zh = { home: '首页', readMore: '阅读全文', /* … */ };
const en = { home: 'Home', readMore: 'Read more', /* … */ };

export const T = (SITE.lang.startsWith('en') ? en : zh) as typeof zh;
```

注意两件事：

1. **`as const` 和 `as typeof zh` 别丢**。组件里写的是 `T.xxx`，靠类型检查保证键名不写错；去掉之后拼错的键名会静默变成 `undefined`，页面上直接空一块。
2. **带参数的项是函数**（`totalPosts(n)`），别改成字符串模板。日期格式在页面里用 `toLocaleDateString('zh-CN', …)` 写死了，加语言时要一起改成跟随 `SITE.lang`。

真正的多语言站点（`/en/` 和 `/zh/` 两套路由）不在当前范围内 —— 那需要把 `pages/` 整个复制一份或改成 `[lang]` 动态段，工作量比这个主题现在的定位大。

## 接一个评论系统

主题本身不带评论。想加，位置在 `src/pages/posts/[...slug].astro` 里 `</article>` 之后、`<Board>` 闭合之前 —— 也就是正文、版权卡片、上下篇全部结束之后。

以 giscus（基于 GitHub Discussions）为例：

```astro
</article>
<div class="giscus" style="margin-top: 2rem"></div>
<script is:inline src="https://giscus.app/client.js"
  data-repo="你的用户名/你的仓库"
  data-repo-id="R_xxx"
  data-category="Announcements"
  data-category-id="DIC_xxx"
  data-mapping="pathname"
  data-reactions-enabled="1"
  data-theme="preferred_color_scheme"
  data-lang="zh-CN"
  crossorigin="anonymous"
  async>
</script>
```

三点提醒：

- 脚本用 `is:inline`，否则 Astro 会尝试打包它（外部 URL 打不了包，会报错）。
- `data-theme="preferred_color_scheme"` 会跟随系统，但**不跟随主题的手动切换**。要让两者同步，得在 `theme.js` 的切换函数里给 giscus 的 `<iframe>` 发一条 `postMessage`。
- 评论是一个第三方请求，也是唯一会让「纯静态」出现运行时网络依赖的东西。加之前想清楚值不值。

## 换掉搜索

现在的搜索是**全量索引 + 线性扫描 + 分档权重**：构建期把每篇正文的前 4000 字塞进 `/searchindex.json`（字段名压成单字母），前端 `fetch` 一次，按标题命中 > 分类/标签命中 > 正文命中的权重排序。

几十上百篇时非常快，因为索引总共才几百 KB，而且只请求一次。

上千篇之后建议换 [Pagefind](https://pagefind.app/)：它构建完再扫一遍 `dist/`，把索引切成很多小块按需加载，中文分词也更好。迁移方式是：

1. `npm i -D pagefind`，`build` 脚本改成 `astro build && pagefind --site dist`；
2. `SearchModal.astro` 里的搜索逻辑换成 Pagefind 的 UI 或 API；
3. 删掉 `src/pages/searchindex.json.ts` 和 `src/scripts/search.js`。

## 改 Markdown 的行为

`src/plugins/markdown.js` 里有四个 hast 插件，在构建期改写 HTML 树：

| 插件 | 做的事 |
| --- | --- |
| `headingAnchors` | 给 h2~h6 加 `id` 和悬浮的 `#` 锚点 |
| `codeChrome` | 代码块包 `.highlight` 外壳，写上语言名 |
| `codeToolbar` | 加复制按钮与语言标签 |
| `linkTargets` | 外链加 `target="_blank"` 与 `rel="noopener"` |

它们都在 `astro.config.mjs` 的 `processor.hastPlugins` 数组里注册。

<div class="note note-warning">写这类插件有一个硬规则：<strong>一次 <code>visit</code> 里只能做一次结构变更</strong>。想「先包外壳、再往里塞按钮」，必须分成两次独立遍历，不能在一个访问函数里连着改两下 —— 否则遍历器会拿到已经失效的节点，表现为随机漏加或重复添加。这个坑在迁移时踩过，写在这里省你一次调试。</div>

## 想加的东西清单对不上时

最省时间的顺序永远是：**先看 `src/pages/` 里有没有现成的页面能改，再看 `src/components/` 有没有现成的组件能复用，最后才动手写新的。**

这个主题的全部源码是 33 个文件（`.astro` / `.ts` / `.js` / `.css`），读一遍大概二十分钟 —— 比在网上搜「Astro 博客怎么做 X」快。
