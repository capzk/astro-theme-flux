/**
 * 地址 → 源（origin）。
 * ---------------------------------------------------------------------------
 * 只为了拼 `<link rel="preconnect">`：同源地址、站内相对路径、写错的地址
 * 都不该出现在预连接列表里，所以这里统一用 URL 解析一遍，解析不出来就返回 null。
 *
 * 放在单独的文件里是因为 waline.ts / giscus.ts / index.ts 都要用 ——
 * 塞进 index.ts 会和它们互相 import 成环。
 */
export function originOf(src: string | undefined): string | null {
  if (!src) return null;
  try {
    const url = new URL(src, 'https://placeholder.invalid');
    if (url.origin === 'https://placeholder.invalid') return null;
    return url.origin;
  } catch {
    return null;
  }
}

/** 去重并丢掉站内地址（同站不用握手，浏览器本来就有连接） */
export function originsOf(...sources: (string | undefined)[]): string[] {
  const seen = new Set<string>();
  for (const src of sources) {
    const origin = originOf(src);
    if (origin) seen.add(origin);
  }
  return [...seen];
}
