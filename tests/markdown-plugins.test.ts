/**
 * Markdown HAST 插件的回归测试
 * ---------------------------------------------------------------------------
 * 这七个插件跑在 Sätteri（Rust 侧）的访问器里，测试环境没有那条流水线，
 * 所以这里带一个**极小的遍历桩**：只实现插件实际用到的 ctx 方法
 * （setProperty / prependChild / wrapNode / insertBefore / replaceNode /
 * textContent / parent），语义按 HAST 树应有的行为来。
 *
 * 桩不模拟 Sätteri 的「命令缓冲」细节（生产代码里那条「一次 visit 只做一次
 * 结构变更」的硬规则，正是它的坑）—— 这里锁的是每个插件**自己的输入输出**：
 * 哪个属性该写什么值、哪种地址不该动。规则一旦被改坏，构建照常成功、
 * 只有打开页面才看得出来，所以靠测试兜。
 */
import { describe, expect, it } from 'vitest';
import {
  baseLinks,
  codeChrome,
  codeToolbar,
  emailLinks,
  headingAnchors,
  imageLoading,
  imageReferrer,
  linkTargets,
} from '../src/plugins/markdown';

/* ---------- 小桩 ---------- */

interface HNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HNode[];
  value?: string;
}

const el = (tagName: string, properties: Record<string, unknown>, children: HNode[] = []): HNode => ({
  type: 'element',
  tagName,
  properties,
  children,
});
const txt = (value: string): HNode => ({ type: 'text', value });
const root = (...children: HNode[]): HNode => ({ type: 'root', children });

interface Plugin {
  name: string;
  element?: { filter?: string[]; visit: (node: HNode, ctx: Ctx) => void };
  raw?: (node: HNode) => HNode | undefined;
}

interface Ctx {
  setProperty: (node: HNode, name: string, value: unknown) => void;
  prependChild: (node: HNode, child: HNode) => void;
  wrapNode: (node: HNode, wrapper: HNode) => void;
  insertBefore: (node: HNode, sibling: HNode) => void;
  replaceNode: (node: HNode, next: HNode) => void;
  textContent: (node: HNode) => string;
  parent: (node: HNode) => HNode | null;
}

/** 深度优先找节点的容器；返回 [容器, 下标]，找不到就是 undefined */
function locate(container: HNode, target: HNode): [HNode, number] | undefined {
  const kids = container.children ?? [];
  for (let i = 0; i < kids.length; i += 1) {
    if (kids[i] === target) return [container, i];
    const hit = locate(kids[i], target);
    if (hit) return hit;
  }
  return undefined;
}

function textOf(node: HNode): string {
  if (node.type === 'text' || node.type === 'raw') return node.value ?? '';
  return (node.children ?? []).map(textOf).join('');
}

/** 跑一趟插件：先快照全部元素再逐个 visit（与生产一致 —— 插件只碰已存在的节点） */
function runPlugin(factory: unknown, tree: HNode): void {
  /* 导出统一是「工厂」（linkTargets() 直接出插件，headingAnchors() 每篇再产一次
     带独立 slugger 的实例），传进来的可能是外层也可能是实例，两种都认。 */
  const made = typeof factory === 'function' ? (factory as () => unknown)() : factory;
  const plugin: Plugin =
    typeof made === 'function' ? (made as () => Plugin)() : (made as Plugin);

  const snapshot: HNode[] = [];
  (function collect(node: HNode) {
    /* root / element 都往下走；只有 text 等叶子没有子树 */
    if (node.type === 'element') snapshot.push(node);
    if (node.type === 'raw' && plugin.raw) {
      const next = plugin.raw(node);
      if (next) node.value = next.value;
    }
    (node.children ?? []).forEach(collect);
  })(tree);

  const ctx: Ctx = {
    setProperty: (node, name, value) => {
      (node.properties ??= {})[name] = value;
    },
    prependChild: (node, child) => {
      (node.children ??= []).unshift(child);
    },
    wrapNode: (node, wrapper) => {
      const hit = locate(tree, node);
      if (!hit) return;
      const [container, index] = hit;
      wrapper.children = [node];
      container.children![index] = wrapper;
    },
    insertBefore: (node, sibling) => {
      const hit = locate(tree, node);
      if (!hit) return;
      const [container, index] = hit;
      container.children!.splice(index, 0, sibling);
    },
    replaceNode: (node, next) => {
      const hit = locate(tree, node);
      if (!hit) return;
      const [container, index] = hit;
      container.children![index] = next;
    },
    textContent: textOf,
    parent: (node) => {
      const hit = locate(tree, node);
      return hit ? hit[0] : null;
    },
  };

  const filter = plugin.element?.filter;
  for (const node of snapshot) {
    if (!plugin.element) break;
    if (!filter || (node.tagName && filter.includes(node.tagName))) {
      plugin.element.visit(node, ctx);
    }
  }
}

