# 移动端设计模式

针对移动设备的 UI 设计规范和模式。

---

## 触摸交互

### 触摸目标尺寸

**最小触摸目标**：44x44 像素（Apple HIG）或 48x48dp（Material Design）

```css
/* 最小触摸区域 */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### 触摸区域扩展

对于小图标，增加触摸区域：

```css
.icon-button {
  position: relative;
  width: 44px;
  height: 44px;
}

.icon-button::before {
  content: "";
  position: absolute;
  top: -10px;
  bottom: -10px;
  left: -10px;
  right: -10px;
}
```

---

## 手势设计

### 常用手势

| 手势     | 动作       | 场景           |
| -------- | ---------- | -------------- |
| 点击     | 选择/确认  | 按钮、列表项   |
| 长按     | 上下文菜单 | 消息、文件     |
| 滑动     | 快捷操作   | 列表删除、收藏 |
| 拖拽     | 排序/移动  | 列表排序       |
| 捏合     | 缩放       | 图片、地图     |
| 双指滑动 | 滚动       | 长内容         |

### 手势冲突

避免与系统手势冲突：

```css
/* 避免覆盖系统手势区域 */
body {
  overscroll-behavior: none;
}

/* 允许下拉刷新 */
.scroll-container {
  overscroll-behavior-y: contain;
}
```

---

## 导航模式

### 底部导航

适用于 3-5 个主要入口：

```html
<nav class="bottom-nav">
  <a href="/" class="nav-item active">
    <svg>首页</svg>
    <span>首页</span>
  </a>
  <a href="/discover" class="nav-item">
    <svg>发现</svg>
    <span>发现</span>
  </a>
  <a href="/message" class="nav-item">
    <svg>消息</svg>
    <span>消息</span>
  </a>
  <a href="/profile" class="nav-item">
    <svg>我的</svg>
    <span>我的</span>
  </a>
</nav>
```

```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  height: 50px;
  background: #fff;
  border-top: 1px solid #eee;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.nav-item.active {
  color: #1677ff;
}
```

### 标签导航

适用于多于 5 个入口或需要显示标题：

```html
<div class="tab-bar">
  <button class="tab active">推荐</button>
  <button class="tab">热点</button>
  <button class="tab">科技</button>
  <button class="tab">游戏</button>
</div>
```

---

## 列表设计

### 下拉刷新

```javascript
// 下拉刷新示例
const onRefresh = async () => {
  setRefreshing(true);
  await fetchData();
  setRefreshing(false);
};
```

### 加载更多

```javascript
// 触底加载
const onReachBottom = () => {
  if (hasMore && !loading) {
    loadMore();
  }
};
```

### 滑动操作

```css
.swipe-action {
  display: flex;
}

.swipe-content {
  flex: 1;
}

.swipe-actions {
  display: flex;
  opacity: 0;
  transition: opacity 0.2s;
}

.swipe-item:active .swipe-actions {
  opacity: 1;
}
```

---

## 表单设计

### 虚拟键盘适配

```css
/* 输入框在键盘弹出时不被遮挡 */
.input-wrapper {
  position: relative;
  z-index: 1;
}

/* 键盘弹出时页面滚动 */
@media (max-height: 450px) {
  .form-container {
    padding-bottom: 300px;
  }
}
```

### 自动填充

```html
<!-- 正确使用 autocomplete -->
<input type="email" autocomplete="email" />
<input type="tel" autocomplete="tel" />
<input type="name" autocomplete="name" />
```

---

## 布局适配

### 安全区域

```css
/* 适配刘海屏 */
.safe-area-top {
  padding-top: env(safe-area-inset-top);
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

### 视口单位

```css
/* 使用视口单位 */
.hero {
  height: 50vh;
}

.card-list {
  gap: 2vw;
}
```

---

## 性能优化

### 列表性能

```javascript
// 使用虚拟列表
const VirtualList = ({ data }) => {
  return <RecycleScroller items={data} itemSize={80} renderItem={Item} />;
};
```

### 图片优化

```css
/* 图片响应式 */
img {
  max-width: 100%;
  height: auto;
  display: block;
}

/* 懒加载 */
img[loading="lazy"] {
  loading: lazy;
}
```

---

## 断点设置

### 移动端断点

| 断点 | 宽度    | 布局     |
| ---- | ------- | -------- |
| xs   | < 375px | 紧凑单列 |
| sm   | ≥ 375px | 标准单列 |
| md   | ≥ 414px | 宽松单列 |

### 响应式策略

```css
/* 基础移动端优先 */
.container {
  padding: 16px;
}

/* 平板及以上 */
@media (min-width: 768px) {
  .container {
    padding: 24px;
    max-width: 720px;
    margin: 0 auto;
  }
}

/* 桌面 */
@media (min-width: 1024px) {
  .container {
    max-width: 960px;
  }
}
```

---

## 可访问性

### 触摸目标

- 最小 44x44 像素
- 间距足够（至少 8px）

### 文字

- 正文字号不小于 16px（或 CSS 像素 13px）
- 行高 1.5

### 颜色对比

- 文本对比度至少 4.5:1
- 大文本（18px+ 或 14px+ 粗体）至少 3:1

---

## 常见问题

### Q: 移动端需要 hover 效果吗？

**不需要**。hover 是鼠标悬停概念，移动端用 touch 代替。

### Q: 点击延迟怎么解决？

```css
/* 移除点击延迟 */
touch-action: manipulation;
```

### Q: 300ms 点击延迟？

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

---

## 参考

- [Apple Human Interface Guidelines - iOS](https://developer.apple.com/design/human-interface-guidelines/ios/)
- [Material Design - Touch](https://material.io/design/responsiveness/touch-accessibility.html)
