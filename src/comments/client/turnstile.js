/**
 * Turnstile 生命周期补丁（浏览器）
 * ---------------------------------------------------------------------------
 * 只干一件事：让「第二条评论」和「回复」还能拿到新 token。
 *
 * Waline 3.x 是这样调 Turnstile 的（`ua()` 里）：
 *
 *     turnstile.render('.wl-captcha-container', { sitekey, action, size: 'compact', callback })
 *
 * 它把 render 的返回值（widgetId）丢了，也从不 remove / reset。而 Cloudflare
 * 对同一个容器重复 render 是**直接拒绝**的 —— api.js 里的原文是
 *
 *     "Turnstile has already been rendered in this container. The render attempt was rejected."
 *
 * 被拒绝时它连 callback 都不调。于是：
 *
 *   · 第一条评论：正常，但那个验证框从此留在原地不消失；
 *   · 第二条评论 / 回复：render 被拒 → callback 不来 → Waline 的
 *     `await execute()` 永远挂着 → 按钮一直转 → 看起来就是「提交失败」。
 *
 * 所以这不是样式问题，也不是我们哪一步没按文档做，是上游少了一半的生命周期。
 *
 * 这里给 `window.turnstile` 套一层：render 之前先 remove 上一个 widget
 * （remove 会把它从 Cloudflare 的 widgetMap 里摘掉，重复检测才放行），拿到
 * token 之后再 remove 一次 —— 验证框随之消失，容器也回到干净状态。
 *
 * 顺手把渲染参数补成官方推荐的组合：
 *
 *   size: 'flexible'                跟着容器宽度走，不再是一个 150×140 的方块
 *                                   （compact 是按文档里「比 normal 更高，为
 *                                   窄侧栏设计」的尺寸，放进桌面评论框必然别扭）
 *   appearance: 'interaction-only'  不需要人工交互时整个不显示，多数读者
 *                                   从头到尾看不到验证框，也就没有位置问题
 *   theme / language                跟着主题明暗和页面语言走。默认的 auto 只认
 *                                   `prefers-color-scheme`，而本主题的暗色是手动
 *                                   切在 `html[data-user-color-scheme]` 上的，对不上
 *
 * 失效边界：上游哪天自己管了 remove / reset，或者换了容器类名，这个补丁就该删
 * （删了不会报错，只是退回到「第一条评论之后发不出去」的老样子）。
 */

/** 主题当前是暗是亮。BaseLayout 的首帧脚本保证这个属性一定存在 */
function scheme() {
  return document.documentElement.dataset.userColorScheme === 'dark' ? 'dark' : 'light';
}

/** Turnstile 收 ISO 639-1 或「语言-地区」，`<html lang>` 正好是后者 */
function language() {
  return document.documentElement.lang || 'en';
}

/**
 * 包一层 render。不新建对象 —— 直接改 api 上的方法，这样上游自己的
 * `window.turnstile` 引用、`getResponse` / `reset` / `ready` 全都原样可用。
 */
function wrap(api) {
  if (!api || typeof api.render !== 'function' || api.fluxWrapped) return api;

  const render = api.render.bind(api);
  const remove = typeof api.remove === 'function' ? api.remove.bind(api) : null;
  /** 上一次渲染出来的 widgetId，下一次 render 之前要先把它拆掉 */
  let last = null;

  const drop = (id) => {
    if (!remove || id == null) return;
    try {
      remove(id);
    } catch {
      /* 已经被移除过了就算了 */
    }
  };

  api.render = (container, params = {}) => {
    const el = typeof container === 'string' ? document.querySelector(container) : container;

    /* 顺序不能反：先让 Cloudflare 忘掉上一个 widget，再清 DOM。
       只清 DOM 不够 —— 重复检测查的是它自己的 widgetMap，不看元素里还剩什么 */
    drop(last);
    last = null;
    if (el) el.replaceChildren();

    const done = params.callback;
    let id = null;

    id = render(el || container, {
      ...params,
      size: 'flexible',
      appearance: 'interaction-only',
      theme: scheme(),
      language: language(),
      callback: (token) => {
        /* token 是一次性的，拿到就把 widget 收掉：验证框不再赖在页面上，
           下一次 render 也省得再拆一遍。放到下一个任务里做，别在 Cloudflare
           自己的回调栈里拔它的 DOM */
        const widget = id;
        setTimeout(() => {
          drop(widget);
          if (last === widget) last = null;
        }, 0);

        if (typeof done === 'function') done(token);
      },
    });

    last = id;
    return id;
  };

  api.fluxWrapped = true;
  return api;
}

/**
 * 装钩子。必须在 Turnstile 的 api.js **加载之前**就把监听器挂上 —— 它是 Waline
 * 在第一次提交评论时才注入的，评论挂载发生在页面加载后不久，时间来得及。
 */
export function hookTurnstile() {
  if (typeof window === 'undefined' || window.fluxTurnstile) return;
  window.fluxTurnstile = true;

  /* 已经有实例（别的插件先引了 api.js）：直接包 */
  if (window.turnstile) {
    wrap(window.turnstile);
    return;
  }

  /* 注意：**不能**提前 Object.defineProperty(window, 'turnstile', …) 去拦赋值。
     api.js 自己会算一个 `"turnstile" in window`，一旦提前定义，它就认定
     「已经加载过」（日志原文：Turnstile already has been loaded. Was Turnstile
     imported multiple times?），然后跳过整段初始化 —— 连 window.turnstile 都不
     赋值，验证码彻底不工作。这个坑是翻 api.js 源码才看出来的。

     所以改成盯 DOM：脚本节点插进 head 的那一刻挂 load 监听，脚本执行完立刻包一层。
     load 回调是同步跑的，比 Waline 那句 `await load()` 之后的微任务更早，
     它读到的 window.turnstile 已经是包过的了。 */
  const seen = new WeakSet();
  const watch = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType !== 1 || node.tagName !== 'SCRIPT' || seen.has(node)) continue;
        seen.add(node);
        if (!String(node.src).includes('challenges.cloudflare.com/turnstile')) continue;

        node.addEventListener(
          'load',
          () => {
            if (window.turnstile) wrap(window.turnstile);
          },
          { once: true },
        );
        watch.disconnect();
        return;
      }
    }
  });

  watch.observe(document.head, { childList: true, subtree: true });
}
