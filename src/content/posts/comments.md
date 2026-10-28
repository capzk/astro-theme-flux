---
title: 评论系统：三选一，从服务端到配置
date: 2026-10-25 10:00:00
description: Waline、Giscus、Artalk 各自怎么搭起来、配置里填哪几行、浏览量怎么单独开，以及那几种「看着配好了但发不出去」的情况。
tags:
  - 评论
  - Waline
  - Giscus
  - Artalk
categories:
  - 指南
series: 从零建站
seriesOrder: 4
cover: ../../assets/covers/cover-4.webp
---

评论是最容易装成摆设的一块。配错了页面照样生成，只是评论区空着，或者框能打字、点提交没反应 —— 从外面看和「还没人评论」长得一模一样。

这一篇把三套走一遍：先选一个，再搭起来，再填进配置，最后怎么验证它真的通了。

## 先选一个

三套的差别不在界面，在**评论存在哪、读者要不要登录**。

| | Waline | Giscus | Artalk |
| --- | --- | --- | --- |
| 要不要服务端 | 要 | **不要** | 要 |
| 评论存在哪 | 你自己的数据库 | GitHub Discussions | 你自己的数据库 |
| 读者要登录吗 | 不要，可匿名 | **要 GitHub 账号** | 不要 |
| 浏览量统计 | 有 | 没有 | 没有 |
| 「本站最新评论」挂件 | 有 | 没有 | 没有 |
| 传图 | 要另配存储 | 没有 | 要另配存储 |
| 后端形态 | Node，跑在 Serverless 上也行 | —— | 单个 Go 二进制 |

一句话选：

- 读者主要是中文圈、大多是普通用户 → **Waline**。它是三套里唯一允许匿名的，而「要先注册一个 GitHub 账号」这一条，足以让很大一部分读者直接关掉页面。
- 博客给技术圈看，或者你不想碰任何服务端 → **Giscus**。代价是把评论托管给了 GitHub，读者必须有账号。
- 想要一个进程就能跑完的后端、不想为几百条评论养一个 Node 运行时 → **Artalk**。

后两家没有浏览量也没有最新评论挂件，这不是没做完：Giscus 的数据在别人的数据库里，Artalk 没提供公开的读取接口。主题检测不到就直接不渲染那块，不会留一个转圈的空壳。

## 三套共用的三行

```ts
comment: {
  enable: true,
  type: 'waline',   // 'waline' | 'giscus' | 'artalk'
  lazy: 600,
},
```

`enable` 是总开关。关着的时候文章页连评论区的骨架都不输出，也不请求任何脚本 —— 不是「藏起来」，是压根没有。

`lazy` 是**像素**，不是布尔值：浏览器滚到「距评论区还有 600px」时才开始拉脚本。写 `0` 就是进页面就拉。调大能让读者刚开始往下读就预取好，代价是这一页一定会拉，哪怕他根本不看评论。

`type` 一行切换，用不到的段落在配置里留着不影响构建 —— 所以「两套都填好、随时切」是正常的用法。

## Waline

### 先把服务端跑起来

Waline 是「客户端 + 服务端」两件东西：客户端脚本主题会自己加载，**服务端得你自己部署**。这一步没做，后面怎么填配置都是空的。

三条路，按省事程度排：

1. **Vercel 一键部署**。官方仓库的 README 里有一个 Deploy 按钮，点进去连你的仓库，选一个数据库就完了。数据库它支持 LeanCloud、MySQL、SQLite，选哪个都行 —— LeanCloud 免费额度对个人博客绰绰有余。
2. **Docker**。一条 `docker run` 起一个容器，注意把数据目录挂出来（不挂等于每次重启都清空评论）。
3. **自己的服务器**。把上面那个容器反代出来最省事；完全不想用 Docker 就照官方文档用 Node 起一个。

部署完你会拿到一个地址，形如 `https://comment.example.com`。第一次访问它会引导你注册管理员账号，那个账号是进后台删评论、看留言用的，记好。

<div class="note note-warning">给评论服务一个独立域名（`comment.example.com`），别塞在博客的子路径下（`/comment`）。子路径要自己写反代规则，静态资源、API、上传全挤在同一个前缀里，规则写歪一半就是一堆 404 —— 独立域名把这类问题一次性消掉，配置里也好填。</div>

