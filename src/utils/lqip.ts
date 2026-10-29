/**
 * LQIP 占位色
 * ---------------------------------------------------------------------------
 * 数据来自虚拟模块 `virtual:flux-lqip`：由 `src/integrations/lqip.mjs` 在
 * `astro:config:setup` 里算好，构建与开发时自动生成 —— 没有中间文件要提交，
 * 也不存在「换图后忘了重新生成」这种状态。
 * 一条记录是 18 个字符：顶左 6 位 + 顶右 6 位 + 底右 6 位，不带 `#`。
 *
 * 这里负责把「一张图」翻译成「一条 CSS 渐变」：
 *
 *   卡片封面   → 垫在 <img> 下面，图片没到时先显示主色调
 *   banner     → 并进 background-image 的第二层，第一层是真图
 *
 * 两种图源都要认：
 *   - 字符串 `/img/cover-x.webp` → 直接查 `public/img/cover-x.webp`
 *   - `import` 进来的 ImageMetadata → 构建后的地址是 `/_astro/xxx.hash.webp`，
 *     已经看不出源文件在哪，所以用 import.meta.glob 反查一遍（见下方 pathBySrc）
 *
 * 查不到就返回 undefined，调用方不加任何 style —— 不猜、不留半成品。
 */
import lqips from 'virtual:flux-lqip';
import { isAsset, type ImageSource } from './image';
import type { ImageMetadata } from 'astro';

const TABLE = lqips as Record<string, string>;

/**
 * 构建后地址 → 源文件路径。
 *
 * `cover` 这类字段交给 Astro 优化后，拿到的是 `/_astro/cover-1.BW97vYnq.webp`，
 * 原始路径已经丢了；而 content collection 里的 ImageMetadata 和这里 glob 到的
 * 不是同一个对象实例（跨模块边界），没法用引用比对。
 *
 * 但两者的 `.src` 是同一个字符串 —— 同一个源文件、同样的处理参数，哈希也一样。
 * 于是按 src 建表，用字符串找回原始路径。
 */
const modules = import.meta.glob('/src/assets/**/*.{webp,avif,png,jpg,jpeg}', {
  eager: true,
  import: 'default',
}) as Record<string, ImageMetadata | string>;

const pathBySrc = new Map<string, string>();
for (const [file, mod] of Object.entries(modules)) {
  const src = typeof mod === 'string' ? mod : mod?.src;
  /* glob 的键是 `/src/assets/…`，JSON 的键是 `src/assets/…`，这里对齐 */
  if (src) pathBySrc.set(src, file.replace(/^\//, ''));
}

/** 图片 → JSON 里的键；外链、data URI、找不到的都返回 undefined */
function keyOf(src: ImageSource | undefined): string | undefined {
  if (!src) return undefined;

  if (isAsset(src)) return pathBySrc.get(src.src);

  /* 外链不归我们管：它多半有自己的一套占位策略，也不在扫描目录里 */
  if (/^(https?:)?\/\//i.test(src) || src.startsWith('data:')) return undefined;

  /* 去掉 ?v=1#hash 这类尾巴，再补上 public/ 前缀 */
  const clean = src.split(/[?#]/)[0];
  if (!clean.startsWith('/')) return undefined;
  return `public${clean}`;
}

/** 1536a0 → #1536a0 */
const hex = (compact: string, index: number) => `#${compact.slice(index * 6, index * 6 + 6)}`;

/**
 * 一条可以直接写进 CSS 的渐变，例如
 * `linear-gradient(135deg, #6e3b38 0%, #ae7472 50%, #af7574 100%)`。
 * 查不到返回 undefined。
 */
export function lqipGradientOf(src: ImageSource | undefined): string | undefined {
  const key = keyOf(src);
  if (!key) return undefined;

  const compact = TABLE[key];
  /* 长度不对说明 JSON 被手工改过（或还是旧格式），宁可不生效也别输出半条坏渐变 */
  if (typeof compact !== 'string' || compact.length !== 18) return undefined;

  return `linear-gradient(135deg, ${hex(compact, 0)} 0%, ${hex(compact, 1)} 50%, ${hex(compact, 2)} 100%)`;
}

/** 直接可用的 `style` 值：`background-image:linear-gradient(…)` */
export function lqipStyle(src: ImageSource | undefined): string | undefined {
  const gradient = lqipGradientOf(src);
  return gradient ? `background-image:${gradient}` : undefined;
}
