// @ts-check
/**
 * 评论系统的类型契约（只有类型，运行时不导出任何东西）
 * ---------------------------------------------------------------------------
 * 这个文件不会被任何脚本 import —— 它只是几段 JSDoc 的落脚处。三个 mounter
 * （waline / giscus / artalk）与加载器 src/scripts/comments.js 都通过
 * `import('./types.js').Xxx` 引用，于是「下发给浏览器的配置长什么样」只有一处
 * 定义：加一个字段时不会有人漏改，写错字段名编译期就会报。
 */

/**
 * 构建期写在页面里的那份配置（Comments.astro 以 JSON 输出，CSP 友好）。
 *
 * @typedef {object} CommentSection
 * @property {string} type              评论系统标识，与 MOUNTERS 的键一致
 * @property {string} js                客户端脚本地址
 * @property {string} [css]             客户端样式地址
 * @property {Record<string, any>} init 构建期算好的完整选项
 * @property {number} [lazy]            距评论区多少像素开始加载，0 = 立即
 * @property {string} [recent]          本站最新评论的接口地址
 * @property {string} [error]           加载失败时给人看的文案
 */

/**
 * 交给 mounter 的上下文。各家按需取用：giscus 用不到 loadModule，
 * artalk / waline 用不到 attempt。
 *
 * @typedef {object} MountContext
 * @property {HTMLElement} el                           挂载点
 * @property {CommentSection} section                   构建期配置
 * @property {number} attempt                           第几次尝试（重试时 > 0）
 * @property {(src: string) => Promise<any>} loadModule 动态 import（带重试去缓存）
 */

export {};
