import { describe, expect, it } from 'vitest';
import { deepMerge } from '../src/config/merge';

describe('deepMerge', () => {
  it('普通对象逐层递归合并', () => {
    const base = { banner: { enable: true, height: '60vh' }, title: 'Base' };
    const merged = deepMerge(base, { banner: { height: '40vh' } });
    expect(merged).toEqual({ banner: { enable: true, height: '40vh' }, title: 'Base' });
  });

  it('数组整体替换，不拼接', () => {
    const base = { nav: [{ label: 'a' }, { label: 'b' }] };
    const merged = deepMerge(base, { nav: [{ label: 'c' }] });
    expect(merged.nav).toEqual([{ label: 'c' }]);
  });

  it('undefined 视为「没写」，保留默认值', () => {
    const base = { img: '/img/a.png', height: '60vh' };
    const merged = deepMerge(base, { img: undefined });
    expect(merged.img).toBe('/img/a.png');
  });

  it('图片资源对象整体替换，不拆开合并', () => {
    const base = { img: '/img/a.png' };
    const asset = { src: '/_astro/b.png', width: 1200, height: 630, format: 'webp' };
    const merged = deepMerge<{ img: unknown }>(base, { img: asset });
    expect(merged.img).toEqual(asset);
  });

  it('两边都不会被修改', () => {
    const base: { a: { x?: number; y?: number } } = { a: { x: 1 } };
    const patch = { a: { y: 2 } };
    deepMerge(base, patch);
    expect(base).toEqual({ a: { x: 1 } });
    expect(patch).toEqual({ a: { y: 2 } });
  });

  it('patch 为空 / undefined 时原样返回默认值', () => {
    const base = { a: 1 };
    expect(deepMerge(base, {})).toEqual({ a: 1 });
    expect(deepMerge(base, undefined)).toEqual({ a: 1 });
  });
});
