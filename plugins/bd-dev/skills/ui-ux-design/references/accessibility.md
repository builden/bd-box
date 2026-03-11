# 可访问性设计

确保产品对所有用户可访问，包括残障用户。

---

## 原则

### WCAG 核心原则

| 原则       | 说明                                                   |
| ---------- | ------------------------------------------------------ |
| **可感知** | 信息和界面组件必须以可感知的方式呈现给用户             |
| **可操作** | 用户界面组件和导航必须是可操作的                       |
| **可理解** | 信息和用户界面的操作必须是可理解的                     |
| **健壮**   | 内容必须足够健壮，可被各种用户代理（包括辅助技术）解释 |

---

## 视觉可访问性

### 对比度

文本与背景的对比度要求：

| 级别     | 对比度 | 适用场景                    |
| -------- | ------ | --------------------------- |
| AAA      | 7:1    | 重要文本、按钮文字          |
| AA       | 4.5:1  | 正常文本（<18px）           |
| AA Large | 3:1    | 大文本（≥18px 或粗体≥14px） |
| UI 组件  | 3:1    | 边框、图标、图形元素        |

```css
/* 确保足够的对比度 */
.text-primary {
  color: #000000e0; /* 87% 不透明度，对比度约 15:1 */
}

.text-secondary {
  color: #00000073; /* 45% 不透明度，对比度约 4.5:1 */
}
```

### 颜色非唯一性

不能仅依靠颜色传达信息：

```css
/* ❌ 错误：仅靠颜色区分 */
.status-success {
  color: green;
}
.status-error {
  color: red;
}

/* ✓ 正确：颜色 + 图标/文字 */
.status-success {
  color: #52c41a;
  &::before {
    content: "✓ ";
  }
}
.status-error {
  color: #ff4d4f;
  &::before {
    content: "✕ ";
  }
}
```

---

## 键盘可访问性

### 焦点可见

所有可交互元素必须可通过键盘聚焦：

```css
/* 焦点样式 */
:focus-visible {
  outline: 2px solid #1677ff;
  outline-offset: 2px;
}

/* 移除默认聚焦样式后必须自定义 */
button:focus-visible {
  outline: 2px solid #1677ff;
}
```

### 焦点顺序

- 焦点顺序应符合逻辑阅读顺序
- 使用 `tabindex` 调整焦点顺序（谨慎使用）

```html
<!-- 逻辑顺序 -->
<nav>
  <a href="/">首页</a>
  <a href="/about">关于</a>
  <a href="/contact">联系</a>
</nav>

<!-- 跳过链接 -->
<a href="#main" class="skip-link">跳到主要内容</a>
<style>
  .skip-link {
    position: absolute;
    top: -40px;
    left: 0;
  }
  .skip-link:focus {
    top: 0;
  }
</style>
```

### 键盘操作

确保所有功能可通过键盘完成：

| 操作          | 按键          |
| ------------- | ------------- |
| 聚焦下一个    | Tab           |
| 聚焦上一个    | Shift + Tab   |
| 激活按钮/链接 | Enter         |
| 展开/收起     | Space / Enter |
| 关闭弹窗      | Escape        |

---

## 屏幕阅读器支持

### ARIA 角色

```html
<!-- 导航 -->
<nav role="navigation" aria-label="主导航">
  <ul>
    ...
  </ul>
</nav>

<!-- 对话框 -->
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">标题</h2>
</div>

<!-- 状态提示 -->
<div role="status" aria-live="polite">操作成功</div>
```

### ARIA 属性

```html
<!-- 描述关联 -->
<input aria-describedby="password-hint" />
<p id="password-hint">密码至少8位</p>

<!-- 必填 -->
<input aria-required="true" />

<!-- 无效 -->
<input aria-invalid="true" />

<!-- 展开状态 -->
<button aria-expanded="false" aria-controls="menu">菜单</button>
<div id="menu" hidden>...</div>
```

### 标签

```html
<!-- 显式标签 -->
<label for="name">姓名</label>
<input id="name" />

<!-- 隐式标签 -->
<label>
  姓名
  <input />
</label>

<!-- aria-label -->
<button aria-label="关闭">
  <Icon Close />
</button>
```

---

## 运动感知

### 减少动画

尊重用户对减少动画的偏好：

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### JavaScript 检测

```javascript
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (prefersReducedMotion) {
  // 使用淡入淡出替代动画
}
```

---

## 表单可访问性

### 标签关联

```html
<!-- 正确关联 -->
<label for="email">邮箱地址</label>
<input type="email" id="email" required />

<!-- 错误：缺少关联 -->
<span>邮箱地址</span>
<input type="email" />
```

### 错误提示

```html
<input aria-invalid="true" aria-describedby="email-error" />
<p id="email-error" role="alert">请输入有效的邮箱地址</p>
```

### 必填标记

```html
<label for="name">
  姓名
  <span aria-hidden="true">*</span>
  <span class="sr-only">（必填）</span>
</label>
```

---

## 图像可访问性

### 替代文本

```html
<!-- 有意义的图像 -->
<img src="logo.png" alt="公司 logo" />

<!-- 装饰图像 -->
<img src="divider.png" alt="" />

<!-- 复杂图像 -->
<img src="chart.png" alt="销售趋势图，2024年增长50%" />
```

### SVG 可访问性

```html
<svg role="img" aria-label="下载图标">
  <title>下载</title>
  <path d="..." />
</svg>
```

---

## 测试工具

### 自动检测

- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/accessibility/)
- [WAVE](https://wave.webaim.org/)

### 手动检测

1. **仅用键盘**：能否完成所有操作？
2. **屏幕阅读器**：能否正确理解内容？
3. **缩放**：200% 缩放是否正常？

---

## 参考

- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/)
- [MDN 可访问性](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Ant Design 可访问性](https://ant.design/components/form/#Accessibility)
