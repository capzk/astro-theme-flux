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
 *   4. 目录：滚动高亮当前章节（目录 HTML 是构建期渲染的，这里只管高亮）
 *   5. 代码块复制
 *   6. 回到顶部
 *   7. 正文图片放大
 *   8. 邮箱地址还原成可点的链接（构建期被降级成文本，见 plugins/markdown.js）
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

/* ---------- 4. 目录滚动高亮 ---------- */
function initToc() {
  const links = /** @type {HTMLAnchorElement[]} */ (
    Array.from(document.querySelectorAll('.toc-link'))
  );
  if (!links.length) return;

  /* 只保留能在正文里找到目标的链接，找不到的（锚点被插件改过）不参与高亮 */
  /** @type {{ link: HTMLAnchorElement, target: HTMLElement }[]} */
  const items = [];
  for (const link of links) {
    let id = link.hash.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch {
      /* hash 里有非法转义就按原样找 */
    }
    const target = document.getElementById(id);
    if (target) items.push({ link, target });
  }
  if (!items.length) return;

  /* 判定线：标题越过视口顶部这条线就算「当前章节」。
     与 .markdown-body 标题的 scroll-margin-top(5rem) 呼应，略低一点。 */
  const LINE = 100;
  /** @type {HTMLAnchorElement | null} */
  let active = null;
  let ticking = false;

  /** @param {HTMLAnchorElement} link */
  const setActive = (link) => {
    if (link === active) return;
    if (active) {
      active.classList.remove('is-active');
      active.removeAttribute('aria-current');
    }
    active = link;
    if (active) {
      active.classList.add('is-active');
      active.setAttribute('aria-current', 'location');
    }
  };

  const sync = () => {
    ticking = false;
    /* 从后往前找「已经越过判定线的最后一个标题」。
       比 IntersectionObserver 稳：滚到页面底部时最后一个章节也能被选中。 */
    let current = items[0].link;
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i].target.getBoundingClientRect().top - LINE <= 0) {
        current = items[i].link;
        break;
      }
    }
    setActive(current);
  };

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(sync);
    },
    { passive: true },
  );
  window.addEventListener('resize', sync, { passive: true });
  sync();
}

/* ---------- 5. 代码复制 ---------- */
function initCodeCopy() {
  const buttons = /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('.code-copy'));
  if (!buttons.length) return;

  /**
   * @param {HTMLElement} btn
   * @param {string} key
   * @param {string} fallback
   * @returns {string}
   */
  const labelOf = (btn, key, fallback) => btn.getAttribute(key) || fallback;

  for (const btn of buttons) {
    btn.addEventListener('click', async () => {
      const figure = btn.closest('.highlight');
      const code = figure?.querySelector('pre');
      if (!code) return;

      const text = code.innerText;
      const done = () => {
        btn.textContent = labelOf(btn, 'data-label-copied', 'COPIED');
        btn.classList.add('is-copied');
        window.setTimeout(() => {
          btn.textContent = labelOf(btn, 'data-label-copy', 'COPY');
          btn.classList.remove('is-copied');
        }, 1600);
      };

      try {
        await navigator.clipboard.writeText(text);
        done();
      } catch {
        /* Clipboard API 不可用（非 https / 老浏览器）时退回到选区复制 */
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
          /* execCommand('copy') 在 lib.dom 里标了 @deprecated，但眼下没有能同步
             复制选区的替代品（异步的 clipboard API 就是上面失败的那条）。
             经 any 转一手，免得每次 `astro check` 都刷一条废弃提示。 */
          /** @type {any} */ (document).execCommand('copy');
          done();
        } catch {
          /* 真复制不了就什么都不做，别假装成功 */
        }
        ta.remove();
      }
    });
  }
}

/* ---------- 6. 回到顶部 ---------- */
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

/* ---------- 7. 正文图片放大 ---------- */
function initImageZoom() {
  const body = document.querySelector('.markdown-body');
  if (!body) return;

  /** 只接管「没有被链接包着」的图片；带链接的图保持原来的跳转行为
   * @param {HTMLImageElement} img */
  const isZoomable = (img) => !img.closest('a');

  /* 与搜索弹层保持一致：打开时对背景设 inert，屏幕阅读器与 Tab 不会穿透遮罩 */
  const INERT_TARGETS = ['header', 'main', 'footer', '#scroll-top'];
  /** @param {boolean} inert */
  const setBackgroundInert = (inert) => {
    for (const sel of INERT_TARGETS) {
      const node = document.querySelector(sel);
      if (!node) continue;
      if (inert) node.setAttribute('inert', '');
      else node.removeAttribute('inert');
    }
  };

  /**
   * 遮罩的三块 DOM。整体存在一个对象里而不是三个并列变量：它们要么一起存在、
   * 要么一起为 null，分开写只会让类型检查到处怀疑「这个是不是还没建」。
   * @type {{ box: HTMLElement, close: HTMLButtonElement, img: HTMLImageElement } | null}
   */
  let ui = null;
  /** @type {HTMLImageElement | null} */
  let opener = null;

  const close = () => {
    if (!ui) return;
    ui.box.classList.remove('is-open');
    ui.box.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    setBackgroundInert(false);
    if (opener) opener.focus({ preventScroll: true });
  };

  /** 第一次用到时才建，避免每个页面都背一份无用的 DOM */
  const ensureUi = () => {
    if (ui) return ui;

    const box = document.createElement('div');
    box.className = 'img-zoom';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-hidden', 'true');
    box.innerHTML =
      '<button type="button" class="img-zoom-close" aria-label="关闭">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
      '</button><img alt="">';
    document.body.appendChild(box);

    const closeBtn = /** @type {HTMLButtonElement} */ (box.querySelector('.img-zoom-close'));
    const zoomImg = /** @type {HTMLImageElement} */ (box.querySelector('img'));
    ui = { box, close: closeBtn, img: zoomImg };

    closeBtn.addEventListener('click', close);
    box.addEventListener('click', (e) => {
      if (e.target === box) close();
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && box.classList.contains('is-open')) close();
    });

    return ui;
  };

  /** @param {HTMLImageElement} img */
  const open = (img) => {
    const zoom = ensureUi();
    zoom.img.src = img.currentSrc || img.src;
    zoom.img.alt = img.alt || '';
    opener = img;
    zoom.box.classList.add('is-open');
    zoom.box.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    /* 背景设 inert 后，Tab 和读屏都被限制在遮罩内 */
    setBackgroundInert(true);
    zoom.close.focus({ preventScroll: true });
  };

  body.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const img = target.closest('img');
    if (!(img instanceof HTMLImageElement) || !body.contains(img) || !isZoomable(img)) return;
    e.preventDefault();
    open(img);
  });
}

/* ---------- 8. 邮箱地址还原 ---------- */
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

/* ---------- 9. 页脚站龄 ---------- */
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
initToc();
initCodeCopy();
initScrollTop();
initImageZoom();
initEmailLinks();
initRuntime();
