/**
 * Flux · Shiki 转换器（构建期）
 * ---------------------------------------------------------------------------
 * 围栏代码块后面的那串 meta 是 Shiki 的事，不是 HAST 插件的事 ——
 * Sätteri 把 `pre` 节点交给 hastPlugins 时，meta 已经被丢掉了（只剩 data-language）。
 * 所以想在 meta 上做文章只能在 Shiki 阶段，通过 `shikiConfig.transformers` 挂进来。
 *
 * 支持两件事：
 *
 *   ```js {1,3-5}      → 第 1、3、4、5 行加 `.is-highlighted`
 *   ```text nolinenos  → 这一段不显示行号
 *
 * 两者可以一起写：```js {2} nolinenos
 *
 * 行号本身是纯 CSS 计数器（见 main.css 第 9 节），**默认就开着** —— 所以这里
 * 只提供「关掉」的开关，而不是「打开」。终端输出、目录树这类块加上行号纯属碍眼。
 *
 * @see https://shiki.style/guide/transformers
 */

/**
 * 从 meta 里抠出 `{1,3-5}` 的行号集合。
 *
 * 只认花括号里的内容，其余（`title="x.js"` 这类别的转换器用的 key/value）
 * 原样忽略 —— 我们不是 meta 的主人。
 */
function parseRanges(raw) {
  const block = /\{([^}]*)\}/.exec(raw ?? '');
  if (!block) return null;

  const set = new Set();
  for (const part of block[1].split(',')) {
    const seg = part.trim();
    if (!seg) continue;

    const range = /^(\d+)\s*-\s*(\d+)$/.exec(seg);
    if (range) {
      const from = Number(range[1]);
      const to = Number(range[2]);
      /* 写反了（5-2）不该什么都不高亮，按书写意图换过来 */
      for (let n = Math.min(from, to); n <= Math.max(from, to); n += 1) set.add(n);
    } else if (/^\d+$/.test(seg)) {
      set.add(Number(seg));
    }
  }
  return set.size > 0 ? set : null;
}

/**
 * 按 meta 原文缓存解析结果。
 * `line` 钩子每行都会调一次，而同一段代码的 meta 是一样的 —— 缓存住免得
 * 一行一个正则。键是 meta 原文，量级是「全站有几种写法」，不会涨。
 */
const rangeCache = new Map();

function rangesOf(raw) {
  const key = raw ?? '';
  const cached = rangeCache.get(key);
  if (cached !== undefined) return cached;

  const parsed = parseRanges(key);
  rangeCache.set(key, parsed);
  return parsed;
}

/** 挂到 astro.config 的 `markdown.shikiConfig.transformers` 里 */
export function codeMeta() {
  return {
    name: 'flux:code-meta',

    pre(node) {
      /* `this.options.meta.__raw` 是 Shiki 交出来的原始 meta 字符串 */
      const raw = this.options?.meta?.__raw ?? '';
      if (/\b(?:noLineNumbers|nolinenos)\b/i.test(raw)) {
        this.addClassToHast(node, 'no-linenos');
      }
    },

    line(node, line) {
      const ranges = rangesOf(this.options?.meta?.__raw);
      if (ranges?.has(line)) this.addClassToHast(node, 'is-highlighted');
    },
  };
}
