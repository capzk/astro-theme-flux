/**
 * 日期格式化
 * ---------------------------------------------------------------------------
 * 之前每个组件里都写 `date.toLocaleDateString('zh-CN', { … })` —— 9 处一样的
 * 参数散在 5 个文件里。中文站看着没问题，可 SITE.lang 改成 en 之后，日期仍然是
 * 「2024年3月15日」，和其它英文界面拼在一起就很突兀。
 *
 * 现在只有三种版式，名字说的是「用在哪」而不是「长什么样」：
 *
 *   day   03/15          归档、门户的紧凑行 —— 年份已由分组标题 / 上下文给出
 *   card  2024/03/15     卡片、列表项 —— 需要一眼看到年份
 *   long  2024年3月15日   文章页 banner、更新时间 —— 有空间，写成话
 *
 * 语言默认跟随 `SITE.lang`。**不要在这里写死 `zh-CN`**：那是站点配置的事，
 * 想换语言就改一处配置，而不是回来翻组件。
 *
 * 第三个参数留给测试（以及将来「按语言覆盖个别版式」的场合）显式传 locale。
 */
import { SITE } from '../config';

export type DateStyle = 'day' | 'card' | 'long';

/** 每种版式对应的 Intl 选项。改版式只改这一张表。 */
const STYLES: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  day: { month: '2-digit', day: '2-digit' },
  card: { year: 'numeric', month: '2-digit', day: '2-digit' },
  long: { year: 'numeric', month: 'long', day: 'numeric' },
};

/**
 * 把 Date 格式化成界面文案。
 *
 * 注意这里用的是 `toLocaleDateString` 而不是手写 `getFullYear()` 拼接：
 * 后者在非中文语言下就废了（顺序、分隔符、月名都不同），而 Intl 是内置的，
 * 零依赖零体积。
 */
export function formatDate(date: Date, style: DateStyle = 'long', locale = SITE.lang): string {
  return date.toLocaleDateString(locale, STYLES[style]);
}
