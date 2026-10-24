---
title: 深色模式是怎么做到不闪白的
date: 2026-10-12 21:10:00
description: 首帧渲染之前就把主题写进 html，靠一段几行的内联脚本 + 一套 CSS 变量。没有框架，也没有闪烁。
tags:
  - 深色模式
  - CSS
categories:
  - 实现
indexImg: /img/cover-2.svg
---

深色模式最难的不是配色，是**不闪白**。

浏览器先按默认样式渲染一帧，等外链 CSS 与脚本加载完，才切到深色——那一瞬间的白屏，就是大多数人放弃在自己博客里做深色模式的原因。

## 三行内联脚本

关键是把「读偏好 → 定模式 → 写到 `<html>`」压到 `<head>` 里、在任何内容之前执行：

```js
(function () {
  var saved = localStorage.getItem('flux-color-scheme');
  var mode = saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.userColorScheme = mode;
})();
```

它必须是 `is:inline`——外链脚本是异步的，会晚一帧，白闪就藏不住。

## 一套 CSS 变量

所有颜色都是变量，两套值挂在同一个选择器上：

```css
:root {
  --body-bg-color: #eee;
  --board-bg-color: #ffffff;
  --text-color: #3c4858;
}

[data-user-color-scheme='dark'] {
  --body-bg-color: #181c27;
  --board-bg-color: #252d38;
  --text-color: #c4c6c9;
}
```

组件里只写 `var(--board-bg-color)`，不关心当前是哪套。加第三套主题，也只是再加一段变量。

## 优先级

```
localStorage 手动选择  >  站点默认值  >  系统偏好
```

用户手动点过切换之后，就不再跟随系统——否则「我明明选了亮色，晚上它自己变黑了」会让人困惑。

## 代码高亮也要跟着变

Shiki 在构建期为每个 token 输出两套颜色，以 CSS 变量的形式内联：

```html
<span style="--shiki-light:#0550ae;--shiki-dark:#79c0ff">const</span>
```

页面上再用一行 CSS 选择用哪套：

```css
.astro-code span {
  color: var(--shiki-light);
}
[data-user-color-scheme='dark'] .astro-code span {
  color: var(--shiki-dark);
}
```

这意味着深浅两套高亮是**同一份 HTML**，切换主题不需要重新高亮、不发请求。
