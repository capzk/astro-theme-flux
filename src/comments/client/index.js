// @ts-check
/**
 * 评论系统挂载器注册表（浏览器）
 * ---------------------------------------------------------------------------
 * 键名必须和 src/config 里 `comment.type` 的取值一致。
 * 加一个评论系统：在本目录写一个 mount 函数，然后在这里加一行。
 */
import mountArtalk from './artalk.js';
import mountGiscus from './giscus.js';
import mountNest from './nest.js';
import mountWaline from './waline.js';

/**
 * 每种评论系统的挂载函数：拿到上下文，把评论区渲染出来。
 * 返回值只用于「这一次加载有没有失败」，调用方不看内容。
 *
 * @typedef {(ctx: import('./types.js').MountContext) => Promise<unknown>} Mounter
 */

/** @type {Record<string, Mounter>} */
export const MOUNTERS = {
  artalk: mountArtalk,
  giscus: mountGiscus,
  nest: mountNest,
  waline: mountWaline,
};
