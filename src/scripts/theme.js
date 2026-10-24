/**
 * Flux · 交互脚本
 * ---------------------------------------------------------------------------
 * 原版这些行为散在 boot.js / color-schema.js / events.js / plugins.js 里，还依赖
 * jQuery + tocbot + clipboard.js + nprogress。这里合成一个原生模块，四件事：
 *
 *   1. 顶栏：首页透明 → 滚动变实色
 *   2. 深色模式：切换并写入 localStorage（首帧恢复在 BaseLayout 的内联脚本里）
 *   3. 目录：跟随滚动高亮当前小节（IntersectionObserver 替代 tocbot）
 *   4. 代码块复制 / 回到顶部 / 移动端菜单
 *
 * 全部可选增强：脚本没加载时页面依然完整可读（导航是普通链接、目录是普通锚点）。
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

  const setOpen = (open) => {
    menu.hidden = !open;
    menu.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
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

/* ---------- 4. 目录跟随高亮 ---------- */
function initToc() {
  const links = [...document.querySelectorAll('.toc-link')];
  if (!links.length) return;

  const map = new Map();
  for (const link of links) {
    const id = decodeURIComponent(link.hash.slice(1));
    const el = document.getElementById(id);
    if (el) map.set(el, link);
  }
  if (!map.size) return;

  let active = null;
  const setActive = (link) => {
    if (link === active) return;
    if (active) active.classList.remove('is-active');
    active = link;
    if (link) link.classList.add('is-active');
  };

  const observer = new IntersectionObserver(
    (entries) => {
      /* 取「已进入视口且最靠上」的那个标题 */
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length) {
        setActive(map.get(visible[0].target) ?? null);
        return;
      }
      /* 都离开视口时，回退到「最后一个已经划过顶部的标题」 */
      const passed = [...map.keys()]
        .filter((el) => el.getBoundingClientRect().top < 120)
        .pop();
      if (passed) setActive(map.get(passed) ?? null);
    },
    { rootMargin: '-80px 0px -60% 0px', threshold: [0, 1] },
  );

  for (const el of map.keys()) observer.observe(el);
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

initNavbar();
initTheme();
initMobileMenu();
initToc();
initCodeCopy();
initScrollTop();
