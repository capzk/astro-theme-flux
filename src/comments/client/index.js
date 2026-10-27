/**
 * 评论系统挂载器注册表（浏览器）
 * ---------------------------------------------------------------------------
 * 键名必须和 src/config 里 `comment.type` 的取值一致。
 * 加一个评论系统：在本目录写一个 mount 函数，然后在这里加一行。
 */
import mountGiscus from './giscus.js';
import mountWaline from './waline.js';

export const MOUNTERS = {
  giscus: mountGiscus,
  waline: mountWaline,
};
