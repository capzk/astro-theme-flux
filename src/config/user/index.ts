/**
 * 你的配置 —— 只写和默认值不一样的部分
 * ---------------------------------------------------------------------------
 * 这个目录是**你的地盘**：升级主题时，主题只会替换 `src/config/` 下的
 * `types.ts` / `defaults.ts` / `merge.ts` / `index.ts`，`user/` 整个目录不碰。
 * 所以你的站名、导航、配色、评论配置不会在升级时被冲掉，也不需要「备份再还原」。
 *
 * 文件怎么分的：
 *
 *   site.ts        站名、描述、作者、头像、OG 图、导航菜单
 *   appearance.ts  banner、文章 banner、配色、暗色模式
 *   content.ts     首页卡片、文章页开关、每页条数、搜索
 *   comment.ts     评论系统（Waline / Giscus）
 *   links.ts       友链
 *
 * 字段的类型和说明在 `src/config/types.ts`，出厂值在 `src/config/defaults.ts`。
 * 想加一项：在这个目录里随便哪个文件写上去即可，类型检查会确认字段名对不对。
 */
import site from './site';
import appearance from './appearance';
import content from './content';
import comment from './comment';
import { deepMerge, type UserConfig } from '../merge';

/**
 * 按顺序叠加：后面的覆盖前面的。
 *
 * 用 `deepMerge` 而不是对象展开，是因为**同一棵配置子树可以分在两个文件里写**
 * （比如 banner 的图放 appearance、文案放 site）。对象展开只合并顶层，
 * 后写的会把先写的那一半整个顶掉。
 */
const USER_CONFIG: UserConfig = [site, appearance, content, comment].reduce(
  (acc, part) => deepMerge(acc, part),
  {} as UserConfig,
);

export default USER_CONFIG;
