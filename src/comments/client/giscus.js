/**
 * Giscus 挂载（浏览器）
 * ---------------------------------------------------------------------------
 * Giscus 不是 ES 模块：往 `.giscus` 里插一个带 data-* 属性的 <script>，
 * 它自己建 iframe。所以这里不走 loadModule，自己造标签。
 *
 * 额外做一件事：主题切深浅色时用 postMessage 通知 iframe 换配色
 * —— iframe 里的东西我们改不到，只能走它的接口。
 */

/** repoId → repo-id。giscus 的属性全是 kebab-case */
function kebab(key) {
  return key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

const ORIGIN = 'https://giscus.app';

export default function mountGiscus({ el, section, attempt }) {
  /* themeLight / themeDark 是主题自己留着切换用的，不能当 data 属性发出去 */
  const { themeLight, themeDark, ...attrs } = section.init;

  const isDark = () => document.documentElement.dataset.userColorScheme === 'dark';

  const box = document.createElement('div');
  box.className = 'giscus';

  const script = document.createElement('script');
  /* 重试时换个查询参数，绕开浏览器对失败脚本的缓存 */
  script.src = attempt > 0 ? `${section.js}?retry=${attempt}` : section.js;
  script.async = true;
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null) continue;
    script.dataset[kebab(key)] = String(value);
  }
  /* 放在最后：万一 init 里还带着 theme（旧配置），别让它盖掉当前这套 */
  script.dataset.theme = isDark() ? themeDark : themeLight;

  box.appendChild(script);
  el.appendChild(box);

  /* 切主题：找到 giscus 的 iframe 发消息。iframe 还没建好时发出去会被丢掉，
     所以监听这一次就够了 —— 首次配色由 data-theme 决定 */
  new MutationObserver(() => {
    const frame = el.querySelector('iframe.giscus-frame');
    if (!frame || !frame.contentWindow) return;
    frame.contentWindow.postMessage(
      { giscus: { setConfig: { theme: isDark() ? themeDark : themeLight } } },
      ORIGIN,
    );
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-user-color-scheme'],
  });

  return new Promise((resolve, reject) => {
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener(
      'error',
      () => reject(new Error('giscus.app/client.js 加载失败')),
      { once: true },
    );
  });
}
