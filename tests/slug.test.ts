import { describe, expect, it } from 'vitest';
import { postSlug, slugify } from '../src/utils/slug';

describe('slugify', () => {
  it('中文转拼音，逐字用连字符连接', () => {
    expect(slugify('中文')).toBe('zhong-wen');
  });

  it('英文与数字保持原样，连续的一段不会被拆碎', () => {
    expect(slugify('Rust 2026')).toBe('rust-2026');
  });

  it('重音字母降级成基本字母，而不是整段丢掉', () => {
    expect(slugify('café')).toBe('cafe');
    expect(slugify('über')).toBe('uber');
  });

  it('标点、空格、表情一律变成连字符或被丢弃', () => {
    expect(slugify('Hello, World!')).toBe('hello-world');
    expect(slugify('a///b')).toBe('a-b');
    expect(slugify('🚀')).toBe('');
  });

  it('多音字按词组取音', () => {
    expect(slugify('重庆')).toBe('chong-qing');
  });
});

describe('postSlug', () => {
  it('不给 slug 时沿用文件路径，逐段转写', () => {
    expect(postSlug('2026/年度总结')).toBe('2026/nian-du-zong-jie');
  });

  it('slug 不含斜杠时只替换文件名那一段', () => {
    expect(postSlug('2026/original', 'custom-name')).toBe('2026/custom-name');
  });

  it('slug 含斜杠时整条路径由它决定，目录不再拼进来', () => {
    expect(postSlug('2026/original', 'a/b')).toBe('a/b');
  });

  it('空段被丢掉，跑不出 /posts/', () => {
    expect(postSlug('/../../etc/passwd')).toBe('etc/passwd');
  });

  it('slug 前后空白不算内容', () => {
    expect(postSlug('x', '  named  ')).toBe('named');
  });
});
