/**
 * 界面文案
 * ---------------------------------------------------------------------------
 * 原版 Fluid 有 9 套 i18n 语言包。这里先集中成一份中文字典 —— 好处是所有
 * 「看得见的字」都在同一个文件里，改文案不用翻组件；以后要加语言，把它改成
 * `Record<string, typeof zh>` 即可，结构已经就位。
 */
export const T = {
  skipToContent: '跳到主要内容',
  home: '首页',
  readMore: '阅读全文',
  archive: '归档',
  categories: '分类',
  tags: '标签',
  search: '搜索',
  searchPlaceholder: '搜索文章标题、分类或标签…',
  searchEmpty: '没有找到相关文章',
  searchHint: '试试更短的关键词，或按 Esc 关闭',
  searchOpen: '打开搜索',
  searchClose: '关闭搜索',
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
  copyrightHeading: '版权声明',
  copyrightAuthor: '本文作者',
  copyrightDate: '发布于',
  copyrightLink: '本文链接',
  copyrightLicense: '版权协议',
  copyrightLicenseValue: 'CC BY-NC-SA 4.0',
  prevPage: '上一页',
  nextPage: '下一页',
  notFound: '404',
  notFoundDesc: '你要找的页面掉进流体里了。',
  backHome: '返回首页',
  totalPosts: (n: number) => `共 ${n} 篇文章`,
  totalTags: (n: number) => `共 ${n} 个标签`,
  totalCategories: (n: number) => `共 ${n} 个分类`,
  postsInCategory: (n: number) => `${n} 篇`,
  footerPowered: '由',
  footerTheme: '主题',
} as const;
