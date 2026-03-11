# 圣杯布局

固定 Header/Footer + 左中右三栏的经典布局。

---

## 定义

圣杯布局（Holy Grail Layout）是 Web 开发中最经典的布局之一，特点是头部和底部固定高度，中间区域分为左、中、右三栏。

---

## 结构

```
┌─────────────────────────────────────────────────┐
│                     Header                       │
│                    (60px)                       │
├────────┬────────────────────────┬───────────────┤
│        │                        │               │
│  Left  │        Main            │    Right      │
│ Sidebar│       Content          │   Sidebar     │
│ (200px)│        (flex)         │   (280px)     │
│        │                        │               │
├────────┴────────────────────────┴───────────────┤
│                     Footer                       │
│                    (60px)                       │
└─────────────────────────────────────────────────┘
```

---

## 适用场景

- 复杂管理后台
- 企业门户
- 论坛系统
- 电商管理后台

---

## 实现方式

### Flexbox

```css
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header,
.footer {
  height: 60px;
  flex-shrink: 0;
}

.middle {
  flex: 1;
  display: flex;
}

.left {
  width: 200px;
}
.main {
  flex: 1;
}
.right {
  width: 280px;
}
```

### Grid

```css
.container {
  display: grid;
  grid-template-areas:
    "header header header"
    "left main right"
    "footer footer footer";
  grid-template-rows: 60px 1fr 60px;
  grid-template-columns: 200px 1fr 280px;
  min-height: 100vh;
}
```

---

## 响应式行为

| 屏幕宽度  | 布局                           |
| --------- | ------------------------------ |
| < 576px   | 单栏，Header → Footer 垂直排列 |
| 576-992px | 双栏，左侧 + 主内容            |
| ≥ 992px   | 完整圣杯布局                   |

---

## 注意事项

### 内容区域滚动

```css
.middle {
  overflow: auto; /* 主内容区域可滚动 */
}
```

### 固定头部

```css
.header {
  position: sticky;
  top: 0;
  z-index: 100;
}
```

---

## 禁忌

- ❌ 简单页面无需使用
- ❌ 移动端优先的项目
- ❌ 左侧栏内容简单不需要独立区域
