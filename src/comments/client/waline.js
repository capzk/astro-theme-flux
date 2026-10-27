/**
 * Waline 挂载（浏览器）
 * ---------------------------------------------------------------------------
 * 官方客户端是个 ES 模块，导出的 `init(options)` 会自己在 el 上建 Vue 应用，
 * 返回 `{ el, update, destroy }`。我们只需要它把评论区渲染出来。
 *
 * 传进来的 `section.init` 已经是构建期算好的完整选项（路径、语言、暗色选择器、
 * 分页、表情……），这里不再补任何业务默认值 —— 免得两处各说一套。
 *
 * 配了 Turnstile 的话，先装一个补丁再 init：Waline 自己不回收验证码 widget，
 * 第二条评论会卡死，原因见 ./turnstile.js 开头。
 */
import { hookTurnstile } from './turnstile.js';

/**
 * @param {object} ctx
 * @param {HTMLElement} ctx.el      挂载点
 * @param {object} ctx.section      构建期下发的配置（type / js / css / init / lazy）
 * @param {(src: string) => Promise<any>} ctx.loadModule 动态 import（带重试去缓存）
 */
export default async function mountWaline({ el, section, loadModule }) {
  /* 补丁要在 Turnstile 的 api.js 被注入之前就位 —— 它由 Waline 在第一次
     提交评论时才懒加载，这里装钩时间绰绰有余 */
  if (section.init?.turnstileKey) hookTurnstile();

  const client = await loadModule(section.js);
  if (typeof client.init !== 'function') {
    throw new Error('Waline 客户端没有导出 init()');
  }

  const instance = client.init({ ...section.init, el });
  if (!instance) throw new Error('Waline 没有返回实例');
}
