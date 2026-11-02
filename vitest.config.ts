import { defineConfig } from 'vitest/config';

/**
 * 单元测试配置
 * ---------------------------------------------------------------------------
 * 只测**纯函数**：`src/utils/` 里不碰 astro:content 的那几个。
 *
 * 为什么不测组件 / 页面：那要跑 `astro build` 再看产物，属于集成测试。
 * 真正的回归网是 `npm run check` + `npm run build`（CI 里两条都在跑），
 * 这里补的是「边界条件」—— 分页越界、置顶排序、相关文章同分、base 幂等
 * 这类在真实页面上一时看不出、但改一行就可能悄悄坏掉的规则。
 *
 * `astro:content` 在纯函数里只是 `import type`，编译后不留痕迹；
 * 万一哪个测试真的把它拉进来，下面的 alias 会兜住，而不是抛「模块找不到」。
 */
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    /* 每个测试文件独立模块图 —— url.ts 的 BASE 是模块求值时算的，
       要测「带前缀」的变体就得靠 resetModules + 重新 import。 */
    isolate: true,
  },
});
