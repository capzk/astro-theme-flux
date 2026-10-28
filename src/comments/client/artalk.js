/**
 * Artalk 挂载（浏览器）
 * ---------------------------------------------------------------------------
 * 构建期能算的都在 section.init 里，这里只补三件「只有浏览器才知道」的事：
 *
 *   el        挂载点（provider 传不过 JSON）
 *   pageTitle 当前页标题（给后台列表和邮件通知用）
 *   darkMode  当前是不是暗色 —— 主题的深浅色挂在 html 的 data 属性上，
 *             Artalk 的 `darkMode: 'auto'` 看的是 prefers-color-scheme，
 *             读者手动切过主题时两者会对不上，所以这里自己判。
 *
 * 深色之外还要**跟着切**：主题的切换按钮只改 html 上的 data-user-color-scheme，
 * 不发任何事件。用 MutationObserver 盯住这一个属性，比在主题脚本里埋一个
 * 「通知所有第三方」的钩子便宜 —— 评论系统是唯一的外部依赖，为一个它去改
 * 全局的切换逻辑不划算。
 */

/** 当前是不是暗色。和 main.css 里那套选择器读的是同一个属性 */
const isDark = () => document.documentElement.dataset.userColorScheme === 'dark';

/**
 * @param {object} ctx
 * @param {HTMLElement} ctx.el      挂载点
 * @param {object} ctx.section      构建期下发的配置（type / js / css / init / lazy）
 * @param {(src: string) => Promise<any>} ctx.loadModule 动态 import（带重试去缓存）
 */
export default async function mountArtalk({ el, section, loadModule }) {
  const mod = await loadModule(section.js);
  /* ESM 给的是 default；万一将来换成 UMD 入口，命名空间本身就是那个类 */
  const Artalk = mod?.default ?? mod;

  if (!Artalk || typeof Artalk.init !== 'function') {
    throw new Error('Artalk 客户端没有导出 init()');
  }

  const instance = Artalk.init({
    ...section.init,
    el,
    pageTitle: document.title,
    darkMode: isDark(),
  });

  if (!instance) throw new Error('Artalk 没有返回实例');

  const observer = new MutationObserver(() => {
    try {
      instance.setDarkMode(isDark());
    } catch {
      /* 老版本没有这个方法；样式不对但评论照常能用，不该把整个评论区判为失败 */
    }
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-user-color-scheme'],
  });
}
