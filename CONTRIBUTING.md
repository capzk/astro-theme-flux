# 参与贡献

感谢你想让 Flux 更好。这份文档说明**改哪里、怎么改、改完怎么验证** ——
主题有一些刻意的设计纪律，先花五分钟读完，能省掉一次来回的 review。

## 五分钟上手

```bash
npm ci          # 严格按 lock 安装（Node >= 22.23.4，见 package.json engines）
npm run dev     # 本地开发
npm run check   # 类型检查（astro check，覆盖 .ts / .astro / 带 @ts-check 的 .js）
npm test        # 单元测试（vitest，只测纯函数）
npm run build   # 完整构建 —— 它也是集成测试：配置体检、sitemap、Feed 都在这一步跑
```

提 PR 之前三条命令必须全绿，CI 跑的就是这三条。

## 目录纪律：哪些文件能改

主题升级的原则是「**你的配置不会被冲掉**」，所以配置层分成两边：

| 位置 | 归属 | 升级主题时 |
|---|---|---|
| `src/config/types.ts` / `defaults.ts` / `merge.ts` / `validate.ts` | 主题 | **整个被替换** |
| `src/config/user/*.ts` | 用户 | 不动 |

因此：

- **新功能的默认值**放 `defaults.ts`，类型放 `types.ts`，用户目录里只留注释示例；
- `user/` 里**只写和默认值不一样的字段** —— 抄一遍默认值不会让它更快，只会在升级时制造「其实没改」的冲突；
- 数组（`nav`、`links`）在 `deepMerge` 里是**整体替换**不是逐项合并，往默认数组追加新项属于破坏性变更，要在 CHANGELOG 里写明。

## 几条写代码的规矩

- **零运行时框架**：不引入 React/Vue/Svelte 和任何前端依赖。客户端脚本是原生 JS +
  `// @ts-check`，每个文件顶部都有 JSDoc 类型。评论系统是唯一允许的外部运行时。
- **Markdown 插件**（`src/plugins/markdown.js`）一条硬规则：一次 `visit` 只做一次
  结构变更（wrap/insert/remove），要两步就拆两趟插件 —— 原因写在文件头注释里。
- **站内链接一律过 `src/utils/url.ts`**（`withBase` / `publicPath`），否则子路径部署会坏。
  新增根路径字面量（`'/xxx'`）之前先想想 `base: '/blog'` 下它还成立吗。
- **纯逻辑放纯函数**：能进 `src/utils/` 且不碰 `astro:content` / DOM 的函数，
  顺手在 `tests/` 里补一条用例。分页边界、合并规则这类问题在页面上看不出来，
  历史上都翻过车（见 `待修复项.md` #15）。
- **注释解释「为什么」**：这个仓库的注释密度是特性的一部分。改行为时同步改注释，
  注释与实现不符按缺陷处理。

## 提交与 CHANGELOG

- 一个 PR 只做一件事；行为变更（用户能感知）必须在 `CHANGELOG.md` 的 `[Unreleased]` 加条目。
- commit 前缀参考现有历史：`fix:` / `feat:` / `perf:` / `docs:` / `deps:` / `chore:`。
- 只改注释措辞、拼写这类不占 CHANGELOG。

## 格式化工具

仓库提供 `.editorconfig` 与 Prettier 配置（`npm run format`），但**没有**把
`format:check` 挂进 CI：现有代码的注释排版是逐行手调的，全量重排会产出一个
几万行的 diff。想调整格式请单独开 PR、只动格式不动行为，并且只在相关目录跑。

## 提 issue

用 `.github/ISSUE_TEMPLATE` 里的表单。Bug 请带最小复现（哪个配置、哪个页面、
`base` 是什么）；功能建议先写「做不到什么」再写「你希望怎么做」，
并且留意主题定位（静态站、零框架）—— 超出定位的建议会转成文档教程而不是内置功能。
