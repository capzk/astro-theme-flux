/**
 * 目录（TOC）构建
 * ---------------------------------------------------------------------------
 * Astro 的 `render()` 已经给出 `headings`（含 depth / slug / text），不需要
 * 再解析一遍 HTML。原版用 tocbot 做「跟随滚动高亮」，这里：
 *   · 结构在构建期生成（这份文件）
 *   · 高亮逻辑在 src/scripts/theme.js 里用 IntersectionObserver 实现（十几行）
 * 依赖从「tocbot + jQuery」降到 0。
 */
export interface Heading {
  depth: number;
  slug: string;
  text: string;
}

export interface TocNode extends Heading {
  children: TocNode[];
}

/** 只保留 h2 / h3（与 Fluid 默认的 toc 深度一致），构造成树 */
export function buildToc(headings: Heading[], maxDepth = 3): TocNode[] {
  const root: TocNode[] = [];
  const stack: TocNode[] = [];

  for (const h of headings) {
    if (h.depth < 2 || h.depth > maxDepth) continue;
    const node: TocNode = { ...h, children: [] };
    while (stack.length && stack[stack.length - 1].depth >= h.depth) stack.pop();
    if (stack.length) stack[stack.length - 1].children.push(node);
    else root.push(node);
    stack.push(node);
  }
  return root;
}
