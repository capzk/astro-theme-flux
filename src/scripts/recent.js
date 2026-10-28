/**
 * Flux · 本站最新评论
 * ---------------------------------------------------------------------------
 * 一个挂在文章页底部的小挂件：拉全站最近几条评论，让人看到站点是活的。
 *
 * 三条约束决定了这里的写法：
 *
 *   1. **不抢首屏**。滚到它附近才发请求 —— 和评论区同一个道理，读者只读正文
 *      时不该为一块装饰性的列表付一个往返。
 *   2. **不使用 innerHTML**。评论正文是访客写的，Waline 存的是 HTML。
 *      这里一律 textContent，标签原样显示成文字 —— 一块「最近在聊什么」的
 *      预览不需要富文本，省掉的正是最容易出事的那部分。
 *   3. **失败就整块消失**。它是附加信息，不是正文；转圈或报错框比没有更碍眼。
 *
 * 数据形状的差异收在 `normalize` 里：目前只有 Waline，加一家就在那里多一个分支。
 */

const DEFAULT_LAZY = 400;

function readConfig(section) {
  const node = section.querySelector('.recent-config');
  if (!node) return null;
  try {
    return JSON.parse(node.textContent || '');
  } catch {
    return null;
  }
}

/**
 * 把各家的响应整理成同一种形状：{ nick, text, url, time }。
 * 认不出来就返回空数组 —— 上层不区分「接口挂了」和「格式变了」，
 * 两种情况的处理都是「这块不显示」。
 */
function normalize(type, data, length) {
  if (!Array.isArray(data)) return [];

  return data
    .map((item) => {
      if (!item || typeof item !== 'object') return null;

      /* 目前只有 waline 一家会走到这里 */
      const nick = String(item.nick ?? '').trim() || '匿名';
      const raw = String(item.comment ?? item.orig ?? '');
      /* 正文是 HTML：丢给浏览器解析一次再取 textContent，比手写正则剥标签可靠
         （正则剥不干净 `<img onerror>` 这类，而 DOMParser 不执行任何东西） */
      const text = raw
        ? new DOMParser().parseFromString(raw, 'text/html').body.textContent || ''
        : '';
      const trimmed = text.replace(/\s+/g, ' ').trim();
      if (!trimmed) return null;

      return {
        nick,
        text: trimmed.length > length ? `${trimmed.slice(0, length)}…` : trimmed,
        url: typeof item.url === 'string' ? item.url : '',
        time: String(item.insertedAt ?? item.createdAt ?? item.created ?? ''),
      };
    })
    .filter(Boolean)
    /* 有些服务端会把待审的也算进来，取够条数就停，不要多渲染 */
    .slice(0, 20);
}

function render(list, items) {
  const frag = document.createDocumentFragment();

  for (const item of items) {
    const li = document.createElement('li');
    li.className = 'recent-comments-item';

    /* 整条可点：读者想看上下文就跳过去，不必先瞄准那一行小字 */
    const link = document.createElement(item.url ? 'a' : 'span');
    if (item.url) link.href = item.url;

    const head = document.createElement('span');
    head.className = 'recent-comments-nick';
    head.textContent = item.nick;

    const body = document.createElement('span');
    body.className = 'recent-comments-text';
    body.textContent = item.text;

    link.append(head, body);
    li.append(link);
    frag.append(li);
  }

  list.append(frag);
}

function start(section) {
  const config = readConfig(section);
  const list = section.querySelector('.recent-comments-list');
  const lazy = typeof config?.lazy === 'number' ? config.lazy : DEFAULT_LAZY;

  if (!config?.endpoint || !list) {
    section.remove();
    return;
  }

  let done = false;

  const load = async () => {
    if (done) return;
    done = true;

    try {
      const response = await fetch(config.endpoint, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const items = normalize(config.type, await response.json(), config.length || 60);
      /* 一条都没有时整块不出现 —— 一个「暂无评论」的空卡片比没有更冷清 */
      if (items.length === 0) {
        section.remove();
        return;
      }

      render(list, items);
      section.dataset.state = 'ready';
    } catch {
      section.remove();
    }
  };

  if (lazy <= 0 || !('IntersectionObserver' in window)) {
    load();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      load();
    },
    { rootMargin: `${lazy}px 0px` },
  );
  observer.observe(section);
}

const section = document.querySelector('.recent-comments');
if (section) start(section);
