import { describe, expect, it } from 'vitest';
import {
  byDateDesc,
  categoryCounts,
  countOf,
  groupByYear,
  neighbours,
  pageUrlOf,
  paginate,
  postsWithTerm,
  relatedPosts,
  seriesOf,
  stickyFirst,
  stickyOnly,
  tagCounts,
  termUrl,
} from '../src/utils/post-list';
import { idsOf, makePost } from './helpers';

describe('byDateDesc', () => {
  it('新的排前面', () => {
    const a = makePost({ id: 'a', date: '2026-01-01' });
    const b = makePost({ id: 'b', date: '2026-05-01' });
    expect(idsOf([a, b].sort(byDateDesc))).toEqual(['b', 'a']);
  });
});

describe('stickyFirst', () => {
  it('置顶排在前，其余仍按时间倒序', () => {
    const posts = [
      makePost({ id: 'old-pin', date: '2024-01-01', sticky: true }),
      makePost({ id: 'new', date: '2026-06-01' }),
      makePost({ id: 'mid-pin', date: '2025-01-01', sticky: true }),
      makePost({ id: 'older', date: '2023-01-01' }),
    ];
    expect(idsOf(stickyFirst(posts))).toEqual(['mid-pin', 'old-pin', 'new', 'older']);
  });

  it('不修改传入的数组', () => {
    const posts = [makePost({ id: 'a' }), makePost({ id: 'b', sticky: true })];
    const before = idsOf(posts);
    stickyFirst(posts);
    expect(idsOf(posts)).toEqual(before);
  });
});

describe('stickyOnly', () => {
  it('只留置顶，且保持时间倒序', () => {
    const posts = [
      makePost({ id: 'a', date: '2024-01-01', sticky: true }),
      makePost({ id: 'b', date: '2026-01-01' }),
      makePost({ id: 'c', date: '2025-01-01', sticky: true }),
    ];
    expect(idsOf(stickyOnly(posts))).toEqual(['c', 'a']);
  });

  it('没有置顶时是空数组 —— 调用方要按「hero 用最新补位」自己处理', () => {
    expect(stickyOnly([makePost({ id: 'a' })])).toEqual([]);
  });
});

describe('paginate', () => {
  const items = Array.from({ length: 7 }, (_, i) => i + 1);

  it('lastPage 向上取整，且至少为 1', () => {
    expect(paginate(items, 3).lastPage).toBe(3);
    expect(paginate([], 3).lastPage).toBe(1);
  });

  it('pageSize 小于 1 时按 1 处理，不会除零', () => {
    expect(paginate(items, 0).lastPage).toBe(7);
    expect(paginate(items, 0).page(1)).toEqual([1]);
  });

  it('最后一页不满也照常返回', () => {
    expect(paginate(items, 3).page(3)).toEqual([7]);
  });

  it('越界返回空数组，不悄悄钳回最后一页', () => {
    expect(paginate(items, 3).page(4)).toEqual([]);
  });
});

describe('pageUrlOf', () => {
  it('第 1 页回到列表首页', () => {
    expect(pageUrlOf('/archives/', 1)).toBe('/archives/');
    expect(pageUrlOf('/tags/写作/', 0)).toBe('/tags/写作/');
  });

  it('其余页走 page/N/', () => {
    expect(pageUrlOf('/archives/', 2)).toBe('/archives/page/2/');
    /* base 末尾有没有斜杠都要得到同一个结果 */
    expect(pageUrlOf('/archives', 3)).toBe('/archives/page/3/');
  });
});

describe('termUrl', () => {
  it('中文直接进 URL 并转义', () => {
    expect(termUrl('tags', '前端')).toBe(`/tags/${encodeURIComponent('前端')}/`);
  });

  it('分类与标签走同一套规则，只换段名', () => {
    expect(termUrl('categories', '随笔')).toBe(`/categories/${encodeURIComponent('随笔')}/`);
  });
});

describe('postsWithTerm', () => {
  const posts = [
    makePost({ id: 'a', tags: ['Astro'], categories: ['指南'] }),
    makePost({ id: 'b', tags: ['Rust'], categories: ['指南'] }),
  ];

  it('按标签过滤', () => {
    expect(idsOf(postsWithTerm(posts, 'tags', 'Astro'))).toEqual(['a']);
  });

  it('按分类过滤', () => {
    expect(idsOf(postsWithTerm(posts, 'categories', '指南'))).toEqual(['a', 'b']);
  });
});

