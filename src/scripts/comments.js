/**
 * Flux · 评论区（Waline）
 * ---------------------------------------------------------------------------
 * 评论是本站唯一的运行时外部依赖，所以加载这件事要克制：
 *
 *   1. 滚动到评论区附近才拉客户端（配置里 `lazy` 可关），首屏不为评论付流量；
 *   2. 脚本用动态 import()，不往 window 上挂全局对象，也不塞一个 <script> 标签；
 *   3. 加载中给骨架屏，失败给可重试的提示 —— 评论挂了，正文照样能读。
 *
 * 配置由 Comments.astro 以 JSON 写在页面里，这里只负责读和用。
 * 深色模式不在这里同步：Waline 自己监听 `html[data-user-color-scheme="dark"]`。
 */

/** 我们自己的选项（不该传给 Waline 的） */
const LOCAL_KEYS = ['js', 'css', 'lazy', 'imageUpload'];

/** 提前多久开始拉脚本。600px 大约是「再滚一屏就到评论区」的距离 */
const PRELOAD_MARGIN = '600px 0px';

/**
 * 从组件写在页面里的 JSON 读配置。
 * 用 JSON + textContent 而不是内联脚本，是为了让 CSP 友好：
 * 没有一段可执行的 JS 需要放行。
 */
function readConfig(section) {
  const node = section.querySelector('.comment-config');
  if (!node) return null;
  try {
    return JSON.parse(node.textContent || '');
  } catch (error) {
    console.error('[flux] 评论配置解析失败', error);
    return null;
  }
}

/**
 * 组装 Waline 的 init 选项。
 * 不直接透传整个配置对象，而是逐键挑 —— 我们的 `lazy` / `imageUpload` 这些
 * 名字它不认识，多传也不报错，但会脏了它的 options。
 */
function toOptions(config, mount) {
  const options = {
    el: mount,
    /* 标题上那枚「N 条评论」由它回填（默认选择器 .waline-comment-count） */
    comment: true,
    /* 浏览量统计要占位元素和额外请求，主题暂时没放位置，明确关掉 */
    pageview: false,
  };

  for (const [key, value] of Object.entries(config)) {
    if (LOCAL_KEYS.includes(key) || value === undefined) continue;
    options[key] = value;
  }

  /* 上传开关在 Waline 里叫 imageUploader，且只有明确关闭时才需要传 */
  if (config.imageUpload === false) options.imageUploader = false;

  return options;
}

/** 样式：失败也放行 —— 评论能用只是不好看，好过整块消失 */
function loadStyles(href) {
  if (!href || document.querySelector('link[data-waline-style]')) return Promise.resolve();

  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.walineStyle = '';
    link.addEventListener('load', () => resolve(), { once: true });
    link.addEventListener('error', () => resolve(), { once: true });
    document.head.appendChild(link);
  });
}

/**
 * 拉客户端。
 * 动态 import 失败的结果会被浏览器按 URL 记住，重试时换个查询参数换个 key，
 * 否则第二次点「重试」拿到的还是同一个失败的 Promise。
 */
function importClient(src, attempt) {
  const url = attempt > 0 ? `${src}${src.includes('?') ? '&' : '?'}retry=${attempt}` : src;
  return import(/* @vite-ignore */ url);
}

function start(section) {
  const config = readConfig(section);
  const mount = section.querySelector('.comment-body');
  const status = section.querySelector('.comment-status');
  /* 这两个都在 .comment-status 里面找，别用 section 查 ——
     <noscript> 里也有一份 .comment-status-text，全局查会拿到错的 */
  const statusText = status && status.querySelector('.comment-status-text');
  const retry = status && status.querySelector('.comment-retry');

  /* 配置缺失、或者压根没填服务端地址，就别演了：正文里什么都不留 */
  if (!config || !config.serverURL || !mount || !status || !statusText || !retry) {
    section.remove();
    return;
  }

  let instance = null;
  let busy = false;
  let attempt = 0;

  const load = async () => {
    if (busy || instance) return;
    busy = true;
    section.dataset.state = 'loading';
    status.hidden = true;

    try {
      await loadStyles(config.css);
      const client = await importClient(config.js, attempt);
      const next = client.init(toOptions(config, mount));
      if (!next) throw new Error('Waline 没有返回实例');

      instance = next;
      section.dataset.state = 'ready';
      mount.setAttribute('aria-busy', 'false');
    } catch (error) {
      section.dataset.state = 'error';
      statusText.textContent = section.dataset.error || '';
      status.hidden = false;
      mount.setAttribute('aria-busy', 'false');
      console.error('[flux] 评论加载失败，检查 js 地址与网络：', config.js, error);
    } finally {
      busy = false;
    }
  };

  retry.addEventListener('click', () => {
    if (busy || instance) return;
    attempt += 1;
    load();
  });

  /* 不想懒加载，或者环境不支持 IntersectionObserver：直接拉 */
  if (config.lazy === false || !('IntersectionObserver' in window)) {
    load();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      load();
    },
    { rootMargin: PRELOAD_MARGIN },
  );
  observer.observe(section);
}

const section = document.querySelector('.comment-section');
if (section) start(section);
