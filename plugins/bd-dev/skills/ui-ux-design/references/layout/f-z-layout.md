# F/Z 形布局

利用用户阅读习惯的视觉引导布局模式。

---

## 定义

F 形布局和 Z 形布局是基于用户阅读眼动轨迹的页面布局模式，通过视觉元素的排列引导用户按照自然的阅读路径浏览内容。

---

## 为什么好

- **符合阅读习惯**：基于用户自然的眼动追踪研究
- **信息优先级**：重要内容自然获得更多关注
- **提升转化**：关键元素（CTA）放置在视觉路径上
- **无需强制**：通过视觉引导而非强迫

---

## F 形布局

### 特征

用户首先横向扫描顶部内容，然后向下移动，再横向扫描左侧内容。

```
┌─────────────────────────────────────┐
│  标题 1  ██████████████████████████ │  ← 顶部横线
│  标题 2  ████████████               │
│  标题 3  ██████████                 │
├─────────────────────────────────────┤
│                                   │
│  左侧内容                          │  ← 左侧纵线
│  左侧内容                          │
│  左侧内容                          │
│                                   │
├─────────────────────────────────────┤
│  正文内容...                        │
└─────────────────────────────────────┘
```

### 适用场景

- 搜索引擎结果页（SERP）
- 博客文章列表
- 新闻列表页
- 文档目录页

### 布局要点

```html
<!-- F 形布局示例 -->
<header>
  <h1>页面标题</h1>
  <nav>导航</nav>
</header>

<aside class="sidebar">
  <!-- 左侧边栏 -->
  <h2>分类标题</h2>
  <ul>
    <li>项目 1</li>
    <li>项目 2</li>
  </ul>
</aside>

<main>
  <!-- 主内容区 -->
  <article>正文内容...</article>
</main>
```

---

## Z 形布局

### 特征

用户从左上角开始，横向扫描到右上角，然后斜向下到左下角，再横向扫描到右下角。

```
┌─────────────────────────────────────┐
│  Logo    导航栏        登录/注册    │  ← 第一条横线
├─────────────────────────────────────┤
│                                   │
│                                   │  ← 斜线
│                                   │
├─────────────────────────────────────┤
│  CTA 按钮    内容区域    CTA 按钮   │  ← 第二条横线
└─────────────────────────────────────┘
```

### 适用场景

- Landing Page（落地页）
- 首页横幅
- 注册/登录页
- 电商促销页

### 布局要点

```html
<!-- Z 形布局示例 -->
<header class="z-header">
  <div class="logo">Logo</div>
  <nav class="nav">导航</nav>
  <div class="cta">登录</div>
</header>

<main class="z-hero">
  <div class="hero-content">
    <h1>主标题</h1>
    <p>副标题描述</p>
    <button>立即注册</button>
  </div>
  <div class="hero-image">
    <img src="hero.png" alt="Hero" />
  </div>
</main>

<footer class="z-footer">
  <div class="cta-area">更多内容</div>
</footer>
```

---

## CSS 实现

### F 形布局

```css
.f-layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}

.f-header {
  grid-column: 1 / -1;
}

.f-sidebar {
  grid-row: 2;
}

.f-content {
  grid-row: 2;
}

.f-footer {
  grid-column: 1 / -1;
}
```

### Z 形布局

```css
.z-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.z-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
}

.z-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  padding: 48px 32px;
}

.z-hero-content {
  max-width: 50%;
}

.z-hero-image {
  max-width: 50%;
}

.z-footer {
  padding: 32px;
  text-align: center;
}
```

---

## 响应式行为

### 移动端转换

F/Z 形布局在移动端会退化为单列布局：

| 桌面端    | 移动端                |
| --------- | --------------------- |
| 多列 F 形 | 单列垂直滚动          |
| 双列 Z 形 | 单列英雄区 + CTA 底部 |

```css
@media (max-width: 768px) {
  .f-layout {
    grid-template-columns: 1fr;
  }

  .z-hero {
    flex-direction: column;
    text-align: center;
  }

  .z-hero-content,
  .z-hero-image {
    max-width: 100%;
  }
}
```

---

## 使用场景对照

| 场景       | 推荐布局 |
| ---------- | -------- |
| 博客列表   | F 形     |
| 文档页面   | F 形     |
| 产品介绍   | Z 形     |
| 注册登录   | Z 形     |
| 营销落地页 | Z 形     |

---

## 禁忌

- 不要在 F/Z 形布局中放置过多干扰元素
- 不要忽视移动端用户体验
- 不要在视觉路径外放置关键操作

---

## 参考

- [NN/g F-Shaped Pattern](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/)
- [Z Pattern](https://www.optimizely.com/optimization-glossary/z-pattern/)
