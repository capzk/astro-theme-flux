/**
 * 可安全注入 HTML 的 JSON 序列化。
 * ---------------------------------------------------------------------------
 * JSON.stringify 不转义 `<` `>` `&`。标题里只要出现字面量 `</script>`，就能提前
 * 闭合宿主的 <script> 标签 —— 结构化数据整块失效，理论上还可被用来注入脚本。
 * 把这三个字符转成等价的 \u 转义，JSON 语义不变、又能安全塞进 set:html。
 */
export function safeJson(value: unknown): string {
  return (JSON.stringify(value) ?? 'null')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}
