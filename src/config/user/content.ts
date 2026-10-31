/**
 * 内容呈现：首页卡片、文章页开关、分页、搜索
 * ---------------------------------------------------------------------------
 * 这里的开关决定「页面上出现什么」，不涉及颜色和图片位置。
 */
import { defineConfig } from '../merge';
import coverDefaultAsset from '../../assets/covers/cover-default.webp';

export default defineConfig({
  index: {
    /* 卡片没有封面时用的兜底图；留空则卡片不显示图片区 */
    defaultImg: coverDefaultAsset,
    /* 摘要截断字数 */
    excerptLength: 200,
    /* 卡片底部显示哪些元信息 */
    showDate: true,
    showCategory: true,
    showTags: true,

    /* 门户首页的显示数量与版式 —— 只作用于 src/pages/index.astro 的门户首页。
       首页分三大块：①顶部置顶（左图轮播 + 右置顶列表）②中间分类列表
       ③底部最新。想调首页长什么样，主要改这里的 portal。

         featured      置顶区块取前几篇（同时驱动左图轮播 + 右置顶列表）
         heroAutoplay  置顶图片轮播自动切换间隔(ms)，0 关闭
         cardsPerRow   卡片式每行固定几个（全局统一，默认 4；列表式不读这个）
         categories    中间分类列表（显式、有序；每个分类可独立配卡片/列表、
                       几行/几列）。分类名要与文章 front matter 的 categories 一致；
                       数组为空则退回「按文章数前 8 个、卡片一行」
         latest        底部「最新」：count 总篇数、cols 几列（不分类别） */
    portal: {
      featured: 5,
      heroAutoplay: 5000,
      cardsPerRow: 4,
      categories: [
        { name: '指南', layout: 'card', rows: 2 },
        { name: '实现', layout: 'card', rows: 1 },
        { name: '随笔', layout: 'list', cols: 2 },
        { name: '使用', layout: 'list', cols: 1 },
        { name: '公告', layout: 'list', cols: 1 },
      ],
      latest: { count: 10, cols: 2 },
    },
  },

  post: {
    /* 顶部 banner 上的元信息。四项全关也不影响正文 */
    meta: { author: true, date: true, wordcount: true, min2read: true },
    /* 右侧目录（取正文 h2~h4，宽屏才显示；单篇可用 front matter 的 toc 覆盖） */
    toc: true,
    /* 文末版权声明 */
    copyright: true,
    /* 上一篇 / 下一篇 */
    prevNext: true,
    /* 文末相关文章：按标签/分类重合度取前 3 篇，一篇都不相关就整块不显示 */
    related: true,
    /* 阅读时长的换算速度（字/分钟） */
    wpm: 300,
  },

  /* 分类 / 标签的每页文章数（首页是门户版式，不分页） */
  pageSize: 6,
  /* 归档是一行一篇的时间线，比卡片密，所以单独取值；填 0 表示不分页 */
  archive: { pageSize: 10 },

  /* 站内搜索（构建期生成索引，纯前端过滤） */
  search: true,
});
