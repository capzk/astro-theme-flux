/**
 * 评论系统 · 公共契约
 * ---------------------------------------------------------------------------
 * 评论被拆成两层，中间只靠一份 JSON（CommentSection）通信：
 *
 *   构建期（src/comments/*.ts）—— 读配置、校验、算出该给浏览器发什么；
 *   运行期（src/comments/client/*.js）—— 浏览器里把脚本拉下来挂到 DOM 上。
 *
 * 这样加一个评论系统不需要动加载器、不需要动样式、也不用碰任何页面模板。
 * 具体步骤见 README「再加一个评论系统」。
 */
import type { CommentConfig } from '../config';

/** 站点支持的评论系统。加一个就在 src/config 的 `type` 里加一项 */
export type CommentType = 'waline' | 'giscus' | 'artalk';

/** 构建期传给 provider 的上下文 */
export interface CommentContext {
  /** 当前页面路径，如 `/posts/hello/` */
  path: string;
  /** 完整地址（`path: 'href'` 这类配置要用） */
  href: string;
  /** 站点语言（BCP 47），provider 负责翻译成自己认的写法 */
  lang: string;
  /** 暗色模式的判定选择器，主题固定挂在 html 的 data 属性上 */
  dark: string;
}

/**
 * 交给浏览器的配置。
 * 必须是纯 JSON —— 函数型选项（Waline 的 `imageUploader`、`texRenderer` 之类）
 * 传不过去，要用就得在 client/ 里自己写，不能靠配置。
 */
export interface CommentPayload {
  /** ES 模块或传统脚本地址 */
  js?: string;
  /** 样式地址 */
  css?: string;
  /**
   * 评论区标题上那枚「N 条」的占位 class —— 评论系统自己会回填它。
   * 不给就说明这家不暴露评论数，徽标整枚不渲染。这样模板里不必写死某一家的类名。
   */
  countClass?: string;
  /** 透传给评论系统的初始化选项 */
  init: Record<string, unknown>;
}

/** 页面里那一份完整的下发配置 */
export interface CommentSection extends CommentPayload {
  type: CommentType;
  /** 滚到距评论区多少像素时开始加载；0 = 进页面就加载 */
  lazy: number;
}

/**
 * 「本站最新评论」挂件的取数说明。
 *
 * 各家的接口形状差得太远（Waline 是 `GET /comment?type=recent`，别家没有或者
 * 要鉴权），所以这里**不定义统一的返回结构** —— provider 只负责给出「去哪取、
 * 取几条」，把响应整理成 `<li>` 的活儿交给 `client/recent.js` 里那家自己的
 * 归一化函数。多一层抽象的代价比多写十行适配还高。
 */
export interface RecentCommentsSpec {
  /** 取数地址（完整 URL，含查询参数） */
  endpoint: string;
  /** 每条正文最多保留多少字，超了截断 */
  length: number;
  /** 评论系统标识 —— 客户端按它挑归一化函数 */
  type: CommentType;
}

/** 一个评论系统的构建期实现 */
export interface CommentProvider<TConfig> {
  readonly type: CommentType;
  /** 报错、警告里用的名字 */
  readonly label: string;
  /** 从总配置里取出自己那一段 */
  configOf(comment: CommentConfig): TConfig | undefined;
  /** 配置够不够跑起来。不够就整块不渲染，构建期打一条警告 */
  ready(config: TConfig | undefined): config is TConfig;
  /** 不够的时候缺什么 —— 只为把警告说清楚 */
  diagnose(): string;
  /** 生成下发配置 */
  build(config: TConfig, ctx: CommentContext): CommentPayload;
  /**
   * 可选：要提前握手的域名（`<link rel="preconnect">`）。
   *
   * 评论脚本是懒加载的，等它开始下载时再握手就晚了 —— 一个跨境 TLS 握手
   * 差不多 100~300ms，比脚本本身还贵。页面 head 里先握好，滚到评论区时
   * 只剩传输时间。
   */
  origins?(config: TConfig): string[];
  /**
   * 可选：文章页底部的「本站最新评论」。不实现就是「这家取不到」，
   * 挂件整块不渲染 —— 不会留一个永远转圈的加载态。
   *
   * `options` 来自 `comment.recent`（条数、每条截多少字）。放参数里而不是
   * 塞进各家的私有配置，是因为它属于「挂件怎么显示」，不该在 waline /
   * artalk 那几段里各写一遍。
   */
  recent?(
    config: TConfig,
    ctx: CommentContext,
    options: { count: number; length: number },
  ): RecentCommentsSpec | null;
}

/** 一次解析的完整结果：评论区、最新评论各管各的 */
export interface ResolvedComments {
  /** 评论区；null = 这一页不渲染评论区 */
  section: CommentSection | null;
  /** 最新评论挂件；null = 不渲染 */
  recent: RecentCommentsSpec | null;
}
