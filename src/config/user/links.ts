/**
 * 友链
 * ---------------------------------------------------------------------------
 * 原版在 `_data/links.yml` 里配；这里用带类型的 TS 数组，字段写错当场报错。
 *
 * `avatar` 留空时用名字首字母生成一个圆形色块，所以没头像也能看。
 */
export interface LinkItem {
  name: string;
  url: string;
  /** 一句话介绍 */
  desc?: string;
  /** 头像地址；留空则用名字首字母生成 */
  avatar?: string;
}

export const LINKS: LinkItem[] = [
  {
    name: 'Hexo',
    url: 'https://hexo.io/',
    desc: '快速、简洁且高效的博客框架',
    avatar: '/img/links/hexo.svg',
  },
  {
    name: 'Fluid 主题原版',
    url: 'https://github.com/fluid-dev/hexo-theme-fluid',
    desc: 'Material Design 风格的 Hexo 主题',
    avatar: '/img/links/fluid.svg',
  },
  {
    name: 'Astro',
    url: 'https://astro.build/',
    desc: '内容优先的静态站点框架',
    avatar: '/img/links/astro.svg',
  },
  {
    name: 'Material Design',
    url: 'https://m3.material.io/',
    desc: 'Google 的设计系统',
    avatar: '/img/links/material.svg',
  },
];
