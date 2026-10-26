/**
 * 构建期提示
 * ---------------------------------------------------------------------------
 * 评论配置是逐页解析的，同一个问题会在每篇文章上重报一次 —— 这里按 key 去重。
 *
 * 只是提示，不中断构建：配置写错一项不该让整站构建失败，尤其是评论这种
 * 「没配好就整块不渲染」的可选功能。
 */
const warned = new Set<string>();

export function warnOnce(key: string, message: string): void {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(message);
}
