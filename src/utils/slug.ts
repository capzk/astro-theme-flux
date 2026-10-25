/**
 * 文章 URL 生成
 * ---------------------------------------------------------------------------
 * 一条规则：URL 只允许小写字母、数字、`-` 和 `/`。中文、空格、标点、emoji
 * 一律不进地址栏 —— 它们要么被转写，要么被丢掉，绝不作原样出现。
 *
 * 为什么不直接让中文留在 URL 里：能跑，但地址栏会被浏览器还原成
 * `/posts/%E4%B8%AD%E6%96%87/` 或直接显示汉字，分享出去又长又脏，复制到
 * 聊天软件里还会被二次转义。宁可生成 `zhong-wen`。
 *
 * 汉字用拼音转写（pinyin-pro，构建期依赖，不会进浏览器产物）。
 * 多音字按词组上下文取音（`重庆` → `chong-qing`），比逐字查表准。
 * 转写不出东西的字符（emoji、纯符号、生僻字）会被丢弃；整段被丢空时
 * 由调用方报错，而不是瞎编一个路径 —— 静默生成的 URL 比构建失败更难查。
 */
import { pinyin } from 'pinyin-pro';

/** 单段长度上限。够放 25 个汉字的拼音，再长就截断，免得地址栏overflow */
const MAX_SEGMENT = 80;

/** 一段文本 → 一段安全 slug（不含 `/`） */
export function slugify(input: string): string {
  /* NFKD 把 `é` 拆成 `e` + 组合音标，再把组合音标整段删掉 ——
     这样 `café` 得到 `cafe` 而不是 `caf`。`ü` 也走这条路，得到 `u`。 */
  const normalized = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  /* nonZh: 'consecutive' 让连续的英文/数字保持原样，只有汉字才转拼音。
     否则 `Rust 2026` 会被拆成一堆碎片再拼回去。 */
  return pinyin(normalized, { toneType: 'none', type: 'array', nonZh: 'consecutive' })
    .map((part) => part.replace(/[^a-z0-9]+/g, '-'))
    .filter(Boolean)
    .join('-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SEGMENT)
    /* 截断可能刚好停在 `-` 上，再收一次尾 */
    .replace(/-+$/g, '');
}

/**
 * 一篇文章 → 相对 `/posts/` 的路径（可能多段，用 `/` 连接）
 *
 * @param id  内容集合里的 id，等于相对 `src/content/posts/` 的路径去掉扩展名，
 *            例如 `2026/yearly-review`
 * @param custom  front matter 里的 `slug`，可选
 *
 * 规则：
 *   - 不给 `slug`：沿用文件路径，逐段 slugify。`2026/年度总结.md` → `2026/nian-du-zong-jie`
 *   - `slug` 不含 `/`：只替换文件名那一段，目录原样保留
 *   - `slug` 含 `/`：整条路径由 `slug` 决定，文件所在的目录不再拼进来
 *
 * 目录段同样过一遍 slugify，所以哪怕你用一个中文目录名建文件夹，
 * URL 里也不会出现中文。
 */
export function postSlug(id: string, custom?: string): string {
  const segments = id.split('/');
  const dirs = segments.slice(0, -1);
  const file = segments[segments.length - 1] ?? '';
  const override = custom?.trim();

  const parts = !override
    ? [...dirs, file]
    : override.includes('/')
      ? override.split('/')
      : [...dirs, override];

  /* 每段独立清洗：空段（开头/结尾的 `/`、`..` 之类）直接消失，
     所以 `slug: /../../etc/passwd` 只会得到 `etc/passwd`，跑不出 /posts/。 */
  return parts.map(slugify).filter(Boolean).join('/');
}
