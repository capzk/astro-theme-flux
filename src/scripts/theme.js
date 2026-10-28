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
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  const root = document.documentElement;
  const current = () => root.dataset.userColorScheme || 'light';

  btn.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    root.dataset.userColorScheme = next;
    try {
      localStorage.setItem('flux-color-scheme', next);
    } catch {
      /* 隐私模式下 localStorage 可能不可写，忽略 */
    }
  });

  /* 系统偏好变化时，只有用户没手动选过才跟随 */
  try {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', (e) => {
      if (localStorage.getItem('flux-color-scheme')) return;
      root.dataset.userColorScheme = e.matches ? 'dark' : 'light';
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

  const setOpen = (open) => {
    menu.hidden = !open;
    menu.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? labelClose : labelOpen);
    document.body.classList.toggle('is-locked', open);
  };

  btn.addEventListener('click', () => setOpen(menu.hidden));
  /* 点菜单里的链接后自动收起 */
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
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
  const links = Array.from(document.querySelectorAll('.toc-link'));
  if (!links.length) return;

  /* 只保留能在正文里找到目标的链接，找不到的（锚点被插件改过）不参与高亮 */
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
  let active = null;
  let ticking = false;

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
  const buttons = document.querySelectorAll('.code-copy');
  if (!buttons.length) return;

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
          document.execCommand('copy');
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

  /* 只接管「没有被链接包着」的图片；带链接的图保持原来的跳转行为 */
  const isZoomable = (img) => !img.closest('a');

  let overlay = null;
  let closeBtn = null;
  let bigImg = null;
  let opener = null;

  const close = () => {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    if (opener && typeof opener.focus === 'function') {
      opener.focus({ preventScroll: true });
    }
  };

  const open = (img) => {
    /* 遮罩第一次用到时才建，避免每个页面都背一份无用的 DOM */
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'img-zoom';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-hidden', 'true');
      overlay.innerHTML =
        '<button type="button" class="img-zoom-close" aria-label="关闭">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
        '</button><img alt="">';
      document.body.appendChild(overlay);

      closeBtn = overlay.querySelector('.img-zoom-close');
      bigImg = overlay.querySelector('img');
      closeBtn.addEventListener('click', close);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
      });
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
      });
    }

    bigImg.src = img.currentSrc || img.src;
    bigImg.alt = img.alt || '';
    opener = img;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    closeBtn.focus({ preventScroll: true });
  };

  body.addEventListener('click', (e) => {
    const img = e.target.closest('img');
    if (!img || !body.contains(img) || !isZoomable(img)) return;
    e.preventDefault();
    open(img);
  });
}

/* ---------- 8. 邮箱地址还原 ---------- */
function initEmailLinks() {
  const nodes = document.querySelectorAll('span.email-link[data-mail]');
  if (!nodes.length) return;

  for (const node of nodes) {
    let address;
    try {
      address = atob(node.dataset.mail);
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
  const node = document.querySelector('.footer-runtime');
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
