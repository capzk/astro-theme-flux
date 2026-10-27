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

  /* 首页 / 分类 / 标签的每页文章数 */
  pageSize: 6,
  /* 归档是一行一篇的时间线，比卡片密，所以单独取值；填 0 表示不分页 */
  archive: { pageSize: 10 },

  /* 站内搜索（构建期生成索引，纯前端过滤） */
  search: true,
});
