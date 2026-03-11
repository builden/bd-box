# 过渡模式

元素状态变化时的动画过渡效果。

---

## 定义

过渡（Transition）是元素从一种状态变化到另一种状态时的动画效果，使状态变化更平滑、自然。

---

## 时长规范

### 快速过渡（150ms）

- 状态变化：hover、focus、active
- 小元素：图标、复选框、开关
- 交互反馈：按钮点击

```css
transition: all 150ms ease-out;
```

### 标准过渡（250ms）

- 组件出现/消失：Modal、Drawer、Tooltip
- 面板展开/折叠：Collapse、Accordion
- 下拉菜单

```css
transition: all 250ms cubic-bezier(0, 0, 0.2, 1);
```

### 慢速过渡（350ms）

- 页面切换
- 大面积动画
- 需要强调的效果

```css
transition: all 350ms cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 常用过渡类型

### 透明度过渡

```css
.modal-overlay {
  opacity: 0;
}
.modal-overlay.visible {
  opacity: 1;
  transition: opacity 200ms ease-out;
}
```

### 位移过渡

```css
.tooltip {
  transform: translateY(4px);
  opacity: 0;
}
.tooltip.visible {
  transform: translateY(0);
  opacity: 1;
  transition: all 150ms ease-out;
}
```

### 缩放过渡

```css
.modal {
  transform: scale(0.95);
  opacity: 0;
}
.modal.visible {
  transform: scale(1);
  opacity: 1;
  transition: all 200ms cubic-bezier(0, 0, 0.2, 1);
}
```

### 高度过渡

```css
.collapse-content {
  height: 0;
  overflow: hidden;
}
.collapse-content.open {
  height: auto;
  transition: height 250ms ease-out;
}
```

---

## 组件过渡模式

### Modal 过渡

```
出现: opacity 0→1 (200ms) + scale 0.95→1 (200ms)
消失: opacity 1→0 (150ms) + scale 1→0.95 (150ms)
遮罩: opacity 0→1 (200ms)
```

### Drawer 过渡

```
出现: transform translateX(100%)→0 (250ms)
消失: transform translateX(0)→100% (200ms)
```

### Dropdown 过渡

```
出现: opacity 0→1 + translateY(-8px)→0 (150ms)
消失: opacity 1→0 + translateY(0)→-8px (100ms)
```

---

## 过渡属性选择

### 推荐（高性能）

- `transform`
- `opacity`
- `color`
- `background-color`

### 谨慎使用

- `width`、`height`（触发重排）
- `margin`、`padding`（触发重排）
- `top`、`left`（触发重排）

---

## 禁用过渡

### 用户偏好

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
```

---

## 常见问题

### 闪烁问题

```css
/* 添加 will-change 提示浏览器 */
.element {
  will-change: transform, opacity;
}
```

### 继承问题

```css
/* 明确指定不过渡的属性 */
.transition-all {
  transition:
    transform 150ms,
    opacity 150ms;
}
```
