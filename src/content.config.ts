import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * 内容集合
 * ---------------------------------------------------------------------------
 * 对应 Hexo 的 `source/_posts/*.md`。字段名尽量沿用 Hexo / Fluid 的习惯，
 * 迁移旧文章时大多不用改（`title` / `date` / `tags` / `categories` /
 * `description` / `index_img` 都是同名）。
 */
const posts = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/posts',
    /**
     * id 必须始终等于「文件路径去掉扩展名」。
     *
     * glob loader 的默认实现里留了一段历史兼容：front matter 有 `slug` 时直接拿它
     * 当 id。放在这里就是灾难 —— `2026/年度总结.md` 写 `slug: year-review`，
     * id 会变成 `year-review`，目录信息凭空消失，URL 规则再也拼不出 `2026/` 前缀。
     * 所以这里强制 id 只由路径决定，`slug` 交给 utils/slug.ts 在生成 URL 时处理。
     */
    generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/i, ''),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      description: z.string().optional(),
      /**
       * 自定义 URL 路径（相对 `/posts/`），相当于 Hexo 的 `:title` 占位符。
       *
       * - 不写：沿用文件路径。`2026/年度总结.md` → `/posts/2026/nian-du-zong-jie/`
       * - 写一段：只换最后一段。`slug: year-review` → `/posts/2026/year-review/`
       * - 写多段（含 `/`）：整条路径由它决定。`slug: essay/year-review` →
       *   `/posts/essay/year-review/`，文件所在目录不再参与
       *
       * 值本身也会被清洗：转小写、空格转 `-`、中文转拼音、其余字符丢弃，
       * 所以写 `Hello World` 和写 `hello-world` 等价。
       */
      slug: z.string().optional(),
      tags: z.array(z.string()).default([]),
      categories: z.array(z.string()).default([]),
      /**
       * 首页卡片封面（原版叫 index_img）。
       * 写成根路径（`/img/cover-1.svg`）或完整 URL 都行 —— 与 Hexo 的用法一致，
       * 但**不会被优化**：原图多大就发多大。
       */
      indexImg: z.string().optional(),
      /**
       * 首页卡片封面（推荐写法）：相对本文档的图片路径，交给 Astro 优化。
       *
       *     cover: ../../assets/covers/cover-1.webp
       *
       * 构建时按需生成多档宽度（webp），并自动补上 `srcset` 与宽高比，
       * 移动端不会下载桌面尺寸的大图。填了 `cover` 就不再理 `indexImg`。
       * 能用位图就别用 SVG —— SVG 没有srcset可言，图片优化对它无效。
       */
      cover: image().optional(),
      /** 置顶（原版 `sticky: true`） */
      sticky: z.boolean().default(false),
      draft: z.boolean().default(false),
      /** 单篇覆盖「右侧目录」开关；不写则跟随 config.ts 的 post.toc */
      toc: z.boolean().optional(),
      /**
       * 单篇关闭评论。站点总开关在 config.ts 的 `comment.enable`，
       * 这里是单篇的否决权 —— 公告、关于这类不需要讨论的稿子可以关掉。
       */
      comment: z.boolean().optional(),
      /** 单篇覆盖 banner 图（根路径或完整 URL，不优化） */
      bannerImg: z.string().optional(),
      /**
       * 单篇 banner 图（推荐写法）：相对本文档的路径，交给 Astro 优化。
       * 文章头图往往是全屏大图，走优化能省下最多流量。
       */
      banner: image().optional(),
      /** 单篇覆盖 banner 遮罩透明度 */
      bannerMaskAlpha: z.number().min(0).max(1).optional(),
    }),
});

export const collections = { posts };
