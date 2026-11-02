import { describe, expect, it } from 'vitest';
import { isListPage } from '../src/utils/list-pages';

describe('isListPage（根部署）', () => {
  it('分页第 2 页起算列表页', () => {
    expect(isListPage('/archives/page/2/')).toBe(true);
    expect(isListPage('/tags/前端/page/3/')).toBe(true);
    expect(isListPage('/categories/随笔/page/10/')).toBe(true);
  });

  it('第 1 页也按分页处理（路由确实存在这一档），列表首页 /archives/ 不是', () => {
    expect(isListPage('/archives/')).toBe(false);
    expect(isListPage('/archives/page/1/')).toBe(true);
  });

  it('单个标签页 / 分类页是，总览页不是', () => {
    expect(isListPage('/tags/前端/')).toBe(true);
    expect(isListPage('/categories/随笔/')).toBe(true);
    expect(isListPage('/tags/')).toBe(false);
    expect(isListPage('/categories/')).toBe(false);
  });

  it('文章页、首页、关于页都不是', () => {
    expect(isListPage('/')).toBe(false);
    expect(isListPage('/posts/build-pipeline/')).toBe(false);
    expect(isListPage('/about/')).toBe(false);
  });

  it('缺尾斜杠、带查询串也认', () => {
    expect(isListPage('/tags/前端')).toBe(true);
    expect(isListPage('/archives/page/2/?a=1')).toBe(true);
  });
});

describe('isListPage（子路径部署）', () => {
  it('sitemap 给的是含前缀的 pathname，要先剥前缀', () => {
    expect(isListPage('/blog/tags/前端/', '/blog')).toBe(true);
    expect(isListPage('/blog/archives/page/2/', '/blog')).toBe(true);
    expect(isListPage('/blog/about/', '/blog')).toBe(false);
  });

  it('前缀边界要对齐：/blogger 不会被当成 /blog 下的页面剥掉前 5 个字符', () => {
    /* 不剥前缀 → 原样匹配，/blogger 那段既不是 page 也不是 tags/categories */
    expect(isListPage('/blogger/tags/前端/', '/blog')).toBe(false);
    expect(isListPage('/blogger/about/', '/blog')).toBe(false);
  });

  it('前缀本身就是首页', () => {
    expect(isListPage('/blog/', '/blog')).toBe(false);
    expect(isListPage('/blog', '/blog')).toBe(false);
  });
});
