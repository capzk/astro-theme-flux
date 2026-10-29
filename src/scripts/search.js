/**
 * Flux · 站内搜索
 * ---------------------------------------------------------------------------
 * 索引：构建期生成的 /searchindex.json（见 src/pages/searchindex.json.ts）
 * 匹配：标题 > 分类 / 标签 > 正文，纯 indexOf，没有分词与模糊库
 *
 * 为什么不带分词：中文用 bigram 分词的收益主要在「长句里找词」，而博客搜索
 * 绝大多数是「我记得标题里有某个词」。线性扫 + 分档权重足够，还能做到零依赖、
 * 首屏 8KB 左右的索引。
 *
 * 交互：/ 或 Ctrl/⌘+K 打开，Esc 关闭，↑↓ 选择，Enter 进入。
 */

const MODAL = 'search-modal';
let index = null; // 懒加载：只有第一次打开搜索才请求索引
let loading = null;

function qs(sel, root = document) {
  return root.querySelector(sel);
}

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

/* 弹层打开时把页面其余部分设为 inert：屏幕阅读器与 Tab 都不会再落到底下的内容上。
   弹层是 <body> 的直接子元素，不在 header/main/footer 里，不会被误伤。
   浏览器不支持 inert 时 setAttribute 只是一个普通属性，没有副作用。 */
const INERT_TARGETS = ['header', 'main', 'footer', '#scroll-top'];
function setBackgroundInert(inert) {
  for (const sel of INERT_TARGETS) {
    const node = document.querySelector(sel);
    if (!node) continue;
    if (inert) node.setAttribute('inert', '');
    else node.removeAttribute('inert');
  }
}

/* 界面文案由 SearchModal 通过 data-* 传进来（见 src/i18n.ts），
   这里的默认值只是兜底 —— 正常渲染时用不到。 */
const TEXT = {
  start: '输入关键词开始搜索',
  empty: '没有找到相关文章',
};

async function loadIndex() {
  if (index) return index;
  if (!loading) {
    loading = fetch('/searchindex.json')
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((data) => {
        index = Array.isArray(data) ? data : [];
        return index;
      })
      .catch(() => {
        index = [];
        return index;
      });
  }
  return loading;
}

/** 分档打分：标题命中权重最高 */
function score(item, terms) {
  const title = (item.t || '').toLowerCase();
  const termsText = `${item.c || ''} ${item.g || ''}`.toLowerCase();
  const body = (item.x || '').toLowerCase();

  let total = 0;
  for (const term of terms) {
    let s = 0;
    if (title.includes(term)) s += 30;
    if (termsText.includes(term)) s += 12;
    if (body.includes(term)) s += 4;
    /* 一个词都没命中就整体淘汰（AND 语义，结果更准） */
    if (s === 0) return 0;
    total += s;
  }
  return total;
}

function openModal(modal, input) {
  modal.classList.add('is-open');
  document.body.classList.add('is-locked');
  setBackgroundInert(true);
  input.value = '';
  renderEmpty('');
  /* 弹层一打开就开始取索引。读者从「打开」到「敲下第一个字」通常还有零点几秒，
     正好把这一趟（一个几十 KB 的 JSON）藏进去，第一次搜索就不会卡在等索引上。
     失败也无所谓：loadIndex 内部已经把错误吞成空索引。 */
  void loadIndex();
  /* 等弹层可见再聚焦，避免 iOS 上滚动跳动 */
  requestAnimationFrame(() => input.focus());
}

function closeModal(modal) {
  modal.classList.remove('is-open');
  document.body.classList.remove('is-locked');
  setBackgroundInert(false);
  /* 关闭后把焦点还给触发按钮，键盘用户不会「掉」在页面某处 */
  document.querySelector('#search-toggle')?.focus();
}

function renderEmpty(message) {
  const list = qs('#search-results');
  if (!list) return;
  list.replaceChildren(el('li', 'search-empty', message || TEXT.start));
}

function renderResults(list, items, activeIndex) {
  list.replaceChildren();
  items.forEach((item, i) => {
    const li = el('li', `search-item${i === activeIndex ? ' is-active' : ''}`);
    const a = el('a');
    a.href = item.u;
    a.append(el('span', 'search-item-title', item.t));
    const meta = [item.d, item.c, item.g].filter(Boolean).join(' · ');
    if (meta) a.append(el('span', 'search-item-meta', meta));
    li.append(a);
    list.append(li);
  });
}

export function initSearch() {
  const modal = qs(`#${MODAL}`);
  const input = qs('#search-input');
  const list = qs('#search-results');
  const openBtn = qs('#search-toggle');
  if (!modal || !input || !list) return;

  /* 文案以构建期注入的 data-* 为准，脚本里不再写死 */
  if (modal.dataset.textStart) TEXT.start = modal.dataset.textStart;
  if (modal.dataset.textEmpty) TEXT.empty = modal.dataset.textEmpty;

  let results = [];
  let activeIndex = 0;

  const run = async () => {
    const raw = input.value.trim().toLowerCase();
    if (!raw) {
      results = [];
      renderEmpty('');
      return;
    }
    const data = await loadIndex();
    /* 空格分词，最多取 4 个词，避免「一句话」把结果全过滤掉 */
    const terms = raw.split(/\s+/).filter(Boolean).slice(0, 4);

    results = data
      .map((item) => ({ item, s: score(item, terms) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || (a.item.d < b.item.d ? 1 : -1))
      .slice(0, 20)
      .map((x) => x.item);

    activeIndex = 0;
    if (!results.length) renderEmpty(TEXT.empty);
    else renderResults(list, results, activeIndex);
  };

  let timer = 0;
  input.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(run, 120);
  });

  /* 键盘：↑↓ 选择，Enter 进入 */
  input.addEventListener('keydown', (e) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex =
        e.key === 'ArrowDown'
          ? (activeIndex + 1) % results.length
          : (activeIndex - 1 + results.length) % results.length;
      renderResults(list, results, activeIndex);
      list.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = results[activeIndex];
      if (target) window.location.href = target.u;
    }
  });

  /* 焦点环：背景已 inert，这里再保证 Tab 在弹层内循环，不跑到浏览器地址栏 */
  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusables = modal.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  openBtn?.addEventListener('click', () => openModal(modal, input));
  /* 鼠标移上去就预取索引 —— 比点开再取早一步，且只发生一次 */
  openBtn?.addEventListener('pointerenter', () => void loadIndex(), { once: true });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(modal);
  });

  document.addEventListener('keydown', (e) => {
    const isOpen = modal.classList.contains('is-open');

    if (e.key === 'Escape' && isOpen) {
      closeModal(modal);
      return;
    }
    /* Ctrl/⌘+K 或 单个 / —— 但输入框里按 / 不该被拦走 */
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '');
    const hitHotkey =
      (e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing);
    if (hitHotkey) {
      e.preventDefault();
      if (isOpen) closeModal(modal);
      else openModal(modal, input);
    }
  });
}

initSearch();