### 填进配置

```ts
waline: {
  serverURL: 'https://comment.example.com',
  pageview: true,
  requiredMeta: ['nick'],
  locale: { placeholder: '说点什么吧，支持 Markdown…' },
  pageSize: 10,
},
```

`serverURL` 只写协议 + 域名，**结尾不要带斜杠**。带斜杠会拼出一个 `//comment?...` 的地址，大部分服务器能容忍，少数会 404。

`pageview: true` 是浏览量，见下面单独一节。

`requiredMeta` 和 `meta` 是一对，坑就在这一对里：

```ts
meta: ['nick', 'mail', 'link'],   // 表单上显示哪几栏
requiredMeta: ['nick'],           // 哪几栏必须填，可以是 []（全匿名）
```

**必填项必须在显示项里。** 写 `requiredMeta: ['mail']` 却把 `meta` 里的 `mail` 删了，结果是：那一栏不显示，但提交时要求必填 —— 谁都提交不了，而且页面上没有任何提示。构建期会拦这一条。

### 换 CDN

Waline 客户端默认从 jsDelivr 拉。国内 jsDelivr 时好时坏，换镜像只改一行：

```ts
waline: {
  cdn: 'npmmirror',   // 或 'unpkg'
  version: '3.16.1',  // npmmirror 不支持 '3' 这种范围写法，必须写全版本号
},
```

自己托管也支持，给一个带占位符的模板就行 —— 占位符是 `{name}`、`{version}`、`{file}`、`{basename}`、`{ext}`：

```ts
cdn: '/waline/{basename}-{version}.{ext}',
version: '3.16.1',
// → /waline/waline-3.16.1.js、/waline/waline-3.16.1.css、/waline/pageview-3.16.1.js
```

换镜像不用改组件、不用改浏览量的地址，两处是同一个模板算出来的。

### 人机验证

不想被垃圾评论淹，加 Turnstile（Cloudflare 的，国内能直接打开，比 reCAPTCHA 省事）。

**三处必须同时配，少一处就是「看得见验证框、提交一定失败」：**

| 在哪 | 填什么 |
| --- | --- |
| `user/comment.ts` | `turnstileKey`（Site Key，公开，会下发到浏览器） |
| Waline 服务端环境变量 | `TURNSTILE_KEY`（同一个 Site Key） |
| Waline 服务端环境变量 | `TURNSTILE_SECRET`（Secret，保密） |

只配第一处：验证框能点，点完提交 403。只配服务端：页面上根本不出现验证框，提交直接被拒。

reCAPTCHA v3 是同样三个位置（`recaptchaV3Key` + `RECAPTCHA_V3_KEY` + `RECAPTCHA_V3_SECRET`），**和 Turnstile 只能留一个**，两个都配服务端只会按自己的顺序验一个，另一个白配。构建期会给警告。

### 浏览量

```ts
waline: { pageview: true },
```

只有一个布尔值，但它和评论区是**解耦**的：统计走 Waline 的独立小插件（gzip 后不到 1KB），只按文章路径上报一个数字，不加载评论区那几百 KB。

所以「评论关掉、只留阅读量」是成立的：`enable: false` + `pageview: true`，数字照样涨。

### 本站最新评论

```ts
recent: { enable: true, count: 5, length: 60 },
```

文章页底部、评论区之前会多一块「本站最新评论」。它调的是 `GET /comment?type=recent`，公开接口不需要鉴权，所以只有 Waline 有。

`length` 是每条最多显示多少字，超了截断。渲染只用 `textContent` —— 别人写的评论里塞了 `<script>` 也不会被执行。

默认关着。它要在读者滚到底时多发一个请求，值不值得由你自己判断。

## Giscus

这套不需要服务端，但需要把一个 GitHub 仓库变成评论区。

