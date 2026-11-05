// @ts-check
/**
 * Nest 挂载（浏览器）
 * ---------------------------------------------------------------------------
 * Nest 的组件是**传统脚本**（IIFE），不是 ES 模块：产物里 `var Nest = …` 一旦用
 * `import()` 加载就落进模块作用域，`window.Nest` 根本不会出现，自动挂载也读不到
 * 脚本标签上的 data-*。所以这里跟 giscus 一样自己造 `<script>` 标签，不走 loadModule。
 *
 * 接法就是文档里那两行，只是容器由 Comments.astro 提供：
 *
 *   <div class="comment-body" data-nest data-server="…" data-page-key="…"></div>
 *   <script defer src="…/widget/comment.min.js"></script>
 *
 * 脚本一执行就自己扫 `[data-nest]` 挂载，所以 **data-* 必须写在 append 之前**，
 * 且容器上要备齐全部选项 —— 不依赖脚本标签（动态插入的标签在 module/async 语境下
 * `document.currentScript` 未必是它）。
 *
 * 额外做一件事：主题切深浅色时同步宿主的 `data-nest-theme`。组件的配色是
 * `light-dark()` + `:host([data-nest-theme=…]) { color-scheme: … }`，
 * 改这一个属性就够了 —— **不用卸载重建**，所以评论不会重拉一遍。
 */
import { whenIdle } from './idle.js';

/** 博客把当前配色写在 html 的这个属性上（BaseLayout 首帧脚本）。和 main.css 读的是同一个 */
const isDark = () => document.documentElement.dataset.userColorScheme === 'dark';

/**
 * @param {object} ctx
 * @param {HTMLElement} ctx.el      挂载点
 * @param {import('./types.js').CommentSection} ctx.section 构建期下发的配置
 * @param {number} ctx.attempt      第几次尝试（重试时换个查询参数绕缓存）
 * @returns {Promise<void>}
 */
export default function mountNest({ el, section, attempt }) {
  const init = section.init || {};
  /** @type {string} */
  const server = String(init.server || '');
  /** @type {string} */
  const pageKey = String(init.pageKey || '');
  const pageSize = Number(init.pageSize) || 20;
  const heading = typeof init.heading === 'string' ? init.heading : '';

  /* 构建期没下发 theme = 「跟着博客走」；下发 'auto' 是组件自己的「跟随系统」。 */
  const configured =
    init.theme === 'auto' || init.theme === 'light' || init.theme === 'dark'
      ? init.theme
      : undefined;
  const followsBlog = configured === undefined;
  const currentTheme = () =>
    followsBlog ? /** @type {'light' | 'dark'} */ (isDark() ? 'dark' : 'light') : configured;

  /** @type {Record<string, string>} */
  const attrs = {
    'data-nest': '',
    'data-server': server,
    'data-page-key': pageKey,
    'data-page-size': String(pageSize),
    'data-theme': currentTheme() || 'auto',
  };
  if (heading) attrs['data-heading'] = heading;

  /* 先写属性，再插脚本：脚本执行时会立刻扫一遍 DOM，晚一步就是空评论区 */
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);

  /**
   * 交给全局 `Nest.mount` 的显式选项，优先级高于 data-*。
   * 自动挂载已经调过一次也没关系 —— 组件在宿主元素上有幂等标记，第二次直接返回原句柄。
   */
  const options = {
    server,
    pageKey,
    pageSize,
    theme: currentTheme(),
    ...(heading ? { heading } : {}),
  };

  /**
   * 视口里的挂载是重活（Vue 建应用 + 首次取评论），推迟到主线程空闲:
   * 读者正滚到评论区时不会因为同步挂载掉帧。
   * @returns {Promise<void>}
   */
  const mountNow = async () => {
    const api = /** @type {any} */ (window).Nest;
    if (!api || typeof api.mount !== 'function') {
      throw new Error('Nest 组件没有挂到 window.Nest（脚本未执行完或产物不对）');
    }
    await whenIdle(() => api.mount(el, options));

    if (!followsBlog) return;
    /* 切主题只改组件认的那个属性，不重建：重建会把已展开的编辑框、已输入的草稿一起丢掉。
       注意是 data-nest-theme（组件挂载时从 data-theme 拷到宿主上的那个），
       不是 data-theme —— 后者只在挂载那一刻读一次。 */
    new MutationObserver(() => {
      el.setAttribute('data-nest-theme', /** @type {string} */ (currentTheme()));
    }).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-user-color-scheme'],
    });
  };

  /* 脚本已经就位（同页多个评论区、或者上一次挂载成功）：直接挂，别再拉一遍 */
  if (/** @type {any} */ (window).Nest) return mountNow();

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    /* 重试时换个查询参数，绕开浏览器对失败脚本的缓存 */
    script.src =
      attempt > 0 ? `${section.js}?retry=${attempt}` : /** @type {string} */ (section.js);
    script.async = true;

    script.addEventListener(
      'load',
      () => {
        mountNow().then(resolve, reject);
      },
      { once: true },
    );
    script.addEventListener(
      'error',
      () => {
        script.remove();
        reject(new Error(`${section.js} 加载失败`));
      },
      { once: true },
    );

    document.head.appendChild(script);
  });
}
