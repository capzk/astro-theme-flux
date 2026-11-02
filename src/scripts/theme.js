// @ts-check
/**
 * Flux · 交互脚本
 * ---------------------------------------------------------------------------
 * 原版这些行为散在 boot.js / color-schema.js / events.js / plugins.js 里，还依赖
 * jQuery + tocbot + clipboard.js + nprogress。这里合成一个原生模块：
 *
 *   1. 顶栏：首页透明 → 滚动变实色
 *   2. 深色模式：切换并写入 localStorage（首帧恢复在 BaseLayout 的内联脚本里）
 *   3. 移动端菜单
 *   4. 回到顶部
 *   5. 邮箱地址还原成可点的链接（构建期被降级成文本，见 plugins/markdown.js）
 *   6. 页脚站龄
 *
 * 目录高亮 / 代码复制 / 正文图片放大在 `article.js` —— 那三块只有文章页用得上，
 * 列表页不该为它们付下载与解析成本，所以按 DOM 存在与否动态 import。
 *
 * 全部可选增强：脚本没加载时页面依然完整可读（导航是普通链接、正文是普通文本）。
 */

/* ---------- 1. 顶栏 ---------- */
function initNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  const transparent = nav.dataset.home === 'true';

  const sync = () => {
    const solid = !transparent || window.scrollY > 80;
    nav.classList.toggle('is-solid', solid);
  };
  sync();
  window.addEventListener('scroll', sync, { passive: true });
}

/* ---------- 2. 深色模式 ---------- */
function initTheme() {
  const root = document.documentElement;
  const current = () => root.dataset.userColorScheme || 'light';

  /**
   * 地址栏配色（`<meta name="theme-color">`）。
   *
   * 页面里那两条 meta 是靠 `media="(prefers-color-scheme: …)"` 让浏览器自己挑的，
   * 但「读者手动切过主题」之后，系统偏好就不再等于页面配色了 —— 系统是亮色、
   * 读者选了暗色时，地址栏会一直停在亮色那条。
   *
   * 所以这里在首帧与每次切换时把 media 摘掉，两条都写成本次选中的颜色
   * （同值重复没有副作用，浏览器取第一条）。脚本没跑起来时 media 仍然有效。
   */
  const metas = /** @type {HTMLMetaElement[]} */ (
    Array.from(document.querySelectorAll('meta[name="theme-color"][data-light][data-dark]'))
  );
  const syncThemeColor = () => {
    const dark = current() === 'dark';
    for (const meta of metas) {
      const color = dark ? meta.dataset.dark : meta.dataset.light;
      if (color) meta.setAttribute('content', color);
      meta.removeAttribute('media');
    }
  };
  syncThemeColor();

  const btn = document.getElementById('theme-toggle');
  /* 关闭深色模式时按钮不渲染：配色已经由首帧脚本锁成亮色，
     这里把地址栏对齐就结束，不需要再挂监听 */
  if (!btn) return;

  btn.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    root.dataset.userColorScheme = next;
    try {
      localStorage.setItem('flux-color-scheme', next);
    } catch {
      /* 隐私模式下 localStorage 可能不可写，忽略 */
    }
    syncThemeColor();
  });

  /* 系统偏好变化时，只有「默认策略是跟随系统、且用户没手动选过」才切换。
     固定成 light / dark 时系统怎么变都与本站无关 —— 之前这里漏了这一层，
     设了 `darkMode.default: 'light'` 的站在系统切暗时会突然变暗。 */
  try {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', (e) => {
      if (root.dataset.darkDefault !== 'auto') return;
      try {
        if (localStorage.getItem('flux-color-scheme')) return;
      } catch {
        return;
      }
      root.dataset.userColorScheme = e.matches ? 'dark' : 'light';
      syncThemeColor();
    });
  } catch {
    /* 老浏览器没有 addEventListener on mql，忽略 */
  }
}

/* ---------- 3. 移动端菜单 ---------- */
function initMobileMenu() {
  const btn = document.getElementById('menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  /* 两套文案由组件通过 data-* 注入，按钮的语义跟着开合状态走 */
  const labelOpen = btn.dataset.labelOpen || '打开菜单';
  const labelClose = btn.dataset.labelClose || '关闭菜单';

  /** @param {boolean} open */
  const setOpen = (open) => {
    menu.hidden = !open;
    menu.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? labelClose : labelOpen);
    document.body.classList.toggle('is-locked', open);
  };

  btn.addEventListener('click', () => setOpen(Boolean(menu.hidden)));
  /* 点菜单里的链接后自动收起 */
  menu.addEventListener('click', (e) => {
    if (e.target instanceof Element && e.target.closest('a')) setOpen(false);
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) setOpen(false);
  });
  /* 从移动宽度切回桌面时，别把抽屉留在打开状态 */
  window.matchMedia('(min-width: 992px)').addEventListener('change', (e) => {
    if (e.matches) setOpen(false);
  });
}

/* ---------- 4. 回到顶部 ---------- */
function initScrollTop() {
  const btn = document.getElementById('scroll-top');
  if (!btn) return;

  const sync = () => btn.classList.toggle('is-visible', window.scrollY > 400);
  sync();
  window.addEventListener('scroll', sync, { passive: true });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ---------- 5. 邮箱地址还原 ---------- */
function initEmailLinks() {
  const nodes = /** @type {NodeListOf<HTMLSpanElement>} */ (
    document.querySelectorAll('span.email-link[data-mail]')
  );
  if (!nodes.length) return;

  for (const node of nodes) {
    let address;
    try {
      address = atob(node.dataset.mail || '');
    } catch {
      continue; /* base64 坏了就保持纯文本，总比显示一串乱码强 */
    }
    if (!address) continue;

    const link = document.createElement('a');
    link.className = node.className;
    link.href = `mailto:${address}`;
    link.textContent = address;
    /* drop 掉 data-mail：还原之后它就是一条普通的 mailto 链接了 */
    node.replaceWith(link);
  }
}

/* ---------- 6. 页脚站龄 ---------- */
/**
 * 把「已运行 N 天」校正到访问当天。
 *
 * 为什么不在构建期算完就算数：静态站可能几个月甚至一年不重新构建，那样页脚上
 * 会一直挂着构建那天的天数 —— 一个写着「已运行 3 天」却天天在更新的博客，
 * 比不显示更糟。
 *
 * 也没做成每秒跳动的计时器：秒级更新会让页脚文字宽度一直变，读起来在抖，
 * 而「运行了多少天」本来就没有秒级的信息量。
 */
function initRuntime() {
  const node = /** @type {HTMLElement | null} */ (document.querySelector('.footer-runtime'));
  if (!node) return;

  const start = Date.parse(node.dataset.since || '');
  if (Number.isNaN(start)) return; /* 日期写坏了就保留服务端渲染的那份 */

  const days = Math.max(0, Math.floor((Date.now() - start) / 86_400_000));
  const text = (node.dataset.text || '').replace('{n}', String(days));
  if (text && node.textContent.trim() !== text) node.textContent = text;
}

initNavbar();
initTheme();
initMobileMenu();
initScrollTop();
initEmailLinks();
initRuntime();

/* 正文页专属的三块（目录高亮 / 代码复制 / 图片放大）单独成 chunk：
   列表页没有这些 DOM，判断为假就完全不下载 —— 和 search.js 一个思路。
   用 `.markdown-body img` 而不是只看 `.markdown-body`：关于页也有正文容器，
   但正文里没有图时，图片放大那段同样用不上。 */
if (document.querySelector('.toc-link, .code-copy, .markdown-body img')) {
  void import('./article.js');
}
