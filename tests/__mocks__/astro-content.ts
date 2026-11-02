/**
 * `astro:content` 的测试 mock
 * ---------------------------------------------------------------------------
 * 纯函数测试里 `import type { CollectionEntry }` 在编译后不留运行时痕迹，
 * 所以正常情况下永远不会执行到这里。这个文件是一道保险：万一哪个测试不小心
 * import 了 `astro:content` 的运行时接口（如 `getCollection`），直接抛一个
 * 描述性错误，比「模块找不到」的原生报错更容易定位问题。
 *
 * vitest.config.ts 里通过 `resolve.alias` 把 `astro:content` 指向这里。
 */

export function getCollection(): never {
  throw new Error(
    '`getCollection` 不应该在单元测试里被调用 —— ' +
      '纯函数测试请确保只 `import type`，不 import 运行时接口。' +
      '如果需要集成测试，请用 `astro build` + 产物断言。',
  );
}

export function getEntry(): never {
  throw new Error('`getEntry` 不应该在单元测试里被调用。');
}

export function render(): never {
  throw new Error('`render` 不应该在单元测试里被调用。');
}

export function defineCollection(config: unknown) {
  return config;
}

export type CollectionEntry<_T extends string> = {
  id: string;
  data: Record<string, unknown>;
  body?: string;
};