1. 建一个**公开**仓库（专门放评论也行，省得和代码混在一起）。
2. 仓库设置里往下找 Features，勾上 **Discussions**。这一步最容易漏 —— 没开的话 giscus.app 会一直提示找不到分类。
3. 打开 [giscus.app](https://giscus.app)，填 `owner/repo`，选 Discussion 分类（比如 Announcements），它会实时生成一段配置。
4. 把里面的 `data-repo`、`data-repo-id`、`data-category`、`data-category-id` 抄进配置：

```ts
giscus: {
  repo: 'yourname/blog-comments',
  repoId: 'R_kgDOxxxxxx',
  category: 'Announcements',
  categoryId: 'DIC_kwDOxxxxxx',
  mapping: 'pathname',
},
```

`mapping` 决定「哪篇文章对应哪个 Discussion」。用 `pathname`（默认），和 Waline 的路径口径一致；用 `title` 或 `url` 的话，改一次标题或者换一次域名，老评论就全对不上了。

配色（亮 / 暗两套）用 `theme: { light: 'light', dark: 'dark' }`，值取 giscus.app 上那一栏列出的名字，切换深浅色时它会自己跟着换。

## Artalk

后端是 Go 写的单个可执行文件，比 Waline 轻，一台最小配置的机器就能带起来。

1. 照官方文档用 Docker 起一个容器，或者直接下二进制。数据库它支持 SQLite / MySQL / PostgreSQL，小站用 SQLite 就行。
2. 进后台**建一个站点**，名字随便起，比如 `我的博客`。
3. 把地址和这个名字填进配置：

```ts
artalk: {
  server: 'https://comment.example.com',
  site: '我的博客',
},
```

`site` 要和后台建站时填的**一模一样**。不一致的后果很隐蔽：评论能提交成功、返回 200、刷新之后也能看见，但它们落在后端的「默认站点」里 —— 你在后台的站点列表里点进去，一条都没有。构建期的体检只能看出「地址还是占位值」这类问题，站点名对不上它查不出来，只能自己去后台点一遍。

Artalk 没有浏览量和最新评论接口，所以文章页不会出现那两块。不是缺配置项 —— 后端就没有这个东西，主题检测到不支持就整块不渲染。

表情包默认从 jsDelivr 拉一份官方配置。国内加载不出来就换成自托管地址，或者 `emoticons: false` 关掉。客户端脚本的地址同理，`js` / `css` 两项都能指到你自己的镜像。

## 配好之后怎么验证

别只看「页面能打开」。按这个顺序走一遍：

1. `npm run dev`，打开任意一篇文章，滚到评论区。**在 Network 里确认脚本真的请求了** —— 如果 `lazy` 是 600，得滚到附近才会拉。
2. 发一条测试评论。提交成功不等于存下来了，刷新一次再看。
3. 进后台看这条评论在不在。Waline 是 `/ui`，Artalk 是自己那套后台。**不在后台，说明数据写到了别处**（多半是 Artalk 的 `site` 名不对）。
4. 拿手机浏览器再开一次。窄屏的评论表单布局和桌面不同，问题只在这里露出来。
5. `npm run build`，看有没有配置体检的警告 —— `enable` 开着但服务端地址是空的、地址里还带着 `example.com`、两个验证码同时配，这些都会在构建输出里点名。

## 几种「看着配好了但发不出去」

排在前面的更常见：

**提交 403，验证框能点。** Turnstile 的三处没配齐，或者 Secret 贴错了。先去看服务端日志，它是唯一知道原因的地方。

**框都正常，点了没反应，Network 里也没有请求。** 脚本没加载。看 `cdn` 那一行是不是写了个不存在的镜像，或者自托管的路径和文件名对不上（`{basename}-{version}.{ext}` 里的版本号写错一位就 404）。

**评论区整个不出现。** `enable` 是不是 `false`；`type` 写的是不是三套之一；Waline 的 `serverURL` 是不是空的。这三件构建期都会提示。

**能提交，但后台看不见（Artalk）。** `site` 名和后端不一致，评论进了默认站点。

**改完 slug 之后老评论全没了。** 评论是按页面路径索引的，改了地址等于换了 key。要保评论，先在旧路径下把评论导出来重挂，或者干脆别改。Waline、Artalk 都是这个行为，Giscus 的 `pathname` 映射同理。

**换了一套评论系统，旧评论不跟着走。** 三套的数据互不兼容，换了就是新开一本账。想保留历史评论，唯一可行的做法是导出后自己造一层兼容 —— 一般不值得。

## 单篇关评论

不是每篇都适合开评论，比如通知类的、转载的。在那一篇的 front matter 里加一行：

```yaml
comment: false
```

只影响这一篇，别人的照旧。
