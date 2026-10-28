/**
 * /robots.txt
 * ---------------------------------------------------------------------------
 * 从 astro.config.mjs 的 `site` 拼出来，域名只维护一处 ——
 * fork 的人改了 site，这里跟着变，不会漏。
 *
 * 这个文件现在承担两件事：
 *   1. 放行抓取 + 指向 sitemap（Google 2023 年就废了 sitemap 的 /ping 接口，
 *      robots.txt 里这一行是「被动发现」唯一还活着的路子）
 *   2. 用 Content-Signal 声明内容可以怎么用（见下面那段说明）
 */
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const base = (site ?? new URL('https://example.com')).href.replace(/\/$/, '');

  const body = `User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=no
Allow: /

Sitemap: ${base}/sitemap-index.xml

# 内容用途声明（Content Signals），语法与含义见 https://contentsignals.org
# ---------------------------------------------------------------------------
# 三类用途，各写 yes 或 no：
#
#   search    建立搜索索引、返回链接与短摘要（**不含** AI 生成的搜索摘要）
#   ai-input  把内容喂给模型：RAG、实时检索、生成式搜索的回答
#   ai-train  训练或微调模型
#
# 现在的取值是「允许被引用，不允许被拿去训练」：
#   · ai-input=yes 是 AI 搜索结果里能引用到你的前提，关掉等于自己选择隐身
#   · ai-train=no  不让内容进训练集
# 想全放开就把 no 改成 yes；想更严格就 ai-input=no。
#
# 访问本站即表示接受这些条款；未声明的用途既不授权也不禁止。
# 这些限制是依 EU DSM 指令 2019/790 第 4 条作出的权利保留（opt-out）。
#
# ⚠️ 目前只有 Cloudflare 一家真的读这几行，别的爬虫会直接忽略，写了没有副作用。
# ⚠️ 若把站点放在 Cloudflare Pages 又开了 Managed robots.txt，CF 会接管这个文件，
#    而它**默认挡掉 GPTBot / ClaudeBot / CCBot / Bytespider / Google-Extended** ——
#    开了之后站点在 AI 搜索里会整个消失，用 curl 看一眼自己域名的 /robots.txt
#    到底返回了什么，别只看仓库里这份。

# 给某一家单独改规则（取消注释即可）
# ---------------------------------------------------------------------------
# 注意：一旦给某个 UA 建了分组，它就不再读上面的 \`*\` 组，Content-Signal 要抄过去。
#
# User-agent: GPTBot
# User-agent: ClaudeBot
# User-agent: CCBot
# User-agent: Bytespider
# User-agent: meta-externalagent
# User-agent: PerplexityBot
# User-agent: Google-Extended
# Content-Signal: search=yes, ai-input=yes, ai-train=no
# Allow: /
#
# 连引用都不许（只保留普通搜索收录）就把 Allow 换成 Disallow: / 。

# 给 AI 爬虫的站点索引，约定见 https://llmstxt.org
# 目录 + 摘要：${base}/llms.txt
# 全站正文：  ${base}/llms-full.txt
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
