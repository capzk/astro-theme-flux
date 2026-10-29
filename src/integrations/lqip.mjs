/**
 * Flux · 占位色集成（LQIP）
 * ---------------------------------------------------------------------------
 * 给每张图算一个「它大致是什么颜色」的占位色，挂成虚拟模块 `virtual:flux-lqip`，
 * 由 `src/utils/lqip.ts` 读走，渲染成一条 135° 斜向渐变垫在图片下面。
 *
 * 为什么是「集成」而不是「脚本 + npm 钩子」：
 *   脚本方案要么得人记着跑一次，要么给 `build` 挂个 `prebuild` 钩子 —— 后者等于把
 *   「算占位色」强加在 npm 命令上：换个入口（直接 `astro build`、IDE 的构建按钮、
 *   别人的 CI 写成 `npx astro build`）就静默失效，而且 npm scripts 和脚本本身两处
 *   要一起对。`astro:config:setup` 是 Astro 自己的生命周期，build / dev 都会经过，
 *   与命令行入口无关。
 *
 * 失败不影响构建：算不出来就打一行警告，虚拟模块返回空表，页面照旧只是没有占位色。
 * 「少一点精致」不该升级成「构建挂了」。
 *
 * 没有中间产物：颜色直接内联进构建结果，仓库里不再有一份要提交的 JSON，
 * 也就不存在「忘了重新生成」这种状态。
 */
import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const VIRTUAL_ID = 'virtual:flux-lqip';
/* Vite 约定：`\0` 前缀表示「这是虚拟模块，别交给别的插件按文件路径去找」 */
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

/** SVG 不处理：矢量图本身只有几 KB，也没有「主色调」可言 */
const EXTS = new Set(['.webp', '.avif', '.png', '.jpg', '.jpeg']);

/** 递归收集图片，返回绝对路径 */
async function collect(dir, out = []) {
  if (!existsSync(dir)) return out;

  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) await collect(abs, out);
    else if (EXTS.has(path.extname(entry.name).toLowerCase())) out.push(abs);
  }
  return out;
}

/**
 * 一张图 → 18 个字符：顶左 + 顶右 + 底右，各 6 位十六进制（不带 `#`）。
 *
 * 用 2×2 而不是主色提取：2×2 的四个像素刚好能拼出「上左 → 上右 → 下右」三个角，
 * 做斜向渐变时方向感是对的（天在上、地在下）；平均色只有一个色块，
 * 和后面的真图对比起来总像蒙了一层。
 */
async function placeholderOf(sharp, file) {
  const { data, info } = await sharp(file)
    .resize(2, 2, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const hex = (index) => {
    const offset = index * channels;
    return [data[offset], data[offset + 1], data[offset + 2]]
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('');
  };

  /* 0=左上 1=右上 2=左下 3=右下。取 0→1→3 而不是 0→2→3：
     斜向渐变从左上往右下走，和大多数照片的明暗走向一致 */
  return `${hex(0)}${hex(1)}${hex(3)}`;
}

/**
 * 扫 `src/assets`（参与优化的资源图）与 `public`（原样输出的图），
 * 键是「相对项目根目录的正斜杠路径」，与 `lqip.ts` 里拼出来的键一一对应。
 */
async function buildTable(config) {
  const sharp = (await import('sharp')).default;

  const root = fileURLToPath(config.root);
  const dirs = [
    path.join(fileURLToPath(config.srcDir), 'assets'),
    fileURLToPath(config.publicDir),
  ];

  const files = (await Promise.all(dirs.map((dir) => collect(dir)))).flat().sort();

  const table = {};
  for (const file of files) {
    try {
      table[path.relative(root, file).split(path.sep).join('/')] = await placeholderOf(sharp, file);
    } catch {
      /* 单张图读不了（损坏 / 格式怪）就跳过它，不影响别的图 */
    }
  }
  return table;
}

/** 把表挂成一个虚拟模块，`import colors from 'virtual:flux-lqip'` 就能拿到 */
function virtualModule(table) {
  return {
    name: 'flux:lqip-virtual',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },
    load(id) {
      if (id === RESOLVED_ID) return `export default ${JSON.stringify(table)};`;
    },
  };
}

export default function lqip() {
  return {
    name: 'flux:lqip',
    hooks: {
      'astro:config:setup': async ({ config, updateConfig, logger }) => {
        let table = {};
        try {
          table = await buildTable(config);
          const count = Object.keys(table).length;
          if (count > 0) logger.info(`${count} 张图算好了占位色`);
        } catch (error) {
          logger.warn(`占位色已跳过（页面照常，只是图没到时没有底色）：${error.message}`);
        }

        updateConfig({ vite: { plugins: [virtualModule(table)] } });
      },
    },
  };
}
