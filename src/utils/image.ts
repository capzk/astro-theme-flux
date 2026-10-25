/**
 * 图片来源类型
 * ---------------------------------------------------------------------------
 * 主题里凡是「一张图」的位置（首页 banner、文章 banner、卡片封面）都接受两种写法：
 *
 *   - **字符串**：`/img/cover-1.svg` 或外链。原样输出，Astro 不做任何处理。
 *     对应 Hexo 的 `index_img: /img/x.png`，迁站时不用改。
 *   - **本地资源**：`import cover from '../assets/cover.webp'` 或 front matter 的
 *     `cover: ../../assets/cover.webp`（`image()` 字段）。交给 `<Image>` 处理会
 *     生成多档宽度 + webp/avif，并按需注入 `srcset`。
 *
 * 两个工具函数负责在两种形态之间抹平差异，调用方不用到处写 typeof 判断。
 */
import type { ImageMetadata } from 'astro';

export type ImageSource = string | ImageMetadata;

/** 是否是可优化的本地资源（`<Image>` 能接的那种） */
export const isAsset = (src: ImageSource | undefined): src is ImageMetadata =>
  typeof src === 'object' && src !== null;

/**
 * 取图片构建后的地址。字符串原样返回；
 * 本地资源取 `src`（如 `/_astro/banner.abc123.webp`）—— 分享卡片（OG）要的是这个。
 */
export const srcOf = (src: ImageSource | undefined, fallback = ''): string => {
  if (!src) return fallback;
  return isAsset(src) ? src.src : src;
};
