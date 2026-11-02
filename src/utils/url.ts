/**
 * 站内地址 · base 前缀
 * ---------------------------------------------------------------------------
 * Astro 的 `base` 让站点可以部署在子路径（如 `https://example.com/blog/`）。
 * 一旦设了它，**所有站内绝对路径**都要带上该前缀：`/posts/x/` 要变成
 * `/blog/posts/x/`，否则链接、搜索索引、RSS 自引用全部 404。
 *
 * 主题里凡是「拼出来」的地址都从这里过一道：
 *
 *   withBase('/posts/x/')        站内路由
 *   publicPath('/img/a.png')     public/ 里的资源字符串
 *   stripBase(Astro.url.pathname) 反向：运行时要拿「逻辑路径」去匹配路由
 *
 * 规则刻意做得**幂等**：已经带前缀的再调一次不会叠成 `/blog/blog/...`。
 * 这样调用点不必记得「这条 path 是不是已经拼过 base」，重复调用也没有副作用。
 *
 * `import.meta.env.BASE_URL` 由 Vite 在构建期替换，值形如 `'/blog/'`（永远带尾斜杠）。
 * 没设 base 时是 `'/'`，此时所有函数都是恒等变换 —— 默认部署完全不受影响。
 */

/** 归一成不带尾斜杠的前缀；根路径是空串，方便直接拼接 */
const BASE = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');

/** 本站是否部署在子路径 */
export const HAS_BASE = BASE !== '';

/**
 * 给站内绝对路径补上 base 前缀。
 *
 * 只处理以单个 `/` 开头的站内路径：外链（`https://`）、协议相对（`//`）、
 * 相对路径（`foo/bar`）与纯锚点（`#x`）原样返回。已经带前缀的不重复添加。
 */
export function withBase(path: string): string {
  if (!path || !path.startsWith('/') || path.startsWith('//') || !BASE) return path;
  if (path === BASE || path.startsWith(`${BASE}/`)) return path;
  return `${BASE}${path}`;
}

/**
 * 反向：把运行时拿到的 pathname（含 base）还原成主题内部用的逻辑路径。
 * `/blog/posts/x/` → `/posts/x/`；不在前缀下、或本来就没设 base 时原样返回。
 */
export function stripBase(pathname: string): string {
  if (!BASE) return pathname;
  if (pathname === BASE) return '/';
  return pathname.startsWith(`${BASE}/`) ? pathname.slice(BASE.length) : pathname;
}

/**
 * public/ 里的资源地址。
 *
 * 与 withBase 的区别只在语义：这类值可能来自配置（`SITE.avatar`、`banner.img`），
 * 也可能被写成外链或相对路径。外链不碰；以 `/` 开头的补 base；
 * 其余（如 `img/a.png`）按 public 根目录处理，补一个 `/` 再补 base。
 *
 * 注意：`import` 进来的图片资源走 `ImageMetadata`，由 Astro 自己处理 base，
 * 不要传进来。
 */
export function publicPath(src: string): string {
  if (!src) return src;
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(src)) return src;
  return withBase(src.startsWith('/') ? src : `/${src}`);
}

/**
 * 给 **Markdown 原文** 里的站内链接补前缀。
 *
 * 需要它的地方只有一处：`/llms-full.txt` —— 那份文件直接吐 `post.body`（Markdown
 * 原文），不经过 HAST，所以渲染期的补前缀碰不到它。博客正文里写
 * `[上一篇](/posts/x/)` 或 `![](/img/a.png)`，在子路径部署下就会指向站外。
 *
 * 只动两种形态：`](...)` 链接与 `src="/..."` / `href="/..."` 属性。
 * **围栏代码块整段跳过** —— 那里面是给人看的示例，改了就成了错的示例。
 *
 * 根部署时原样返回（`HAS_BASE` 为 false），一次字符串扫描都不做。
 */
export function prefixMarkdownLinks(md: string): string {
  if (!HAS_BASE || !md) return md;

  const rewrite = (chunk: string) =>
    chunk
      .replace(/\]\((\/[^)\s]*)/g, (_, path: string) => `](${withBase(path)}`)
      .replace(/\b(href|src)="(\/[^"]*)"/g, (_, attr: string, path: string) => `${attr}="${withBase(path)}"`);

  /* split 带捕获组时，分隔符本身会留在结果里 —— 奇数下标就是那段代码块 */
  return md
    .split(/(^```[\s\S]*?^```)/m)
    .map((chunk, i) => (i % 2 === 1 ? chunk : rewrite(chunk)))
    .join('');
}
