# Card - 卡片

用于承载内容、图像或操作的容器组件。

---

## 定义

Card 是一个矩形容器组件，用于展示一组相关的信息。它通常包含标题、内容区域和可选的操作区域，提供视觉上的分组和层次。

---

## 为什么好

- **内容分组**：将相关信息视觉上聚合
- **可点击性**：可以整个卡片作为交互入口
- **灵活性**：可包含图片、标题、描述、操作
- **响应式**：易于实现网格布局

---

## 适用场景

- 商品展示
- 文章列表
- 用户/项目卡片
- 仪表盘 widget
- 操作面板

---

## 禁忌

- 不要用于需要大量文本的场景
- 避免卡片内嵌套过多层级
- 不要在卡片内放置主要导航

---

## 结构

```
┌─────────────────────────┐
│      Card Header       │  ← 标题、操作
├─────────────────────────┤
│                        │
│      Card Body         │  ← 主要内容
│                        │
├─────────────────────────┤
│      Card Footer       │  ← 底部操作
└─────────────────────────┘
```

---

## 变体

| 类型      | 说明     |
| --------- | -------- |
| Default   | 默认卡片 |
| Bordered  | 带边框   |
| Hoverable | 悬停效果 |
| Cover     | 带封面图 |

---

## 状态定义

| 状态     | 说明     |
| -------- | -------- |
| Default  | 默认状态 |
| Hover    | 鼠标悬停 |
| Loading  | 加载中   |
| Selected | 选中状态 |

---

## 交互规范

### 悬停效果

```css
.card-hoverable:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
  transition: all 200ms ease-out;
  cursor: pointer;
}
```

### 加载状态

```css
.card-loading {
  pointer-events: none;
}

.card-loading .card-body {
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

## 可访问性

```html
<!-- 可点击的卡片 -->
<article class="card" tabindex="0" role="button">
  <h3 class="card-title">文章标题</h3>
  <p class="card-description">文章描述...</p>
</article>

<!-- 包含链接的卡片 -->
<article class="card">
  <img src="cover.jpg" alt="封面图" class="card-cover" />
  <div class="card-body">
    <h3>项目名称</h3>
    <a href="/project/1" aria-label="查看项目详情">查看详情</a>
  </div>
</article>
```

- 可点击的卡片使用 `tabindex="0"` 使其可聚焦
- 链接使用 `aria-label` 提供明确描述

---

## CSS 实现

```css
.card {
  background: #fff;
  border-radius: 8px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.12),
    0 1px 2px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  transition:
    box-shadow 200ms ease-out,
    transform 200ms ease-out;
}

.card-bordered {
  border: 1px solid #f0f0f0;
}

.card-hoverable:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.card-header {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.card-body {
  padding: 24px;
}

.card-footer {
  padding: 12px 24px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.card-cover {
  width: 100%;
  display: block;
}
```

---

## 网格布局

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}
```

---

## 参考

- [Ant Design Card](https://ant.design/components/card/)