/* ---------- 1. 外链 target / rel ---------- */

describe('linkTargets', () => {
  it('http(s) 外链补 target=_blank 与 rel=noopener noreferrer', () => {
    const tree = root(el('a', { href: 'https://other.site/x/' }, [txt('out')]));
    runPlugin(linkTargets(), tree);
    const a = tree.children![0];
    expect(a.properties!.target).toBe('_blank');
    expect(a.properties!.rel).toBe('noopener noreferrer');
  });

  it('站内相对路径与锚点不动', () => {
    const tree = root(el('a', { href: '/posts/hello/' }), el('a', { href: '#top' }));
    runPlugin(linkTargets(), tree);
    expect(tree.children![0].properties!.target).toBeUndefined();
    expect(tree.children![1].properties!.target).toBeUndefined();
  });
});

/* ---------- 2. 邮箱混淆 ---------- */

describe('emailLinks', () => {
  it('mailto 链接换成 span + base64，明文地址不再出现在 HTML 里', () => {
    const tree = root(el('a', { href: 'mailto:me@example.com' }, [txt('me@example.com')]));
    runPlugin(emailLinks(), tree);
    const span = tree.children![0];
    expect(span.tagName).toBe('span');
    expect(span.properties!.dataMail).toBe(Buffer.from('me@example.com').toString('base64'));
    expect(textOf(span)).toBe('me [at] example.com');
  });

  it('带参数的 mailto 只取地址部分；普通链接不碰', () => {
    const tree = root(
      el('a', { href: 'mailto:me@example.com?subject=hi' }),
      el('a', { href: 'https://mail.example.com' }),
    );
    runPlugin(emailLinks(), tree);
    expect(
      Buffer.from(tree.children![0].properties!.dataMail as string, 'base64').toString(),
    ).toBe('me@example.com');
    expect(tree.children![1].tagName).toBe('a');
  });
});

/* ---------- 3. 防盗链图床 ---------- */

describe('imageReferrer', () => {
  it('已知图床域名（含子域）补 no-referrer', () => {
    const tree = root(
      el('img', { src: 'https://i0.hdslb.com/x/1.png' }),
      el('img', { src: 'https://pic3.zhimg.com/v2-abc.jpg' }),
    );
    runPlugin(imageReferrer(), tree);
    expect(tree.children![0].properties!.referrerpolicy).toBe('no-referrer');
    expect(tree.children![1].properties!.referrerpolicy).toBe('no-referrer');
  });

  it('陌生域名不动、站内图不动、作者显式写过的尊重作者', () => {
    const tree = root(
      el('img', { src: 'https://ok.com/a.png' }),
      el('img', { src: '/img/a.png' }),
      el('img', { src: 'https://zhimg.com/b.png', referrerpolicy: 'no-referrer-when-downgrade' }),
    );
    runPlugin(imageReferrer(), tree);
    expect(tree.children![0].properties!.referrerpolicy).toBeUndefined();
    expect(tree.children![1].properties!.referrerpolicy).toBeUndefined();
    expect(tree.children![2].properties!.referrerpolicy).toBe('no-referrer-when-downgrade');
  });

  it('域名后缀要带点边界：evil-zhimg.com 不算 zhimg.com', () => {
    const tree = root(el('img', { src: 'https://evil-zhimg.com/a.png' }));
    runPlugin(imageReferrer(), tree);
    expect(tree.children![0].properties!.referrerpolicy).toBeUndefined();
  });
});

/* ---------- 4. 正文图片懒加载 ---------- */

describe('imageLoading', () => {
  it('裸 img 补 lazy + async 解码；显式写过的保留', () => {
    const tree = root(el('img', { src: 'a.png' }), el('img', { src: 'b.png', loading: 'eager' }));
    runPlugin(imageLoading(), tree);
    expect(tree.children![0].properties).toMatchObject({ loading: 'lazy', decoding: 'async' });
    expect(tree.children![1].properties!.loading).toBe('eager');
    expect(tree.children![1].properties!.decoding).toBe('async');
  });
});

/* ---------- 5. 标题锚点 ---------- */

