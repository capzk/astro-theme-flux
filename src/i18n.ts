/**
 * 界面文案
 * ---------------------------------------------------------------------------
 * 原版 Fluid 有 9 套 i18n 语言包。这里先集中成一份中文字典 —— 好处是所有
 * 「看得见的字」都在同一个文件里，改文案不用翻组件；以后要加语言，把它改成
 * `Record<string, typeof zh>` 即可，结构已经就位。
 */
export const T = {
  skipToContent: '跳到主要内容',
  /* 导航文案：src/config 的 nav 用 labelKey 引用这几个键；
     想给某一项单独起名，在那个 nav 项上写 label 覆盖即可 */
  home: '首页',
  archive: '归档',
  categories: '分类',
  tags: '标签',
  friends: '友链',
  about: '关于',
  search: '搜索',
  searchPlaceholder: '搜索文章标题、分类或标签…',
  searchStart: '输入关键词开始搜索',
  searchEmpty: '没有找到相关文章',
  searchOpen: '打开搜索',
  toggleTheme: '切换深浅色',
  openMenu: '打开菜单',
  closeMenu: '关闭菜单',
  backTop: '回到顶部',
  toc: '目录',
  pin: '置顶',
  words: '字',
  minRead: '分钟阅读',
  updatedPrefix: '本文最后更新于',
  prevPost: '上一篇',
  nextPost: '下一篇',
  /* 系列：顶部那块清单与系列内的上下篇 */
  series: '系列',
  seriesPart: (i: number, n: number) => `第 ${i} / ${n} 篇`,
  seriesPrev: '系列上一篇',
  seriesNext: '系列下一篇',
  copyrightAuthor: '本文作者',
  copyrightDate: '发布于',
  copyrightLicense: '版权协议',
  copyrightLicenseValue: 'CC BY-NC-SA 4.0',
  prevPage: '上一页',
  nextPage: '下一页',
  pageN: (n: number) => `第 ${n} 页`,
  related: '相关文章',
  /* 评论区。计数单位跟在评论系统回填的数字后面，所以拆成两段 */
  comments: '评论',
  commentCountUnit: '条',
  commentLoadFailed: '评论没能加载出来，可能是网络或服务端的问题。',
  commentRetry: '重试',
  commentNoScript: '评论需要 JavaScript，开启后刷新页面即可。',
  /* 最新评论挂件。标题里不带站点名 —— 位置已经说明了它是全站的 */
  recentComments: '本站最新评论',
  recentCommentsNoScript: '最新评论需要 JavaScript。',
  notFound: '404',
  notFoundDesc: '你要找的页面不存在，或者已经搬走了。',
  backHome: '返回首页',
  totalPosts: (n: number) => `共 ${n} 篇文章`,
  totalTags: (n: number) => `共 ${n} 个标签`,
  totalCategories: (n: number) => `共 ${n} 个分类`,
  postsInCategory: (n: number) => `${n} 篇`,
  footerPowered: '由',
  footerTheme: '主题',
  /* 页脚站龄。`{n}` 是占位符 —— 模板与脚本各替换一次，所以文案只写在这一处 */
  runtimeDays: '已运行 {n} 天',
  /* 页脚那三个入口的无障碍标签（视觉上看不到） */
  footerLinks: '订阅与索引',
} as const;
