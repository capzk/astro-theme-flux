/**
 * Flux · Markdown HAST 插件
 * ---------------------------------------------------------------------------
 * Astro 7 的 Markdown 处理器是 Sätteri（Rust 实现），插件形态是
 * `{ name, element: { filter, visit } }` —— 按节点类型订阅，不是 unified 的
 * `(tree) => {}`。下面每个插件对应 Hexo 版的一个「模板钩子 / 前端插件」：
 *
 *   headingAnchors ← hexo 的 heading 锚点（原 anchorjs 插件，这里零 JS）
 *   codeToolbar    ← _partials/plugins/code-widget.ejs（语言标签 + 复制按钮）
 *   linkTargets    ← 外链自动 target="_blank"（Fluid 的默认行为）
 *
 * ⚠️ 一条硬规则（踩过）：**一个 visit 里只能做一次结构变更**（wrap/insert/remove）。
 *    命令缓冲按「访问时的索引」落位，前一次变更还没写进树，第二次会覆盖它或被
 *    静默丢弃。所以代码块的包裹与工具栏插入拆成两趟。
 */

import Slugger from 'github-slugger';

/* --------------------------------------------------------------------------
 * 小工具
 * ------------------------------------------------------------------------ */

function classes(node) {
  const c = node?.properties?.className;
  if (Array.isArray(c)) return c;
  if (typeof c === 'string') return c.split(/\s+/).filter(Boolean);
  return [];
}

const el = (tagName, properties = {}, children = []) => ({ type: 'element', tagName, properties, children });
const text = (value) => ({ type: 'text', value });

/** 围栏语言：Shiki 会写成 data-language，兜底从 class="language-xxx" 取。 */
function detectLang(node) {
  const p = node.properties ?? {};
  if (typeof p.dataLanguage === 'string' && p.dataLanguage) return p.dataLanguage;
  for (const c of classes(node)) {
    const m = /^language-(.+)$/.exec(c);
    if (m) return m[1];
  }
  return 'text';
}

/* --------------------------------------------------------------------------
 * 1. 标题锚点
 * ------------------------------------------------------------------------ */

export function headingAnchors() {
  /* 每篇文档一个 slugger：工厂函数每篇调用一次，否则不同文章的同名标题会互相续号 */
  return () => {
    const slugger = new Slugger();
    return {
      name: 'flux:heading-anchors',
      element: {
        filter: ['h1', 'h2', 'h3', 'h4'],
        visit(node, ctx) {
          const id = slugger.slug(ctx.textContent(node));
          ctx.setProperty(node, 'id', id);
          /* 锚点里不放文字：`#` 由 CSS 的 ::before 提供，悬停才显示（Fluid 的观感） */
          ctx.prependChild(
            node,
            el('a', { className: ['headerlink'], href: `#${id}`, ariaHidden: 'true', tabIndex: -1 }, []),
          );
        },
      },
    };
  };
}

/* --------------------------------------------------------------------------
 * 2. 代码块工具栏
 * ------------------------------------------------------------------------ */

/** 第一趟：`<pre>` → `<figure class="highlight">`，并把语言记在属性上。 */
export function codeChrome() {
  return {
    name: 'flux:code-chrome',
    element: {
      filter: ['pre'],
      visit(node, ctx) {
        /* 已在 figure 里的别重复包 */
        if (classes(ctx.parent(node) ?? {}).includes('highlight')) return;
        const lang = detectLang(node);
        const lineCount = countLines(node, ctx);
        ctx.wrapNode(
          node,
          el('figure', { className: ['highlight'], dataLang: lang, dataLines: String(lineCount) }),
        );
      },
    },
  };
}

/** 行数：优先数 Shiki 的 `.line`，没有就按换行数。 */
function countLines(node, ctx) {
  let n = 0;
  (function walk(current) {
    if (!current || !Array.isArray(current.children)) return;
    for (const child of current.children) {
      if (child.type !== 'element') continue;
      if (child.tagName === 'span' && classes(child).includes('line')) n += 1;
      else walk(child);
    }
  })(node);
  if (n) return n;
  const raw = ctx.textContent(node).replace(/\n+$/, '');
  return raw ? raw.split('\n').length : 1;
}

/**
 * 第二趟：插入语言标签 + 复制按钮。
 *
 * filter 用 `['pre']` 而不是 `['figure']` —— 这一条是被迫的：
 *   `wrapNode` 新建的 figure，其子节点在下一趟里是**惰性句柄**，`properties` 读回来
 *   是空的（tagName 能读、属性读不到）。所以「第二趟从 figure 里找 pre 再读语言」
 *   拿到的语言永远是空字符串。而 `pre` 本身是被访问器交出来的节点，属性完整。
 *
 * 顺带一个更朴素的理由：`wrapNode(node, parent)` 只会把 node 放进 parent，
 * parent 自己声明的 children 在 hast 侧并不可靠 —— 试过把工具栏直接塞进
 * `el('figure', props, [toolbar])`，产物里没有它。
 */
export function codeToolbar() {
  return {
    name: 'flux:code-toolbar',
    element: {
      filter: ['pre'],
      visit(node, ctx) {
        const parent = ctx.parent(node);
        if (!parent || parent.tagName !== 'figure') return;

        const pp = node.properties ?? {};
        const lang = String(pp.dataLanguage ?? pp['data-language'] ?? 'text');

        ctx.insertBefore(
          node,
          el('div', { className: ['code-toolbar'] }, [
            /* 语言名放在 <pre> 之外，复制代码时带不上 */
            el('span', { className: ['code-lang'] }, [text(lang)]),
            el(
              'button',
              {
                type: 'button',
                className: ['code-copy'],
                ariaLabel: '复制代码',
                dataLabelCopy: 'COPY',
                dataLabelCopied: 'COPIED',
              },
              [text('COPY')],
            ),
          ]),
        );
      },
    },
  };
}

/* --------------------------------------------------------------------------
 * 3. 外链补 target / rel
 * ------------------------------------------------------------------------ */

export function linkTargets() {
  return {
    name: 'flux:link-targets',
    element: {
      filter: ['a'],
      visit(node, ctx) {
        const href = String(node.properties?.href ?? '');
        if (!/^https?:\/\//i.test(href)) return;
        ctx.setProperty(node, 'target', '_blank');
        ctx.setProperty(node, 'rel', 'noopener noreferrer');
      },
    },
  };
}