describe('countOf 及其包装', () => {
  it('按数量倒序，同数按名称排（保证每次构建顺序一致）', () => {
    expect(countOf(['b', 'a', 'b', 'c', 'c'])).toEqual([
      { name: 'b', count: 2 },
      { name: 'c', count: 2 },
      { name: 'a', count: 1 },
    ]);
  });

  it('tagCounts / categoryCounts 只是摊平后计数', () => {
    const posts = [makePost({ tags: ['x', 'y'] }), makePost({ tags: ['x'] })];
    expect(tagCounts(posts)).toEqual([
      { name: 'x', count: 2 },
      { name: 'y', count: 1 },
    ]);
    expect(categoryCounts([makePost({ categories: ['c'] })])).toEqual([{ name: 'c', count: 1 }]);
  });
});

describe('groupByYear', () => {
  it('按年份分组，年份倒序', () => {
    const posts = [
      makePost({ id: 'a', date: '2024-03-01' }),
      makePost({ id: 'b', date: '2026-01-01' }),
      makePost({ id: 'c', date: '2024-08-01' }),
    ];
    const years = groupByYear(posts);
    expect(years.map(([year]) => year)).toEqual([2026, 2024]);
    expect(idsOf(years[1][1])).toEqual(['a', 'c']);
  });
});

describe('neighbours', () => {
  const posts = [
    makePost({ id: 'new', date: '2026-03-01' }),
    makePost({ id: 'mid', date: '2026-02-01' }),
    makePost({ id: 'old', date: '2026-01-01' }),
  ];

  it('按时间正序取相邻，最新那篇没有下一篇', () => {
    const { prev, next } = neighbours(posts, posts[0]);
    expect(prev?.id).toBe('mid');
    expect(next).toBeUndefined();
  });

  it('最旧那篇没有上一篇', () => {
    const { prev, next } = neighbours(posts, posts[2]);
    expect(prev).toBeUndefined();
    expect(next?.id).toBe('mid');
  });
});

describe('relatedPosts', () => {
  it('标签比分类权重高：3 分 vs 2 分', () => {
    const current = makePost({ id: 'cur', tags: ['astro'], categories: ['指南'] });
    const byCategory = makePost({ id: 'cat', categories: ['指南'] });
    const byTag = makePost({ id: 'tag', tags: ['astro'] });
    expect(idsOf(relatedPosts([current, byCategory, byTag], current))).toEqual(['tag', 'cat']);
  });

  it('零分直接丢掉，不拿「都发在这个博客」当相关性', () => {
    const current = makePost({ id: 'cur', tags: ['astro'] });
    const stranger = makePost({ id: 'stranger', tags: ['rust'] });
    expect(relatedPosts([current, stranger], current)).toEqual([]);
  });

  it('同分按时间倒序，结果稳定', () => {
    const current = makePost({ id: 'cur', tags: ['astro'] });
    const older = makePost({ id: 'older', date: '2024-01-01', tags: ['astro'] });
    const newer = makePost({ id: 'newer', date: '2026-01-01', tags: ['astro'] });
    expect(idsOf(relatedPosts([current, older, newer], current))).toEqual(['newer', 'older']);
  });

  it('不超过 limit 条', () => {
    const current = makePost({ id: 'cur', tags: ['astro'] });
    const others = Array.from({ length: 5 }, (_, i) =>
      makePost({ id: `p${i}`, date: `2026-0${i + 1}-01`, tags: ['astro'] }),
    );
    expect(relatedPosts([current, ...others], current, 2)).toHaveLength(2);
  });
});

describe('seriesOf', () => {
  const posts = [
    makePost({ id: 's3', series: '搭建', seriesOrder: 3, date: '2026-01-01' }),
    makePost({ id: 's1', series: '搭建', seriesOrder: 1, date: '2026-03-01' }),
    makePost({ id: 'free', series: '搭建', date: '2026-02-01' }),
    makePost({ id: 'solo', series: '只有一篇', date: '2026-01-01' }),
    makePost({ id: 'none', date: '2026-01-01' }),
  ];

  it('按 seriesOrder 升序，没写序号的排在有号的后面', () => {
    const info = seriesOf(posts, posts[1]);
    expect(info?.items.map((p) => p.id)).toEqual(['s1', 's3', 'free']);
    expect(info?.index).toBe(0);
  });

  it('不属于任何系列时返回 null', () => {
    expect(seriesOf(posts, posts[4])).toBeNull();
  });

  it('同名只有一篇也算不上系列', () => {
    expect(seriesOf(posts, posts[3])).toBeNull();
  });
});
