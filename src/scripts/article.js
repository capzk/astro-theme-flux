// @ts-check
/**
 * Flux · 正文页交互
 * ---------------------------------------------------------------------------
 * 从 theme.js 拆出来的三块，只有文章页（以及带正文的关于页）用得到：
 *
 *   1. 目录：滚动高亮当前章节（目录 HTML 是构建期渲染的，这里只管高亮）
 *   2. 代码块复制
 *   3. 正文图片放大
 *
 * 列表页（首页 / 归档 / 标签 / 分类）一个字都用不到，所以不进首屏那个 bundle。
 * theme.js 会先看页面里有没有对应 DOM，有才 import —— 与 search.js 同一套做法。
 * 三个 init 自己都会判空，多加载一次也不会出错。
 */

/* ---------- 1. 目录滚动高亮 ---------- */
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


/* ---------- 2. 代码复制 ---------- */
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


/* ---------- 3. 正文图片放大 ---------- */
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

initToc();
initCodeCopy();
initImageZoom();

/* 没有导出，但要让它是一个「模块」：动态 import() 只认模块 —— 否则 tsc 报
   ts(2306) File is not a module。空导出在打包时会被完全摇掉，产物里不留字节。 */
export {};
