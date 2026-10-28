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

/* --------------------------------------------------------------------------
 * 4. 邮箱地址不可抓取
 * ------------------------------------------------------------------------ */

/**
 * `<a href="mailto:me@example.com">` 里的地址是明文，任何一个「收集邮箱」的爬虫
 * 只要正则扫一遍 HTML 就能拿走。这里在构建期把它降级成一段普通文本：
 *
 *   显示   me [at] example.com     ← 人能读懂，正则抓不到完整地址
 *   携带   data-mail="base64"      ← 浏览器端还原成真正的 mailto 链接
 *
 * 渐进增强：脚本没加载 / 被拦掉时，读者看到的仍是一段能读懂的文字，只是不能点。
 * 反过来做（默认是可点的链接、靠 JS 去混淆）就本末倒置了 —— 爬虫根本不跑 JS，
 * 但也不会因为没跑 JS 就漏掉链接。
 *
 * 注意 base64 只是「不要让人一眼看出这是邮箱」，不是加密：真要防有决心的抓取，
 * 得配服务端或干脆不写邮箱。
 */
export function emailLinks() {
  return {
    name: 'flux:email-links',
    element: {
      filter: ['a'],
      visit(node, ctx) {
        const href = String(node.properties?.href ?? '');
        if (!/^mailto:/i.test(href)) return;

        /* mailto 允许带 ?subject=… 之类的参数，取地址部分就够 */
        const address = href.replace(/^mailto:/i, '').split('?')[0].trim();
        if (!address) return;

        /* 显示形态：`me [at] example.com`。只换 @ 不换点 —— 换掉点之后
           「example [dot] com」读起来太费劲，而抓邮箱的正则几乎都盯着 @。
           也刻意不藏起来（比如只写「联系我」）：不开 JS 的读者得能看见地址。 */
        const shown = address.replace(/@/g, ' [at] ');
        const encoded = Buffer.from(address, 'utf8').toString('base64');

        ctx.replaceNode(
          node,
          el('span', { className: ['email-link'], dataMail: encoded }, [text(shown)]),
        );
      },
    },
  };
}

/* --------------------------------------------------------------------------
 * 5. 防盗链图床的 referrerpolicy
 * ------------------------------------------------------------------------ */

/**
 * 有些图床（知乎、微博、B 站、豆瓣…）在 `Referer` 是别的网站时直接返回 403，
 * 于是正文里的图在别人博客上永远是裂的。`referrerpolicy="no-referrer"`
 * 让请求不带 Referer，正常返回。
 *
 * 为什么写死一份域名表而不是做成配置项：这是「对方的规定」，不是「站主的偏好」 ——
 * 没人会想逐个开关，而漏配一次的后果是图片静默裂掉。要加站点改这份表即可。
 *
 * 只处理正文里的 Markdown 图片；主题自己的封面 / banner 不走这条链路。
 */
const NO_REFERRER_HOSTS = [
  'zhimg.com', // 知乎
  'sinaimg.cn', // 微博
  'hdslb.com', // B 站
  'doubanio.com', // 豆瓣
  'byteimg.com', // 字节系
  'qpic.cn', // 腾讯系
  'qlogo.cn',
];

export function imageReferrer() {
  return {
    name: 'flux:image-referrer',
    element: {
      filter: ['img'],
      visit(node, ctx) {
        const src = String(node.properties?.src ?? '');
        if (!/^https?:\/\//i.test(src)) return;

        let host;
        try {
          host = new URL(src).hostname.toLowerCase();
        } catch {
          return; // src 不是合法 URL，交给浏览器自己去失败
        }

        /* 已经显式写了的尊重作者：他可能就是要带 Referer */
        if (node.properties?.referrerpolicy) return;

        const blocked = NO_REFERRER_HOSTS.some(
          (domain) => host === domain || host.endsWith(`.${domain}`),
        );
        if (blocked) ctx.setProperty(node, 'referrerpolicy', 'no-referrer');
      },
    },
  };
}
