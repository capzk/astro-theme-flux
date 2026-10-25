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
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: () =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).default([]),
      categories: z.array(z.string()).default([]),
      /**
       * 首页卡片封面（原版叫 index_img）。
       * 写成根路径（`/img/cover-1.svg`）或完整 URL 都行 —— 与 Hexo 的用法一致。
       * 想让 Astro 自动优化位图，把这条改成 `image()` 并用相对本文件的路径。
       */
      indexImg: z.string().optional(),
      /** 置顶（原版 `sticky: true`） */
      sticky: z.boolean().default(false),
      draft: z.boolean().default(false),
      /** 单篇覆盖「右侧目录」开关；不写则跟随 config.ts 的 post.toc */
      toc: z.boolean().optional(),
      /** 单篇覆盖 banner 图（根路径或完整 URL） */
      bannerImg: z.string().optional(),
      /** 单篇覆盖 banner 遮罩透明度 */
      bannerMaskAlpha: z.number().min(0).max(1).optional(),
    }),
});

export const collections = { posts };
