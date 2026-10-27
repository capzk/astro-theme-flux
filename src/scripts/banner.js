/**
 * Flux · Banner 的两个动效：打字机、视差
 * ---------------------------------------------------------------------------
 * 都做成「有 data 属性才启动」：没配就一行都不跑，页面完全静态。
 * 参数由 Banner.astro 在构建期算好写进 data 属性，这里不再补默认值 ——
 * 默认值只该有一个出处，否则两处各说一套，改的时候必然漏一边。
 *
 * 两边都尊重 `prefers-reduced-motion: reduce`：开了系统减弱动效就直接显示
 * 完整文案、不接管滚动。这不是可选项，前庭功能障碍的用户会因视差眩晕。
 */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** 逐字打出 */
async function typeText(el, text, speed) {
  for (let i = 1; i <= text.length; i += 1) {
    el.textContent = text.slice(0, i);
    await sleep(speed);
  }
}

/** 逐字删掉 */
async function eraseText(el, text, speed) {
  for (let i = text.length; i >= 0; i -= 1) {
    el.textContent = text.slice(0, i);
    await sleep(speed);
  }
}

/**
 * 打字机。
 *
 * 轮播的条件是「有多句」或「显式 loop」。只有一句且没开 loop 时打一遍就停 ——
 * 那是绝大多数人的用法（一句站内签名），不该无休止地闪。
 */
async function startTyping(el) {
  let config;
  try {
    config = JSON.parse(el.dataset.bannerTyping ?? '');
  } catch {
    return;
  }

  const lines = Array.isArray(config.lines) ? config.lines.filter(Boolean) : [];
  if (lines.length === 0) return;

  const speed = Number(config.typeSpeed) || 70;
  const startDelay = Number(config.startDelay) || 0;
  const rotate = Boolean(config.loop) || lines.length > 1;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    /* 不动画：显示第一句 —— 也就是没有 JS 时看到的那句，行为一致 */
    el.textContent = lines[0];
    return;
  }

  await sleep(startDelay);

  let index = 0;
  for (;;) {
    const text = lines[index];

    el.textContent = '';
    await typeText(el, text, speed);

    if (!rotate) return;

    /* 打完停一会儿再删：删得太快，读者来不及读 */
    await sleep(1800);
    await eraseText(el, text, speed / 2);

    index = (index + 1) % lines.length;
    await sleep(200);
  }
}

/**
 * 视差。
 *
 * 只动背景层，不动文字层 —— 所以 transform 挂在 `.banner-bg` 上，
 * 不是 `<header>` 上。位移取滚动距离的 1/4，同时把背景放大 12%
 * 抵消位移带来的露边。
 *
 * 用 rAF 节流：scroll 事件在高刷屏上一秒能来上百次，每次都写 style 会掉帧。
 * banner 滚出视野后不再计算，省掉无用功。
 */
function startParallax(banner) {
  const bg = banner.querySelector('.banner-bg');
  if (!bg) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  bg.style.willChange = 'transform';
  let queued = false;

  const update = () => {
    queued = false;
    const rect = banner.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;

    const scrolled = Math.min(Math.max(-rect.top, 0), rect.height);
    bg.style.transform = `translate3d(0, ${(scrolled * 0.25).toFixed(1)}px, 0) scale(1.12)`;
  };

  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

const typingEl = document.querySelector('.banner-subtitle[data-banner-typing]');
if (typingEl) void startTyping(typingEl);

const parallaxBanner = document.querySelector('.banner[data-parallax]');
if (parallaxBanner) startParallax(parallaxBanner);
