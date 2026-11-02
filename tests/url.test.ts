import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * `src/utils/url.ts` 的 BASE 是**模块求值时**算出来的（`import.meta.env.BASE_URL`），
 * 所以每个变体都要 resetModules 后重新 import —— 这正好也是真实情况：
 * 一次构建里 BASE 只定一次，中途不会变。
 */
async function loadUrlModule(baseUrl: string) {
  vi.resetModules();
  vi.stubEnv('BASE_URL', baseUrl);
  return import('../src/utils/url');
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('根部署（BASE_URL = "/"）', () => {
  it('所有函数都是恒等变换', async () => {
    const { withBase, stripBase, publicPath, prefixMarkdownLinks, HAS_BASE } =
      await loadUrlModule('/');
    expect(HAS_BASE).toBe(false);
    expect(withBase('/posts/x/')).toBe('/posts/x/');
    expect(stripBase('/posts/x/')).toBe('/posts/x/');
    expect(publicPath('/img/a.png')).toBe('/img/a.png');
    expect(prefixMarkdownLinks('[x](/posts/x/)')).toBe('[x](/posts/x/)');
  });
});

describe('子路径部署（BASE_URL = "/blog/"）', () => {
  it('站内绝对路径补前缀', async () => {
    const { withBase, HAS_BASE } = await loadUrlModule('/blog/');
    expect(HAS_BASE).toBe(true);
    expect(withBase('/posts/x/')).toBe('/blog/posts/x/');
  });

  it('幂等：已经带前缀的不会叠成 /blog/blog/', async () => {
    const { withBase } = await loadUrlModule('/blog/');
    expect(withBase('/blog/posts/x/')).toBe('/blog/posts/x/');
    expect(withBase(withBase('/posts/x/'))).toBe('/blog/posts/x/');
  });

  it('外链、协议相对、锚点、相对路径、空串都原样返回', async () => {
    const { withBase } = await loadUrlModule('/blog/');
    expect(withBase('https://example.com/a')).toBe('https://example.com/a');
    expect(withBase('//cdn.example.com/a.js')).toBe('//cdn.example.com/a.js');
    expect(withBase('#main')).toBe('#main');
    expect(withBase('foo/bar')).toBe('foo/bar');
    expect(withBase('')).toBe('');
  });

  it('前缀本身不带尾斜杠，边界要对齐 —— /blog 与 /blogger 不能混', async () => {
    const { withBase, stripBase } = await loadUrlModule('/blog/');
    expect(withBase('/blog')).toBe('/blog');
    expect(withBase('/blogger/')).toBe('/blog/blogger/');
    expect(stripBase('/blogger/')).toBe('/blogger/');
  });
});

describe('stripBase', () => {
  it('把运行时 pathname 还原成逻辑路径', async () => {
    const { stripBase } = await loadUrlModule('/blog/');
    expect(stripBase('/blog/posts/x/')).toBe('/posts/x/');
    expect(stripBase('/blog')).toBe('/');
    expect(stripBase('/blog/')).toBe('/');
  });

  it('不在前缀下的路径原样返回', async () => {
    const { stripBase } = await loadUrlModule('/blog/');
    expect(stripBase('/posts/x/')).toBe('/posts/x/');
  });
});

describe('publicPath', () => {
  it('没有前导斜杠的当作 public 根目录', async () => {
    const { publicPath } = await loadUrlModule('/blog/');
    expect(publicPath('img/a.png')).toBe('/blog/img/a.png');
    expect(publicPath('/img/a.png')).toBe('/blog/img/a.png');
  });

  it('外链与 data URI 不碰', async () => {
    const { publicPath } = await loadUrlModule('/blog/');
    expect(publicPath('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
    expect(publicPath('data:image/svg+xml;base64,AAA')).toBe('data:image/svg+xml;base64,AAA');
    expect(publicPath('#x')).toBe('#x');
  });
});

describe('prefixMarkdownLinks', () => {
  it('改 ](...) 链接与 src/href 属性', async () => {
    const { prefixMarkdownLinks } = await loadUrlModule('/blog/');
    const md = '[上一篇](/posts/x/)\n\n<img src="/img/a.png">';
    expect(prefixMarkdownLinks(md)).toBe(
      '[上一篇](/blog/posts/x/)\n\n<img src="/blog/img/a.png">',
    );
  });

  it('围栏代码块整段跳过 —— 那里面是给人看的示例', async () => {
    const { prefixMarkdownLinks } = await loadUrlModule('/blog/');
    const md = '```md\n[上一篇](/posts/x/)\n```\n\n[真链接](/posts/y/)';
    expect(prefixMarkdownLinks(md)).toBe(
      '```md\n[上一篇](/posts/x/)\n```\n\n[真链接](/blog/posts/y/)',
    );
  });

  it('外链与锚点不动', async () => {
    const { prefixMarkdownLinks } = await loadUrlModule('/blog/');
    const md = '[a](https://x.test/p) [b](#sec) [c](/posts/z/)';
    expect(prefixMarkdownLinks(md)).toBe('[a](https://x.test/p) [b](#sec) [c](/blog/posts/z/)');
  });

  it('空文本直接返回', async () => {
    const { prefixMarkdownLinks } = await loadUrlModule('/blog/');
    expect(prefixMarkdownLinks('')).toBe('');
  });
});
