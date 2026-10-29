/**
 * 外观：banner、配色、暗色模式
 * ---------------------------------------------------------------------------
 * 背景图有三种写法，换图只改 `img` 这一行：
 *
 *   img: '/img/banner.svg'                    ← public/ 里的文件，原样输出
 *   img: bannerAsset                          ← import 的本地图，走优化（多档 webp）
 *   img: 'https://example.com/a.jpg'          ← 外链
 *   不写 img / 写 ''                          ← 不要图，纯色底（标题照常显示）
 *
 * `enable: false` 则是连 banner 整块都不要，页面从卡片流开始。
 *
 * 主题自带的 `/img/banner.svg` 是一张纯色矢量图，故意做得没有内容倾向 ——
 * 示例站不该替使用者选一张「好看但别人的」照片。换图请把自己的图放进
 * `src/assets/` 再 import（写法见下面被注释掉的那行），这样才会走图片优化。
 */
import { defineConfig } from '../merge';
/* 想用自己的图（会被优化成多档 webp），把图放进 src/assets/ 后：
   import bannerAsset from '../../assets/你的图.webp';  →  img: bannerAsset */

export default defineConfig({
  banner: {
    /** 首页要不要 banner。想做成纯列表风格就设 false */
    enable: true,
    /** 首页大标题。**不写就用站名**（site.ts 的 title）；设成 `''` 则整块不渲染 */
    // title: 'Hi，我是 capz',
    /** 背景图。换成你自己的图就是改这一行 */
    img: '/img/banner.svg',
    height: '100vh',
    /* 黑色蒙版透明度 0~1：越大字越清楚，越小图越透。
       0 = 完全不加蒙版，图片保持原始亮度（想压暗一点就 0.2~0.4） */
    maskAlpha: 0,
    /** 副标题。给数组就是多句轮播（配合下面的打字机），只给一句就只显示一句 */
    slogan: ['丝滑的阅读体验', '零依赖 · 卡片式布局 · 暗色模式'],
    /**
     * 打字机效果。`true` 用默认参数（70ms/字、光标 `|`、不循环），
     * 给对象可细调：`{ typeSpeed, cursor, loop, startDelay }`。
     * 不写这一行就是静态文字。
     */
    typing: { typeSpeed: 90, cursor: '|' },
    /** 视差滚动：往下滚时背景图走得比文字慢。默认开 */
    parallax: true,
    /**
     * 最小宽高比，防手机上竖屏把图横着裁太狠：
     * 1 表示 banner 最高不超过「宽度」。设 0 关掉限制（手机上一屏铺满）。
     */
    minRatio: 1,
    scrollDown: true,
  },

  /* 文章页顶部的 banner（单篇可在 front matter 用 banner 覆盖） */
  postBanner: {
    img: '/img/banner.svg',
    height: '60vh',
    /* 同样不压暗。文章页比首页多两行小字（作者/日期、字数/时长），
       如果压在白字看不清，就单独把这里抬到 0.2 左右，首页不受影响 */
    maskAlpha: 0,
  },

  /**
   * 配色。不写就用默认那套（见 defaults.ts 的 color）。
   * 四项是颜色，分别对应顶栏 / 页面底色 / 卡片底色 / 强调色：
   *
   *   color: { navbar: '#2f4154', bodyBg: '#eee', board: '#ffffff', accent: '#30a9de' },
   *
   * 注意：颜色只覆盖**亮色**。暗色那套写在 `src/styles/main.css` 的
   * `[data-user-color-scheme="dark"]` 里，要改得连那边一起改。
   *
   * `navbarScrim` 不是颜色，是「顶栏透明时顶部那层渐变压暗有多深」（0~1）：
   * 首页刚打开、还没滚动时导航是压在 banner 图上的，这一步保证文字看得清。
   * 0 = 不压暗（图片原样），0.6+ = 图特别花时才需要。
   *
   * 想整套换色相（而不是逐个调颜色）就写 `hue`：顶栏与强调色由它现算，
   * 亮暗各有一套明度，永远不会出现「某个色相下字糊在背景上」。
   *   250 蓝（接近默认）· 165 青绿 · 35 橙 · 350 玫红 · 285 紫
   * 色相在构建期定死，不改读者侧的观感。
   */
  color: {
    navbarScrim: 0.32,
    // hue: 165,
  },

  /**
   * 暗色模式。`enable: false` 会把切换按钮也一起藏掉；
   * `default` 可选 `'auto'`（跟随系统）/ `'light'` / `'dark'`。
   */
  // darkMode: { enable: true, default: 'auto' },
});
