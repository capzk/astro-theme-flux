/**
 * 构建期注入的虚拟模块
 * ---------------------------------------------------------------------------
 * `virtual:flux-lqip` 由 `src/integrations/lqip.mjs` 在 `astro:config:setup`
 * 里生成，磁盘上没有对应文件，所以 TS 得在这里知道它的形状。
 *
 * 键是「相对项目根目录的正斜杠路径」（`src/assets/banner.webp`、
 * `public/img/og.png`），值是 18 个字符的十六进制串：顶左 + 顶右 + 底右。
 */
declare module 'virtual:flux-lqip' {
  const table: Record<string, string>;
  export default table;
}
