import { describe, expect, it } from 'vitest';
import { inspect } from '../src/config/validate';
import DEFAULT_CONFIG from '../src/config/defaults';
import { deepMerge } from '../src/config/merge';
import type { SiteConfig, UserConfig } from '../src/config';

/**
 * 体检函数的测试重点不是「文案写得好不好」，而是**边界**：
 * 该报的报、不该报的别报。配错一个正则就会变成天天刷警告，
 * 而警告一旦变成噪音，人就再也不看了 —— 那还不如不做。
 *
 * 依赖全部注入：文件系统用 `fileExists` 假装，`site` 直接传，
 * 所以这个测试不读磁盘、不依赖示例站里到底有没有那张图。
 */
const config = (patch: UserConfig = {}): SiteConfig =>
  deepMerge(DEFAULT_CONFIG, patch) as SiteConfig;

/** 一切正常的样子：文件都在、域名是自己的、没开评论 */
const OK = { site: 'https://capzk.com', fileExists: () => true };

const joined = (issues: string[]) => issues.join('\n');

describe('inspect · 干净配置不该报错', () => {
  it('默认值 + 正常域名 + 文件都在 → 零条', () => {
    expect(inspect(config(), OK)).toEqual([]);
  });
});

describe('inspect · 图片路径', () => {
  it('public/ 里找不到文件时点名是哪一项', () => {
    const issues = inspect(config(), { ...OK, fileExists: () => false });
    expect(joined(issues)).toContain('banner.img');
    expect(joined(issues)).toContain('ogImage');
  });

  it('外链与 import 进来的资源不查文件系统', () => {
    const issues = inspect(config({ avatar: 'https://cdn.example.com/a.png' }), {
      ...OK,
      fileExists: () => false,
    });
    expect(joined(issues)).not.toContain('avatar 写的是');
  });
});

describe('inspect · 分享图与头像的格式', () => {
  it('ogImage 指向 SVG 要报 —— 社交平台不渲染', () => {
    const issues = inspect(config({ ogImage: '/img/og.svg' }), OK);
    expect(joined(issues)).toContain('ogImage 指向 SVG');
  });

  it('avatar 用 SVG 只是提示 logo 会缺，不是错误', () => {
    const issues = inspect(config({ avatar: '/img/avatar.svg' }), OK);
    expect(joined(issues)).toContain('Organization.logo');
  });
});

describe('inspect · 评论', () => {
  it('type 是 waline 但没填 serverURL', () => {
    const issues = inspect(config({ comment: { enable: true, type: 'waline' } }), OK);
    expect(joined(issues)).toContain('waline.serverURL 是空的');
  });

  it('serverURL 不像地址时要报', () => {
    const issues = inspect(
      config({ comment: { enable: true, type: 'waline', waline: { serverURL: 'comment' } } }),
      OK,
    );
    expect(joined(issues)).toContain('看起来不像地址');
  });

  it('Turnstile 与 reCAPTCHA 同时配 → 白配一个', () => {
    const issues = inspect(
      config({
        comment: {
          enable: true,
          type: 'waline',
          waline: {
            serverURL: 'https://comment.capzk.com',
            turnstileKey: 'a',
            recaptchaV3Key: 'b',
          },
        },
      }),
      OK,
    );
    expect(joined(issues)).toContain('同时配了');
  });

  it('requiredMeta 里的字段不在 meta 里 → 评论永远提交不了', () => {
    const issues = inspect(
      config({
        comment: {
          enable: true,
          type: 'waline',
          waline: {
            serverURL: 'https://comment.capzk.com',
            meta: ['nick'],
            requiredMeta: ['nick', 'mail'],
          },
        },
      }),
      OK,
    );
    expect(joined(issues)).toContain('mail');
    expect(joined(issues)).toContain('评论永远提交不了');
  });

  it('comment.enable 为 false 时一条都不报', () => {
    const issues = inspect(config({ comment: { enable: false, type: 'waline' } }), OK);
    expect(joined(issues)).not.toContain('waline');
  });
});

describe('inspect · Giscus', () => {
  it('只有 repo、没有 repoId → 评论区白屏', () => {
    const issues = inspect(
      config({ comment: { enable: true, type: 'giscus', giscus: { repo: 'capzk/capzk.com' } } }),
      OK,
    );
    expect(joined(issues)).toContain('giscus.repoId 是空的');
  });

  it('repo 本身就空时只报一条，不叠 repoId', () => {
    const issues = inspect(config({ comment: { enable: true, type: 'giscus' } }), OK);
    expect(joined(issues)).toContain('giscus.repo 是空的');
    expect(joined(issues)).not.toContain('giscus.repoId 是空的');
  });

  it('category 填了但 categoryId 空 → 分类设置会被静默忽略', () => {
    const issues = inspect(
      config({
        comment: {
          enable: true,
          type: 'giscus',
          giscus: { repo: 'capzk/capzk.com', repoId: 'R_kgDOx', category: 'Announcements' },
        },
      }),
      OK,
    );
    expect(joined(issues)).toContain('categoryId 是空的');
  });

  it('repo / repoId 齐全且不写 category → 一条都不报', () => {
    const issues = inspect(
      config({
        comment: {
          enable: true,
          type: 'giscus',
          giscus: { repo: 'capzk/capzk.com', repoId: 'R_kgDOx' },
        },
      }),
      OK,
    );
    expect(joined(issues)).not.toContain('giscus');
  });
});

describe('inspect · 数值区间', () => {
  it('pageSize 小于 1', () => {
    expect(joined(inspect(config({ pageSize: 0 }), OK))).toContain('pageSize');
  });

  it('nav 是空数组', () => {
    expect(joined(inspect(config({ nav: [] }), OK))).toContain('nav 是空数组');
  });

  it('门户的 cardsPerRow / latest.cols 为 0 会让网格失效', () => {
    const issues = inspect(config({ index: { portal: { cardsPerRow: 0, latest: { cols: 0 } } } }), OK);
    expect(joined(issues)).toContain('cardsPerRow');
    expect(joined(issues)).toContain('latest.cols');
  });
});

describe('inspect · 统计与验证', () => {
  it('GA 填了 UA- 前缀要明确说是停服的那套', () => {
    const issues = inspect(
      config({ analytics: { enable: true, google: { enable: true, measurementId: 'UA-1234' } } }),
      OK,
    );
    expect(joined(issues)).toContain('GA4');
  });

  it('Umami 缺 websiteId：脚本会加载但一条数据都不记', () => {
    const issues = inspect(
      config({
        analytics: { enable: true, umami: { enable: true, src: 'https://u.test/script.js' } },
      }),
      OK,
    );
    expect(joined(issues)).toContain('websiteId');
  });

  it('验证码里粘了整段 <meta> 要报', () => {
    const issues = inspect(
      config({ verification: { google: '<meta name="x" content="y">' } }),
      OK,
    );
    expect(joined(issues)).toContain('带着 HTML 标签');
  });
});

describe('inspect · 还是示例值', () => {
  it('site 还是 pages.dev / example.com 要报', () => {
    expect(joined(inspect(config(), { site: 'https://demo.pages.dev', fileExists: () => true })))
      .toContain('还是示例地址');
  });

  it('自建域名不报', () => {
    expect(joined(inspect(config(), OK))).not.toContain('还是示例地址');
  });

  it('不传 site 时跳过这项判断，不误报', () => {
    expect(joined(inspect(config(), { fileExists: () => true }))).not.toContain('还是示例地址');
  });
});
