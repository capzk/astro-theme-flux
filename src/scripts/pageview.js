/**
 * Flux · 文章浏览量
 * ---------------------------------------------------------------------------
 * 只用评论系统提供的「计数插件」——Waline 的 pageview.js 压缩后不到 1KB，
 * 比整个评论区（100KB 上下）轻了三档，所以它在页面 load 后就发，不等滚动。
 *
 * 和评论区彻底解耦：评论关掉、懒加载从没触发、读者滚都不滚，阅读数照常统计。
 * 插件地址、导出名、占位 class 都由构建期算好写在 JSON 里，
 * 这里不认识任何具体评论系统的名字。
 */
function start(config) {
  const run = async () => {
    try {
      const mod = await import(/* @vite-ignore */ config.js);
      const count = mod[config.exportName];
      if (typeof count !== 'function') {
        throw new Error(`插件没有导出 ${config.exportName}()`);
      }
      /* 返回的是取消函数，正常情况用不上；失败了也不影响正文 */
      count({
        ...config.options,
        selector: config.className,
        path: config.path,
      });
    } catch (error) {
      console.warn('[flux] 浏览量统计没跑起来（不影响阅读）：', error);
    }
  };

  /* 让位给正文：正文和图片先加载完，再发这个请求 */
  if (document.readyState === 'complete') {
    run();
  } else {
    window.addEventListener('load', run, { once: true });
  }
}

const node = document.querySelector('.pageview-config');
if (node) {
  try {
    const config = JSON.parse(node.textContent || '');
    if (config && config.js && config.exportName) start(config);
  } catch (error) {
    console.error('[flux] 浏览量配置解析失败', error);
  }
}
