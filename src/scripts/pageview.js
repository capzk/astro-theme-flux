/**
 * Flux · 文章浏览量
 * ---------------------------------------------------------------------------
 * 只用评论系统提供的「计数插件」——Waline 的 pageview.js 压缩后不到 1KB，
 * 比整个评论区（100KB 上下）轻了三档，所以它在 DOM 就绪后就发，不等滚动。
 *
 * 和评论区彻底解耦：评论关掉、懒加载从没触发、读者滚都不滚，阅读数照常统计。
 * 插件地址、导出名、占位 class 都由构建期算好写在 JSON 里，
 * 这里不认识任何具体评论系统的名字。
 *
 * 三档退路：
 *   1. 带 update 调一次 —— 计数 +1 并把结果显示出来；
 *   2. 4 秒还没数字，再调一次「只读」—— 计数写不进去时（服务端限制来源域、
 *      隐私插件、拦截器），至少数字能显示；
 *   3. 仍然没有，就把整块「阅读 N 次」从页面上摘掉。
 *      宁可这一项不存在，也不要留一句「阅读 次」的残句 —— 那看着就像坏了。
 *
 * 为什么不能只靠插件的 Promise：它的 `fetch().then(回填)` 没有 catch，
 * 写失败时整条链被丢掉，外面拿不到任何信号 —— 所以这里用「等结果」而不是「等 Promise」。
 */
const POLL_MS = 150;
const FIRST_WAIT = 4000;
const SECOND_WAIT = 4000;

/** 占位元素里是不是已经有数字了 */
function filled(selector) {
  return [...document.querySelectorAll(selector)].some(
    (el) => (el.textContent ?? '').trim() !== '',
  );
}

/** 轮询到有内容，或超时返回 false */
function waitForFill(selector, timeout) {
  if (filled(selector)) return Promise.resolve(true);

  return new Promise((resolve) => {
    const deadline = Date.now() + timeout;
    const tick = () => {
      if (filled(selector)) return resolve(true);
      if (Date.now() >= deadline) return resolve(false);
      setTimeout(tick, POLL_MS);
    };
    setTimeout(tick, POLL_MS);
  });
}

/** 拿不到数字：把这一项摘掉，别在页面上留残句 */
function drop(reason) {
  console.warn('[flux] 浏览量没拿到，已隐藏这一项（不影响阅读）：', reason);
  document.querySelectorAll('[data-pageview]').forEach((el) => el.remove());
}

async function start(config) {
  let count;
  try {
    const mod = await import(/* @vite-ignore */ config.js);
    count = mod[config.exportName];
    if (typeof count !== 'function') {
      throw new Error(`插件没有导出 ${config.exportName}()`);
    }
  } catch (error) {
    return drop(error);
  }

  const call = (override) =>
    count({
      ...config.options,
      selector: config.className,
      path: config.path,
      ...override,
    });

  try {
    call({});
  } catch (error) {
    return drop(error);
  }
  if (await waitForFill(config.className, FIRST_WAIT)) return;

  /* 写不进去就退回只读：数字准不准是次要的，先让它显示出来。
     配置里本来就写成只读，就没必要再试一次 */
  if (config.options?.update === false) return drop('接口没有在预期时间内返回计数');

  try {
    call({ update: false });
  } catch (error) {
    return drop(error);
  }
  if (await waitForFill(config.className, SECOND_WAIT)) return;

  drop('接口没有在预期时间内返回计数');
}

const node = document.querySelector('.pageview-config');
if (node) {
  try {
    const config = JSON.parse(node.textContent || '');
    /* DOM 就绪就发，不等 window load —— 数字在首屏的 banner 上，
       等所有图片加载完就太晚了；而这个请求本身只有几百字节 */
    if (config && config.js && config.exportName) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => start(config), { once: true });
      } else {
        start(config);
      }
    }
  } catch (error) {
    console.error('[flux] 浏览量配置解析失败', error);
  }
}
