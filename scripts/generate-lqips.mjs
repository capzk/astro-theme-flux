/**
 * LQIP（Low Quality Image Placeholder）生成器
 * ---------------------------------------------------------------------------
 * 给每张图算出「它大致是什么颜色」，产出一份 18 个字符的紧凑记录：
 *
 *   src/assets/covers/cover-1.webp → "6e3b38ae7472af7574"
 *                                     └顶左┘└顶右┘└底右┘
 *
 * 浏览器端（src/utils/lqip.ts）把它解成一条 135° 斜向渐变，垫在 <img> 后面当占位。
 * 图片没下载完时，卡片位置显示的是「这张图的主色调」，而不是一块白 —— 这比
 * 一张 20×14 的模糊小图（另一种常见 LQIP 做法）少一次请求、少一次解码，
 * 而且永远不会出现「模糊图与真图颜色对不上」的突兀感。
 *
 * ⚠️ 这个脚本**不在构建流程里**，需要手动跑：
 *
 *     npm run lqips
 *
 * 为什么不让 `npm run build` 顺带跑：
 *   1. 它要读遍所有图片、调 sharp —— CF Pages 的构建机是共享的，sharp 偶发拉不到
 *      二进制就会整站构建失败，而占位色这种东西缺席一次完全不影响可用性；
 *   2. 关键前提是「产物入库」（src/data/lqips.json 提交进 git）。构建只读 JSON，
 *      零 I/O、零失败面。换图之后跑一次、把 JSON 一起提交即可 —— 和提交那张图
 *      本来就是同一件事。
 *
 * 为什么用 2×2 而不是主色提取：2×2 的四个像素刚好能拼出「上左 → 上右 → 下右」
 * 三个角，做斜向渐变时方向感是对的（天在上、地在下），而平均色只有一个色块，
 * 和后面的真图对比起来总像蒙了一层。
 */
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const OUT_FILE = path.join(ROOT, 'src/data/lqips.json');

/** 扫这两个目录：参与优化的资源图，和原样输出的 public 图 */
const SCAN_DIRS = ['src/assets', 'public'];

/** SVG 不处理：矢量图本身就只有几 KB，而且没有「主色调」可言 */
const EXTS = new Set(['.webp', '.avif', '.png', '.jpg', '.jpeg']);

/** 递归收集图片，返回相对项目根的路径（正斜杠，跨平台一致，也方便当 JSON 键） */
async function collect(dir, out = []) {
  const abs = path.join(ROOT, dir);
  if (!existsSync(abs)) return out;

  for (const entry of await readdir(abs, { withFileTypes: true })) {
    const rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collect(rel, out);
    } else if (EXTS.has(path.extname(entry.name).toLowerCase())) {
      out.push(rel);
    }
  }
  return out;
}

/** 一张图 → 18 字符：顶左 + 顶右 + 底右，各 6 位 hex（不带 #） */
async function placeholderOf(file) {
  const { data, info } = await sharp(path.join(ROOT, file))
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

const files = (await Promise.all(SCAN_DIRS.map((dir) => collect(dir)))).flat().sort();

const table = {};
let failed = 0;

for (const file of files) {
  try {
    table[file] = await placeholderOf(file);
  } catch (error) {
    failed += 1;
    console.warn(`  ✗ ${file} —— ${error.message}`);
  }
}

await mkdir(path.dirname(OUT_FILE), { recursive: true });
await writeFile(OUT_FILE, `${JSON.stringify(table, null, 2)}\n`, 'utf8');

const size = Buffer.byteLength(JSON.stringify(table));
console.log(
  `[lqips] ${Object.keys(table).length} 张图 → src/data/lqips.json（${size} B）` +
    (failed ? `，${failed} 张失败` : ''),
);
