# 暗黑模式设计

支持深色主题的 UI 设计模式，确保在暗光环境下的可读性和舒适性。

---

## 概述

暗黑模式（Dark Mode）是一种低光环境下的界面配色方案，通过降低整体亮度来减少眼睛疲劳。

---

## 核心原则

### 1. 不是纯黑

避免使用纯黑背景（#000000），因为：

- 纯黑会导致文字晕染（halation）
- 与白色文字对比度过高
- 失去视觉层次

推荐使用深灰色调：

| 模式   | 背景色  |
| ------ | ------- |
| 深灰   | #1a1a1a |
| 中深灰 | #242424 |
| 浅深灰 | #2d2d2d |

### 2. 降低对比度

亮色模式下的高对比度在暗色模式下会过于刺眼：

| 元素     | 亮色模式        | 暗色模式        |
| -------- | --------------- | --------------- |
| 文本     | #000000e0 (87%) | #ffffffb3 (70%) |
| 次要文本 | #00000073 (45%) | #ffffff40 (25%) |
| 边框     | #d9d9d9         | #424242         |

### 3. 颜色映射

暗黑模式下需要调整颜色：

```css
/* 颜色映射策略 */
:root {
  /* 亮色模式 */
  --color-bg: #ffffff;
  --color-bg-secondary: #f5f5f5;
  --color-text: #000000e0;
  --color-border: #d9d9d9;
  --color-primary: #1677ff;
}

[data-theme="dark"] {
  /* 暗色模式 */
  --color-bg: #141414;
  --color-bg-secondary: #1f1f1f;
  --color-text: #ffffffb3;
  --color-border: #424242;
  --color-primary: #4096ff;
}
```

---

## 色彩系统

### 主色调整

暗色模式下需要提亮主色：

```css
[data-theme="dark"] {
  /* 主色提亮 */
  --color-primary: #4096ff; /* 从 #1677ff 提亮 */
  --color-primary-hover: #69b1ff;
  --color-primary-active: #0958d9;

  /* 功能色调整 */
  --color-success: #95de64;
  --color-warning: #ffd666;
  --color-error: #ff7875;
  --color-info: #69c0ff;
}
```

### 中性色层级

```css
[data-theme="dark"] {
  /* 文本色 - 降低透明度 */
  --color-text: #ffffffb3; /* 87% → 70% */
  --color-text-secondary: #ffffff40; /* 45% → 25% */
  --color-text-tertiary: #ffffff1f; /* 25% → 12% */

  /* 背景色 - 提亮 */
  --color-bg: #141414;
  --color-bg-secondary: #1a1a1a;
  --color-bg-tertiary: #242424;

  /* 边框色 */
  --color-border: #424242;
  --color-border-hover: #5c5c5c;
}
```

---

## 阴影调整

暗色模式下阴影效果减弱：

```css
/* 亮色模式 */
.card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 暗色模式 - 使用更柔和的阴影或发光效果 */
[data-theme="dark"] .card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  /* 或使用边框代替阴影 */
  border: 1px solid #303030;
}
```

---

## 组件适配

### 输入框

```css
.input {
  background: #ffffff;
  border-color: #d9d9d9;
  color: #000000e0;
}

[data-theme="dark"] .input {
  background: #1f1f1f;
  border-color: #424242;
  color: #ffffffb3;
}
```

### 按钮

```css
[data-theme="dark"] .btn-primary {
  /* 暗色模式下的主按钮 */
  background: #4096ff;
  color: #000000e0; /* 深色文字 */
}

[data-theme="dark"] .btn-default {
  background: #1f1f1f;
  border-color: #424242;
  color: #ffffffb3;
}
```

### 表格

```css
[data-theme="dark"] .table {
  background: #141414;
}

[data-theme="dark"] .table-row:hover {
  background: #1f1f1f;
}

[data-theme="dark"] .table-border {
  border-color: #303030;
}
```

---

## 实现方案

### CSS 变量 + data 属性

```css
:root {
  --color-bg: #ffffff;
  --color-text: #000000e0;
}

[data-theme="dark"] {
  --color-bg: #141414;
  --color-text: #ffffffb3;
}

body {
  background: var(--color-bg);
  color: var(--color-text);
}
```

### JavaScript 切换

```javascript
// 检测系统偏好
const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

// 监听变化
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
});
```

### 本地存储

```javascript
// 用户手动切换
function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

// 初始化
const savedTheme =
  localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
setTheme(savedTheme);
```

---

## 可访问性

### 对比度要求

暗色模式下仍需满足 WCAG 对比度：

- 重要文本：至少 4.5:1
- 大文本（≥18px）：至少 3:1
- UI 组件：至少 3:1

### 避免的问题

- 避免纯白文字在纯黑背景
- 避免高饱和度颜色
- 避免过多发光效果
- 确保焦点可见性

---

## 性能考虑

### 减少重绘

```css
/* 使用 CSS 变量，利用 GPU 加速 */
[data-theme="dark"] {
  /* 使用 transform 和 opacity 等 GPU 属性 */
}
```

### 图片处理

```css
/* 深色背景上的浅色图片需要调整 */
[data-theme="dark"] .illustration {
  filter: brightness(0.8);
}
```

---

## 设计检查清单

- [ ] 背景不是纯黑
- [ ] 文本对比度满足 WCAG
- [ ] 所有组件都有暗色版本
- [ ] 颜色映射保持语义一致
- [ ] 图标/图片在深色背景下清晰
- [ ] 焦点状态可见
- [ ] 支持系统偏好自动切换

---

## 参考

- [Material Design Dark Theme](https://material.io/design/color/dark-theme.html)
- [Apple Dark Mode](https://developer.apple.com/design/human-interface-guidelines/appearance#dark-mode)
- [Ant Design Dark Mode](https://ant.design/docs/react/customize-theme-variable-cn#%E6%9A%97%E8%89%B2%E4%B8%BB%E9%A2%98)
