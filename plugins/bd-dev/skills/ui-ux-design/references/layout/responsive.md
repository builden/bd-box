# 响应式断点

定义不同设备的屏幕尺寸阈值。

---

## 断点定义

### 常用断点（参考 Bootstrap / Ant Design）

| 断点 | 屏幕宽度 | 典型设备          | 命名              |
| ---- | -------- | ----------------- | ----------------- |
| xs   | < 576px  | 手机竖屏          | Extra Small       |
| sm   | ≥ 576px  | 手机横屏 / 大手机 | Small             |
| md   | ≥ 768px  | 平板              | Medium            |
| lg   | ≥ 992px  | 小笔记本          | Large             |
| xl   | ≥ 1200px | 桌面显示器        | Extra Large       |
| xxl  | ≥ 1400px | 大屏桌面          | Extra Extra Large |

### Apple 设备断点

| 设备              | 宽度范围 |
| ----------------- | -------- |
| iPhone SE         | 320px    |
| iPhone 12/13/14   | 390px    |
| iPhone 14 Pro Max | 430px    |
| iPad Mini         | 744px    |
| iPad / iPad Air   | 768px    |
| iPad Pro 11"      | 834px    |
| iPad Pro 12.9"    | 1024px   |
| MacBook Air 13"   | 1280px   |
| MacBook Pro 16"   | 1728px   |

---

## CSS 实现

### 断点 Mixin

```scss
$breakpoints: (
  xs: 576px,
  sm: 768px,
  md: 992px,
  lg: 1200px,
  xl: 1400px,
);

@mixin respond-to($breakpoint) {
  $width: map-get($breakpoints, $breakpoint);
  @media (min-width: $width) {
    @content;
  }
}

// 使用
@include respond-to(md) {
  // >= 768px
}
```

### 移动优先 vs 桌面优先

**移动优先**（推荐）：

```css
/* 默认：移动端样式 */
.col {
  width: 100%;
}

/* sm 及以上 */
@media (min-width: 576px) {
  .col {
    width: 50%;
  }
}

/* md 及以上 */
@media (min-width: 768px) {
  .col {
    width: 33.33%;
  }
}
```

**桌面优先**：

```css
/* 默认：桌面端样式 */
.col {
  width: 25%;
}

/* md 及以下 */
@media (max-width: 991px) {
  .col {
    width: 33.33%;
  }
}

/* sm 及以下 */
@media (max-width: 767px) {
  .col {
    width: 50%;
  }
}

/* xs 及以下 */
@media (max-width: 575px) {
  .col {
    width: 100%;
  }
}
```

---

## 断点选择策略

### 按内容选择

- **内容自然断点**：根据内容何时"感觉不对"来设置断点
- **不依赖特定设备**：因为设备尺寸会变化

### 常用策略

1. **移动优先**：先为小屏设计，逐步增强
2. **避免过多断点**：通常 3-5 个断点足够
3. **考虑未来**：留有扩展余地

---

## 设计原则

### 移动优先的优势

1. 强制优先处理核心内容
2. 性能更好（避免加载不必要的资源）
3. 代码更简洁

### 响应式内容

- 文字流式布局，自动换行
- 图片使用 `max-width: 100%`
- 间距使用相对单位（rem / em / %）

---

## 常见问题

### 内容压缩

当屏幕变窄时，内容不应被过度压缩：

```css
.element {
  min-width: 300px;
  max-width: 100%;
}
```

### 触摸目标

移动端触摸目标至少 44×44px：

```css
.button {
  min-height: 44px;
  min-width: 44px;
}
```

---

## 参考

- [Ant Design 响应式断点](https://ant.design/components/grid/#Responsive-props)
- [Bootstrap 断点](https://getbootstrap.com/docs/5.0/layout/breakpoints/)
- [MDN 响应式设计](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout/Responsive_flexboxes)
