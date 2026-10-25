# Changelog

本项目的所有重要改动都记录在这里。

格式参照 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

## [1.1.2] - 2026-10-25

### Changed

- 去掉中文名「流变」，全站统一用 **Flux**。README 标题、首段与关于页同步，
  连带删掉「名字取自拉丁语 fluxus」那句解释。
- 搜索框的两条提示文案（「输入关键词开始搜索」「没有找到相关文章」）原来写死在
  `scripts/search.js` 里，改为由 `SearchModal.astro` 通过 `data-*` 注入 `i18n.ts` 的文案，
  脚本里只保留兜底默认值。

### Fixed

- 顶栏的主题切换按钮里，太阳和月亮两个图标一直同时显示、并排挤在一起。
  补上显隐规则：亮色显示月亮（点了进暗色），暗色显示太阳（点了回亮色），
  靠根元素的 `data-user-color-scheme` 切换，无 JS 参与、无首帧闪烁。
- 关于页有两个 `<h1>`（banner 标题与作者名各一个），改为 banner 用 `div`，只留作者名；
  404 页则相反 —— 缺 `<h1>`，把「404」那行改成标题标签。
- 关于页的 `.about-avatar` / `.about-name` / `.about-bio` 只有 class 名、没有对应样式，
  头像不居中、署名用浏览器默认字号。补齐：头像圆形居中带投影、署名 1.5rem、
  简介灰字，正文恢复左对齐。

## [1.1.1] - 2026-10-25

### Fixed

- 目录里出现超长标题时，右侧栏会按内容的 min-content 顶宽栅格轨道，把中间的正文卡片挤窄；
  滚动高亮到该条目时，`.is-active` 加粗改变文字宽度，列宽跟着变，表现为左右抖动。
  三栏改为 `minmax(0, 2fr) minmax(0, 8fr) minmax(0, 2fr)`，并给 `#board` 与 `.sidebar`
  补上 `min-width: 0` —— 轨道宽度只由 fr 决定，长标题在栏内以省略号截断。

### Changed

- `astro.config.mjs` 的 `site` 指向示例站 `https://astro-theme-flux.pages.dev`（Cloudflare Pages）。
  RSS、sitemap、canonical、OG 从此输出正确的绝对地址。
- 新增 `/robots.txt`：由 `site` 现算，带 sitemap 地址，域名只维护一处。
- 新增 `public/_headers`：Cloudflare Pages 的缓存策略 —— `_astro/*` 带 hash 永久缓存，
  HTML 每次回源校验，图片 30 天，RSS 与搜索索引 1 小时。
- README 顶部加在线预览入口，并说明 fork 后要改 `site`。

## [1.1.0] - 2026-10-25

这一版的主题是「把文章页补齐到原版的水准」：右侧目录回来了，元信息搬到了 banner 上，
版心、字号、行高全部对齐 hexo-theme-fluid。运行时依赖数量仍然是 0。

### Added

- **文章页右侧目录**：构建期用 content collections 的 `headings` 生成，取 h2~h4，
  扁平列表 + `data-depth` 控制缩进；高亮用滚动监听 + `requestAnimationFrame` 节流，
  从最后一个标题往前扫，滚到页底时最后一个章节也能被选中。窄屏自动隐藏。
- **banner 承载全部元信息**：作者、日期一行，字数、阅读时长一行，与原版的排布一致。
- **图片灯箱**：替代 fancybox，零依赖。懒建遮罩、`aria-modal`、ESC / 点遮罩 / 点按钮三种关闭、
  关闭后焦点归还、`body` 锁滚动；只接管没有被 `<a>` 包着的图。
- **提示块** `.note`：`note-info` / `note-success` / `note-warning` / `note-danger` 四种配色。
- **文末版权卡片** `.license-box`：标题、链接、作者、日期、协议，右下角一个大号淡色 ©。
- **脚注**：GFM 原生语法，编号由 CSS 计数器生成，不用插件。
- **代码块行号**：同样用 CSS 计数器，`::before` 的内容不进 `innerText`，复制不会带上行号。
- **单篇 front matter 的 `toc` 字段**：可以单独关掉某篇文章的目录。
- 六篇「指南」示例文章，覆盖安装、配置、写作、定制、部署、扩展，同时充当排版样例。
- `CHANGELOG.md` 与本文件。

### Changed

- **版心与栅格对齐原版**：容器宽度按 Bootstrap 4 分档（1140 / 960 / 720 / 540），
  文章页改为 `2fr 8fr 2fr` 三栏（对应 `col-lg-2 / 8 / 2`），正文改用 10% 百分比内边距。
- **正文排版对齐 github-markdown-css**：字号 1rem、行高 1.6、段落 16px、
  标题用 em 梯度（2 / 1.5 / 1.25 / 1 / .875 / .85）、图片 90% 宽居中、表格去掉斑马纹。
- **banner 标题**从 3rem 调到 2rem（原版用的是 Bootstrap 的 `.h2`）。
- **回到顶部按钮**与**滚动提示箭头**按原版重写：4px 圆角、双层阴影、悬停时图标上下浮动。
- **`config.ts` 的 `color` 段真正生效**了。之前它只是声明、没人读；现在会注入内联样式，
  只覆盖亮色那组变量（暗色仍由 `main.css` 的 `[data-user-color-scheme="dark"]` 负责）。
- 文章页的「分类」「标签」标签改用 `i18n.ts` 的文案，不再写死中文。
- README 的 front matter 示例补全了 `updated` / `toc` / `draft` / `bannerImg` / `bannerMaskAlpha`。

### Fixed

- 回到顶部箭头指向左上（多余的 `rotate(-90deg)`）。
- 代码块的语言名与复制按钮重叠。
- `.markdown-body figure` 的特异性压过 `.highlight`，给每个代码块凭空加了 1.5rem 上边距。
- 卡片里标题出现两次：现在 banner 是唯一的视觉标题，`#seo-header` 只服务 SEO 与打印。
- 文档与实现脱节的若干处（目录深度、目录宽度、目录高亮方式、图片缩放是否保留）。
- 中文长文里 `li` 之间没有间距、`h5`/`h6` 字号缺失、标题内行内代码字号过大等排版细节。

### Removed

- `src/utils/toc.ts` —— 目录改由构建期 `headings` 直接产出，不再需要运行时解析 DOM。
- 旧的 `.post-header` / `.post-title` / `.post-meta-row` / `.copyright` 样式与对应结构。

## [1.0.0] - 2026-10-20

首个版本。从 hexo-theme-fluid 迁移到 Astro：卡片式首页、全屏 banner、深色模式、
站内搜索、归档 / 分类 / 标签 / 友链 / 关于 / 404、RSS 与 sitemap，运行时依赖为 0。

[Unreleased]: https://github.com/capzk/astro-theme-flux/compare/v1.1.2...HEAD
[1.1.2]: https://github.com/capzk/astro-theme-flux/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/capzk/astro-theme-flux/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/capzk/astro-theme-flux/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/capzk/astro-theme-flux/releases/tag/v1.0.0
