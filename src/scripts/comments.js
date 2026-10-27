/**
 * Flux · 评论区加载器
 * ---------------------------------------------------------------------------
 * 这一层不认识任何具体的评论系统，只负责「什么时候拉、拉失败了怎么办」：
 *
 *   1. 滚到距评论区 `lazy` 像素时才拉（配置里 0 = 不懒加载），首屏不为评论付流量；
 *   2. 脚本站用动态 import / script 标签，不往 window 上挂全局对象；
 *   3. 加载中给骨架屏，失败给可重试的提示 —— 评论挂了，正文照样能读。
 *
 * 「拉下来之后怎么挂」交给 src/comments/client/ 里对应的 mounter。
 * 配置由 Comments.astro 以 JSON 写在页面里（CSP 友好：没有可执行内联脚本）。
 */
import { MOUNTERS } from '../comments/client/index.js';

/** 没配 lazy 时的兜底距离，和 src/config 的默认值保持一致 */
const DEFAULT_LAZY = 600;

/**
 * 从组件写在页面里的 JSON 读配置。
 * 用 JSON + textContent 而不是内联脚本，是为了让 CSP 友好。
 */
function readSection(section) {
  const node = section.querySelector('.comment-config');
  if (!node) return null;
  try {
    return JSON.parse(node.textContent || '');
  } catch (error) {
    console.error('[flux] 评论配置解析失败', error);
    return null;
  }
}

/** 样式：失败也放行 —— 评论能用只是不好看，好过整块消失 */
function loadStyles(href) {
  if (!href || document.querySelector(`link[data-comment-style="${href}"]`)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.commentStyle = href;
    link.addEventListener('load', () => resolve(), { once: true });
    link.addEventListener('error', () => resolve(), { once: true });
    document.head.appendChild(link);
  });
}

/**
 * 动态 import，失败可重试。
 * import 失败的结果会被浏览器按 URL 记住，重试时换个查询参数换个 key，
 * 否则第二次点「重试」拿到的还是同一个失败的 Promise。
 */
function importModule(src, attempt) {
  const url = attempt > 0 ? `${src}${src.includes('?') ? '&' : '?'}retry=${attempt}` : src;
  return import(/* @vite-ignore */ url);
}

function start(section) {
  const data = readSection(section);
  const mountEl = section.querySelector('.comment-body');
  const status = section.querySelector('.comment-status');
  /* 这两个都在 .comment-status 里面找，别用 section 查 ——
     <noscript> 里也有一份 .comment-status-text，全局查会拿到错的 */
  const statusText = status && status.querySelector('.comment-status-text');
  const retry = status && status.querySelector('.comment-retry');

  /* 配置缺失、类型没实现、或者压根没填服务端地址，就别演了：正文里什么都不留 */
  if (!data || !data.type || !MOUNTERS[data.type] || !mountEl || !status || !statusText || !retry) {
    section.remove();
    return;
  }

  const mount = MOUNTERS[data.type];
  let done = false;
  let busy = false;
  let attempt = 0;

  const load = async () => {
    if (busy || done) return;
    busy = true;
    section.dataset.state = 'loading';
    status.hidden = true;

    try {
      await loadStyles(data.css);
      await mount({
        el: mountEl,
        section: data,
        attempt,
        loadModule: (src) => importModule(src, attempt),
      });

      done = true;
      section.dataset.state = 'ready';
      mountEl.setAttribute('aria-busy', 'false');
    } catch (error) {
      section.dataset.state = 'error';
      statusText.textContent = section.dataset.error || '';
      status.hidden = false;
      mountEl.setAttribute('aria-busy', 'false');
      console.error('[flux] 评论加载失败，检查 js 地址与网络：', data.js, error);
    } finally {
      busy = false;
    }
  };

  retry.addEventListener('click', () => {
    if (busy || done) return;
    attempt += 1;
    load();
  });

  /* 不想懒加载，或者环境不支持 IntersectionObserver：直接拉 */
  const lazy = typeof data.lazy === 'number' ? data.lazy : DEFAULT_LAZY;
  if (lazy <= 0 || !('IntersectionObserver' in window)) {
    load();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      load();
    },
    /* 往上多留 lazy 像素：读者还没滚到评论区，脚本就已经在路上了 */
    { rootMargin: `${lazy}px 0px` },
  );
  observer.observe(section);
}

const section = document.querySelector('.comment-section');
if (section) start(section);
