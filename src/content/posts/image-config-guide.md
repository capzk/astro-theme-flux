---
title: 全站图片配置总纲：目录、格式、尺寸与位置
date: 2026-11-01 23:10:00
description: 一张图该放 public 还是 src/assets、要多大、什么格式、在哪一行改 —— favicon、头像、分享图、banner、封面、正文图，一次讲清楚。
tags:
  - 图片
  - 配置
  - 使用
categories:
  - 使用
cover: ../../assets/covers/cover-2.webp
---

站点里几乎每个位置都能放图，但它们的配置位置、存放目录、格式要求各不相同。这篇把**全站所有图片位**一次性列清楚：放哪、多大、什么格式、改哪一行。

先记住一个总原则：

> **能不优化就别放大图，能优化就别用字符串。** 下面每一节都会说明它属于哪一种。

## 一、两个目录，先分清

主题里图片只有两个去处，选错目录是绝大多数「图不显示」的根源。

| 目录 | 怎么引用 | 会被优化吗 | 适合放什么 |
| --- | --- | --- | --- |
| `public/` | 以 `/` 开头的根路径，如 `/img/a.webp` | **不会**，原样复制、原图多大发多大 | favicon、分享图、友链头像、正文图、SVG、临时图 |
| `src/assets/` | `import` 或 front matter 的 `image()` | **会**：多档宽度 + webp + `srcset` + 宽高 | 封面、banner 照片、想省流量的图 |

一句话：**要优化 → `src/assets/` 并 `import`；要稳定直出的固定文件（图标类）→ `public/`。**

<div class="note note-info">`public/` 里的文件会原封不动拷进构建产物，所以路径永远以 `/` 开头；`src/assets/` 里的文件必须经过 `import` / `image()` 才会进产物，直接写 `src/assets/x.webp` 当路径是无效的。</div>

## 二、全站图片位总览

| 图片位 | 配置位置 | 字段 | 目录 | 格式 | 建议尺寸 |
| --- | --- | --- | --- | --- | --- |
| 网站图标 | `src/config/user/site.ts` | `favicon` | `public/` | SVG（或 ICO / PNG） | 32×32 的 `viewBox`，矢量任意缩放 |
| iOS 主屏图标 | `src/config/user/site.ts` | `appleTouchIcon` | `public/` | PNG | 180×180 |
| 头像 | `src/config/user/site.ts` | `avatar` | `public/img/` 或 URL | **PNG / JPG** | ≥ 256×256（关于页显示 112） |
| 分享封面 | `src/config/user/site.ts` | `ogImage` + `ogImageSize` | `public/img/` | **PNG / JPG** | 1200×630 |
| 首页 banner | `src/config/user/appearance.ts` | `banner.img` | `public/` 或 `src/assets/` | webp / jpg（照片） | 宽 ≥ 1920，高度由 `height` 决定 |
| 文章页 banner | `src/config/user/appearance.ts` | `postBanner.img` | 同上 | 同上 | 宽 ≥ 1920，默认 60vh |
| 卡片封面 | 文章 front matter | `cover` / `indexImg` | `src/assets/`（推荐）/ `public/` | webp / jpg | 3:2 或 16:10，宽 ≥ 800 |
| 单篇 banner 覆盖 | 文章 front matter | `banner` / `bannerImg` | 同上 | 同上 | 宽 ≥ 1920 |
| 默认封面 | `src/config/user/content.ts` | `index.defaultImg` | `src/assets/` / `public/` | webp / svg | 与卡片同比例 |
| 友链头像 | `src/config/user/links.ts` | `links[].avatar` | `public/` 或 URL | svg / png | 方形 ≥ 88 |
| 正文插图 | 文章 Markdown 或 `.mdx` | `![alt](...)` | `public/` 或外链 | webp / png / jpg | 宽不超过版心，按显示 2 倍备 |

## 三、站点级图片（改一次全站生效）

这几个都在 `src/config/user/site.ts` 里，改完重新构建即可。

### 1. 网站图标 favicon

```ts
// src/config/user/site.ts
favicon: '/favicon.svg',
```

- 文件放 `public/favicon.svg`；想换 `.ico` / `.png`，直接把文件放进去、把这一行改成对应路径即可，**不用改代码** —— `type` 会按扩展名自动推断。
- 推荐 SVG：一个文件适配所有尺寸，不会糊。
- 主题**没有**自带 `apple-touch-icon`，需要 iOS「添加到主屏幕」图标时，放一张 `public/img/apple-touch-icon.png`（180×180）并配置：

```ts
appleTouchIcon: '/img/apple-touch-icon.png', // 留空则不输出这一行
```

