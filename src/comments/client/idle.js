/**
 * 把一段重活推迟到主线程空闲时执行，返回它的结果。
 * ---------------------------------------------------------------------------
 * 评论系统（Waline / Artalk）的挂载会实例化整棵 Vue 应用，同步执行时会把读者
 * 正在进行的滚动一起卡住。用 requestIdleCallback 排到空闲时段，并带一个超时兜底：
 * 浏览器一直很忙时也会在 timeout 后强制执行，不会永远不挂。
 *
 * @param {() => unknown} fn 要执行的重活
 * @param {number} [timeout] 兜底超时（毫秒）
 */
export function whenIdle(fn, timeout = 2000) {
  return new Promise((resolve, reject) => {
    const run = () => {
      try {
        resolve(fn());
      } catch (error) {
        reject(error);
      }
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(run, { timeout });
    } else {
      setTimeout(run, 1);
    }
  });
}
