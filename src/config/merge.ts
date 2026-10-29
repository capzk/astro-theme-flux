/**
 * Flux · 配置合并
 * ---------------------------------------------------------------------------
 * 把「主题默认值」和「用户覆盖值」合成一份完整配置。规则只有四条：
 *
 *   1. 普通对象逐层递归合并 —— 所以同一块配置可以由两个文件各写一半
 *      （比如 banner 的高度在 defaults，图片在 user，合起来才是完整的 banner）
 *   2. 数组整体替换，不做拼接 —— 导航、友链这类「我写的才算数」，
 *      合并出个「默认 6 项 + 你的 2 项 = 8 项」是灾难
 *   3. `undefined` 视为「没写」，保留默认值 —— 这样 `img: undefined`
 *      不会把一张好好的默认图干掉
 *   4. 图片资源对象（ImageMetadata）整体替换，不拆开合并 ——
 *      它虽然有 `src` / `width` 这些字段，但语义上是「一个不可分割的值」
 *
 * 没有引第三方库：三十行能写清楚的规则，不值得为它多一个依赖。
 */
import type { SiteConfig } from './types';

/** 递归可选：用户在 `user/` 里只需要写想改的那几项 */
export type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

/**
 * 用户配置的形状：SiteConfig 的任意子集。
 *
 * 为什么不直接写 `DeepPartial<SiteConfig>`：那是个条件类型，TypeScript 会**跳过
 * 多余属性检查** —— 顶层写成 `titl:` 也能过，只有嵌套层报错。改成显式的映射类型后，
 * 顶层字段拼错会得到 `'titl' does not exist in type 'UserConfig'. Did you mean 'title'?`。
 * 实测：顶层拼错、嵌套拼错（`banner.hite`）、类型不匹配（`height: 123`）三类都能拦住。
 */
export type UserConfig = { [K in keyof SiteConfig]?: DeepPartial<SiteConfig[K]> };

/**
 * `defineConfig` —— 用户层文件的唯一写法。
 *
 * 它什么都不做，只是把参数原样返回，作用是**让 TypeScript 在这里做检查**：
 * 字段拼错、类型不对、往 `type` 里填了个不存在的评论系统，`npm run check`
 * 当场报错，而不是等到构建出一份「配置被静默忽略」的站点。
 *
 * 这是 Astro 自己的惯例（`astro.config.mjs` 里的 `defineConfig`），照搬过来，
 * 使用者不用学新东西。
 */
export const defineConfig = (config: UserConfig): UserConfig => config;

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  /* 普通对象字面量，或 Object.create(null) 出来的裸对象，都算「可合并的普通对象」 */
  return proto === Object.prototype || proto === null;
};

/**
 * Astro 的 ImageMetadata：`{ src, width, height, format }`。
 * 它是构建期产出的对象，不是「一堆可以逐个覆盖的设置」，遇到就整体替换。
 */
const isImageAsset = (value: unknown): boolean =>
  isPlainObject(value) && 'src' in value && 'width' in value && 'height' in value;

/** 合并一个值。`next` 为 undefined 时表示「用户没写」，保留 `prev` */
function mergeValue(prev: unknown, next: unknown): unknown {
  if (next === undefined) return prev;

  /* 一边不是普通对象（字符串、数组、图片资源）→ 直接用 next 顶掉 */
  if (!isPlainObject(prev) || !isPlainObject(next) || isImageAsset(next)) return next;

  return mergeObject(prev, next);
}

function mergeObject(
  base: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };

  for (const key of Object.keys(patch)) {
    result[key] = mergeValue(result[key], patch[key]);
  }

  /* 顺手丢掉用户显式写成 undefined 的键，避免它在最终对象里变成 `key: undefined`
     而盖掉默认值 —— 上面 mergeValue 已经做了取舍，这里只是保持对象干净 */
  for (const key of Object.keys(result)) {
    if (result[key] === undefined) delete result[key];
  }

  return result;
}

/**
 * 把 `patch` 盖在 `base` 上，返回新对象（两边都不会被修改）。
 *
 * `NoInfer` 是必要的：不加它，TypeScript 会拿 `patch` 的形状去反推 `T`，
 * 于是返回类型退化成「全是可选字段」的 DeepPartial，调用方还得自己断言。
 */
export function deepMerge<T>(base: T, patch: DeepPartial<NoInfer<T>> | undefined): T {
  return mergeValue(base, patch) as T;
}