### 2. 头像 avatar

```ts
// src/config/user/site.ts
avatar: '/img/avatar.png',
```

- 放 `public/img/`，也可以写完整外链 URL。
- **想要 Google 富媒体结果里的品牌 logo，就用 PNG / JPG。** 结构化数据（JSON-LD）的 `Organization.logo` 只认位图，SVG 会被跳过，构建期也会提醒你。
- 只在意页面展示、不在意 logo，用 SVG 也行（关于页按 112×112 渲染）。
- 全局只影响「关于页头像 + 结构化数据 logo」，不涉及页脚。

### 3. 分享封面 ogImage

```ts
// src/config/user/site.ts
ogImage: '/img/og.png',
ogImageSize: { width: 1200, height: 630 },
```

- 放 `public/img/og.png`，**必须是 PNG 或 JPG，不能是 SVG** —— 微博 / 微信 / Twitter 不渲染 SVG，分享出去就是一张空白卡片。构建期会为此报警告。
- **建议 1200×630**（1.91:1，`og:image` 的标准比例）。
- `ogImageSize` 要和实际图片尺寸一致：它让首页 / 列表页输出 `og:image:width/height`，部分平台拿到尺寸就不用再探测。换了一张不同尺寸的图，记得同步改，或者删掉这一项（不输出宽高）。
- 文章页更聪明：只要你的封面是可优化的位图，构建期会自动另裁一张 1200×630 的 JPEG 用于分享，**你不用手工裁**。

## 四、banner（首页 / 文章页大图）

`src/config/user/appearance.ts`：

```ts
// src/config/user/appearance.ts
banner: {
  enable: true,
  img: '/img/banner.svg',   // 字符串 = public 文件，原样输出，不优化
  height: '100vh',
  maskAlpha: 0,             // 0~1，越大字越清楚，越小图越透
  // ...
},
postBanner: {
  img: '/img/banner.svg',   // 文章页顶部
  height: '60vh',
  maskAlpha: 0,
},
```

`img` 支持三种写法：

```ts
// ① public 里的文件（不优化，路径以 / 开头）
img: '/img/banner.webp',

// ② 本地图 import（走 Astro 优化：多档 webp + srcset）
import bannerAsset from '../../assets/banner.webp';
// ... 然后 img: bannerAsset

// ③ 外链
img: 'https://example.com/banner.jpg',
```

- 照片类大图**推荐用 ②**，手机只下小图。
- `height` 控制高度（首页默认 `100vh`、文章页 `60vh`）。
- `maskAlpha` 是黑色蒙版透明度：首页和文章页可以分开调。
- 还有 `minRatio`（首页 banner 的最小宽高比，防止手机竖屏把图横着裁太狠）和 `parallax`（视差开关），都在同一个 `banner` 块里。

## 五、文章封面（列表卡片上的那张）

在文章 front matter 里，有两种写法：

```yaml
# 推荐：交给 Astro 优化（相对本文档的路径）
cover: ../../assets/covers/cover-1.webp

# 备选：字符串路径，不优化（public 或完整 URL）
indexImg: /img/cover-1.webp
```

| | `cover` | `indexImg` |
| --- | --- | --- |
| 是否优化 | 是，多档宽度 + webp + `srcset` | 否，原图多大发多大 |
| 宽高比 | 自动，加载不跳动 | 需自己保证 |
| 适合 | 自己的照片、截图 | 外链、SVG、临时图 |

- **两行都写时，`cover` 优先**，`indexImg` 被忽略。
- 没有封面的文章，卡片用 `index.defaultImg` 兜底，不会破图。
- 路径是**相对当前 Markdown 文件**的：文章在 `src/content/posts/` 根目录时，`../../assets/...` 正好指到 `src/assets/`；文章在二级目录里就要多退一层。

<div class="note note-warning">卡片封面**能用位图就别用 SVG** —— SVG 没有 `srcset` 可言，优化对它无效。而且分享卡片会自动选用可优化的位图封面，SVG 封面在这条链路上帮不上忙。</div>

## 六、单篇 banner 覆盖

文章顶部默认用 `postBanner.img`；某篇想换自己的头图，在 front matter 里写：

```yaml
# 推荐：可优化的本地图（相对本文档）
banner: ../../assets/covers/hero.webp

# 备选：字符串，不优化
bannerImg: /img/hero.webp

# 单篇调整蒙版透明度
bannerMaskAlpha: 0.35
```

优先级：`banner`（可优化）> `bannerImg`（字符串）> `postBanner.img`（站点默认）。