describe('headingAnchors', () => {
  it('给 h2 打 id 并在文前插入 headerlink 锚', () => {
    const tree = root(el('h2', {}, [txt('Hello 世界')]));
    runPlugin(headingAnchors(), tree);
    const h2 = tree.children![0];
    expect(h2.properties!.id).toBe('hello-世界');
    expect(h2.children![0].properties!.className).toEqual(['headerlink']);
    expect(h2.children![0].properties!.href).toBe('#hello-世界');
  });

  it('同名标题按 slugger 续号，不撞 id', () => {
    const tree = root(el('h2', {}, [txt('部署')]), el('h2', {}, [txt('部署')]));
    runPlugin(headingAnchors(), tree);
    expect(tree.children![0].properties!.id).toBe('部署');
    expect(tree.children![1].properties!.id).toBe('部署-1');
  });
});

/* ---------- 6. 代码块：包裹 + 工具栏（两趟） ---------- */

describe('codeChrome + codeToolbar', () => {
  const pre = () =>
    el('pre', { dataLanguage: 'bash', className: ['astro-code'] }, [
      el('code', {}, [
        el('span', { className: ['line'] }, [txt('ls')]),
        el('span', { className: ['line'] }, [txt('cd')]),
      ]),
    ]);

  it('第一趟把 <pre> 包进 figure.highlight，记下语言与行数', () => {
    const tree = root(pre());
    runPlugin(codeChrome(), tree);
    const figure = tree.children![0];
    expect(figure.tagName).toBe('figure');
    expect(figure.properties!.className).toEqual(['highlight']);
    expect(figure.properties!.dataLang).toBe('bash');
    expect(figure.properties!.dataLines).toBe('2');
    expect(figure.children![0].tagName).toBe('pre');
  });

  it('已被包进 figure 的 pre 不重复包（幂等）', () => {
    const tree = root(el('figure', { className: ['highlight'] }, [pre()]));
    runPlugin(codeChrome(), tree);
    expect(tree.children![0].tagName).toBe('figure');
    expect(tree.children![0].children!.length).toBe(1);
  });

  it('第二趟在 pre 之前插入语言标签与复制按钮', () => {
    const tree = root(pre());
    runPlugin(codeChrome(), tree);
    runPlugin(codeToolbar(), tree);
    const figure = tree.children![0];
    expect(figure.children!.map((n) => n.tagName)).toEqual(['div', 'pre']);
    const toolbar = figure.children![0];
    expect(textOf(toolbar)).toContain('bash');
    expect(toolbar.children![1].properties!.className).toEqual(['code-copy']);
  });

  it('没有 figure 父级的裸 pre 不加工具栏', () => {
    const tree = root(pre());
    runPlugin(codeToolbar(), tree);
    expect(tree.children![0].tagName).toBe('pre');
  });
});

/* ---------- 7. 子路径部署前缀 ---------- */

describe('baseLinks', () => {
  it('根部署返回 null（主路径不引入多余遍历）', () => {
    expect(baseLinks('/')).toBeNull();
    expect(baseLinks('')).toBeNull();
  });

  it('根相对链接补前缀，已有前缀 / 协议相对 / 锚点 / mailto 不动', () => {
    const plugin = baseLinks('/blog')!;
    const tree = root(
      el('a', { href: '/posts/hello/' }),
      el('a', { href: '/blog/posts/already/' }),
      el('a', { href: '//cdn.example.com/x' }),
      el('a', { href: '#frag' }),
      el('a', { href: 'mailto:me@example.com' }),
      el('img', { src: '/img/a.png' }),
    );
    runPlugin(plugin, tree);
    expect(tree.children![0].properties!.href).toBe('/blog/posts/hello/');
    expect(tree.children![1].properties!.href).toBe('/blog/posts/already/');
    expect(tree.children![2].properties!.href).toBe('//cdn.example.com/x');
    expect(tree.children![3].properties!.href).toBe('#frag');
    expect(tree.children![4].properties!.href).toBe('mailto:me@example.com');
    expect(tree.children![5].properties!.src).toBe('/blog/img/a.png');
  });

  it('正文里的原始 HTML（raw 节点）也用字符串层面补上', () => {
    const plugin = baseLinks('/blog')!;
    const rawNode: HNode = {
      type: 'raw',
      value: '<figure><img src="/img/a.png" alt="图"><figcaption>说明</figcaption></figure>',
    };
    const tree = root(rawNode);
    runPlugin(plugin, tree);
    expect(rawNode.value).toContain('src="/blog/img/a.png"');
    /* 属性之外的文本不能被误伤 */
    expect(rawNode.value).toContain('<figcaption>说明</figcaption>');
  });

  it('没改动时 raw 返回 undefined，不做无谓的写回', () => {
    const plugin = baseLinks('/blog')!;
    const rawNode: HNode = { type: 'raw', value: '<p>纯文字，没有链接</p>' };
    expect(plugin.raw!(rawNode)).toBeUndefined();
  });
});