## 七、默认封面

```ts
// src/config/user/content.ts
import coverDefaultAsset from '../../assets/covers/cover-default.webp';

index: {
  defaultImg: coverDefaultAsset, // 没有封面的文章用它兜底
}
```

写 `import` 的本地图会走优化；写 `'/img/xxx.webp'` 这样的字符串则不优化。

## 八、友链头像

`src/config/user/links.ts`：

```ts
export const LINKS: LinkItem[] = [
  {
    name: 'Astro',
    url: 'https://astro.build/',
    desc: '内容优先的静态站点框架',
    avatar: '/img/links/astro.svg', // 留空则用名字首字母生成圆形色块
  },
];
```

放 `public/img/links/`，或直接写外链。方形、至少 88×88 就够。

## 九、正文里的插图

正文用标准 Markdown 即可，图片放 `public/`、用根路径引用：

```markdown
![图注：一张示意图](/img/diagram.webp)
```

主题在构建期会给正文图自动补上 `loading="lazy"` 与 `decoding="async"`（滚到附近才加载），并对知乎 / 微博 / B 站 / 豆瓣等防盗链图床自动加 `referrerpolicy="no-referrer"`，所以直接贴外链也能正常显示。

<div class="note note-warning">Markdown 的 `![]()` 不会走 Astro 的图片优化（没有 `srcset` 和多档宽度）。想要正文图也优化，可以用 `.mdx` 里的 Astro `<Image>` 组件 —— 但那需要自己安装并注册 <code>@astrojs/mdx</code>（主题默认不带，保持零额外集成）。</div>

## 十、格式与尺寸速查

| 场景 | 推荐格式 | 推荐尺寸 | 备注 |
| --- | --- | --- | --- |
| favicon | SVG | `viewBox="0 0 32 32"` | 矢量，任意缩放不糊 |
| apple-touch-icon | PNG | 180×180 | iOS 不认 SVG |
| 头像 | PNG / JPG | ≥ 256×256 | logo 必须是位图 |
| 分享封面 ogImage | PNG / JPG | 1200×630 | 绝不能 SVG |
| banner 照片 | webp / jpg | 宽 ≥ 1920 | 走 `import` 优化 |
| 卡片封面 | webp / jpg | 3:2 或 16:10，宽 ≥ 800 | 走 `cover` 优化 |
| 正文图 | webp / png / jpg | 宽 ≤ 版心（约 1140） | 按显示 2 倍备图更清晰 |

体积上，照片转 webp 通常能省一半以上；封面的原图建议控制在几百 KB 以内，反正构建期会按需出小图。

## 十一、常见坑

1. **`ogImage` 写成 SVG** → 分享卡片空白。构建期会警告，换成 PNG / JPG。
2. **头像用 SVG** → 页面正常，但 `Organization.logo` 缺失（Google 只认位图）。构建期会提示。
3. **`indexImg` 放了几 MB 的原图** → 手机端全量下载。改用 `cover` 走优化。
4. **`public/` 里的文件名大小写不对** → 本地 Windows 能看，部署到 Cloudflare / Linux 就 404。`Cover.PNG` ≠ `cover.png`。
5. **部署在子路径**（如 `/<仓库名>/`）→ 所有 `/img/...` 绝对路径都会 404。用根域名或 `<用户名>.github.io` 仓库名。
6. **新增 `public/` 文件后立刻访问发现 404** → Cloudflare 会把 404 缓存 7 天；等部署完成再看，或给文件名带哈希。
7. **相对路径层级写错** → 二级目录里的文章要多个 `../`。

## 十二、配置完怎么验证

```bash
npm run check   # 类型与配置检查（多余/拼错的字段会报错）
npm run build   # 真正构建一遍，图片优化在这一步发生
```

构建期还会体检：图片路径在 `public/` 下找不到、`ogImage` 是 SVG、头像用 SVG 等情况，都会在终端里给出提示。

<div class="note note-info">封面和 banner 下面垫着一层「主色调渐变」：图还没下载完时显示的是它大致的颜色，而不是一块白。颜色由构建期自动从图片里算（LQIP），换完图直接构建即可，没有需要手动跑的步骤。</div>

## 小结

- **固定图标类**（favicon、apple-touch-icon、ogImage、友链头像）→ `public/` + `site.ts` 配置。
- **照片类**（banner、封面）→ `src/assets/` + `import` / `cover:`，吃优化。
- **正文图** → `public/` + Markdown，主题自动懒加载。
- **分享封面**交给构建期裁，别用 SVG。
- 改完 `npm run check && npm run build`，看终端有没有体检提示。
