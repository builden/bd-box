# 字体排版设计

文字是界面的核心，良好的字体排版提升可读性和用户体验。

---

## 字体系统

### 字体族

| 层级     | 用途     | 推荐字体                                     |
| -------- | -------- | -------------------------------------------- |
| 主字体   | 界面正文 | system-ui, -apple-system, BlinkMacSystemFont |
| 等宽字体 | 代码     | ui-monospace, SFMono-Regular, Menlo          |
| 中文     | 中文正文 | "PingFang SC", "Microsoft YaHei"             |

### 字体回退

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

---

## 字号层级

### 基础字号

| 名称 | 字号 | 行高 | 用途           |
| ---- | ---- | ---- | -------------- |
| xs   | 12px | 1.5  | 辅助文字、标签 |
| sm   | 13px | 1.5  | 次要信息       |
| base | 14px | 1.5  | 正文           |
| lg   | 16px | 1.5  | 强调文字       |
| xl   | 18px | 1.5  | 小标题         |
| 2xl  | 20px | 1.4  | 页面标题       |
| 3xl  | 24px | 1.3  | 章节标题       |
| 4xl  | 30px | 1.2  | 页面主标题     |
| 5xl  | 36px | 1.1  | Hero 标题      |

### 移动端适配

```css
/* 桌面端 */
html {
  font-size: 14px;
}

/* 移动端 */
@media (max-width: 576px) {
  html {
    font-size: 13px;
  }
}
```

---

## 行高与间距

### 行高原则

| 场景 | 行高      | 说明                 |
| ---- | --------- | -------------------- |
| 正文 | 1.5 - 1.6 | 最佳阅读体验         |
| 标题 | 1.2 - 1.4 | 紧凑视觉             |
| 代码 | 1.5       | 等宽字体需要更多空间 |

### 段落间距

```css
p {
  margin-bottom: 1em; /* 等同行高 */
}
```

---

## 字重

### 字重层级

| 名称     | 字重 | 用途           |
| -------- | ---- | -------------- |
| light    | 300  | 装饰性、弱化   |
| regular  | 400  | 正文           |
| medium   | 500  | 强调、次要标题 |
| semibold | 600  | 按钮、重要标题 |
| bold     | 700  | 标题、强调     |

### 使用建议

- 避免同时使用超过 3 种字重
- 中文字体通常不需要太多种字重
- 使用字重区分层级，而非字号

---

## 颜色与可读性

### 文本层级

| 层级 | 颜色 | 透明度 | 用途       |
| ---- | ---- | ------ | ---------- |
| 主要 | #000 | 87%    | 正文标题   |
| 次要 | #000 | 60%    | 辅助说明   |
| 禁用 | #000 | 30%    | 禁用状态   |
| 反色 | #fff | 100%   | 深色背景上 |

### 可读性标准

- 正文最小 14px（移动端 13px）
- 行长度 45-75 字符最佳
- 避免纯白背景上的纯黑文字（#000）

---

## 标题排版

### 标题层级

```css
h1 {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 0.5em;
}
h2 {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.3;
  margin-bottom: 0.5em;
}
h3 {
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 0.5em;
}
h4 {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 0.5em;
}
```

### 避免

- 不要用相同字号区分标题层级
- 不要跳过标题层级（h1 直接跳 h3）
- 不要全大写正文（除特殊场景）

---

## 代码字体

### 等宽字体栈

```css
code,
pre {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 0.9em;
}
```

### 行内代码

```css
code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.9em;
}
```

---

## 响应式排版

### 流体排版

```css
/* 使用 clamp 实现流体字号 */
h1 {
  font-size: clamp(1.5rem, 5vw, 3rem);
}

p {
  font-size: clamp(0.875rem, 2vw, 1rem);
}
```

### 断点调整

```css
/* 桌面 */
html {
  font-size: 14px;
}

/* 平板 */
@media (max-width: 992px) {
  html {
    font-size: 13.5px;
  }
}

/* 手机 */
@media (max-width: 576px) {
  html {
    font-size: 13px;
  }
}
```

---

## 可访问性

### 最小字号

- 正文不少于 16px（或 CSS 像素）
- 移动端不低于 13px

### 行高要求

- 行高不低于 1.2
- 段落间距不小于 0.5em

### 对比度

- 正文与背景对比度至少 4.5:1
- 大文本（18px+ 或 14px+ 粗体）至少 3:1

---

## 国际化

### 中文排版

```css
/* 中文最佳实践 */
body {
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### 字体渲染

```css
/* 优化字体渲染 */
body {
  text-rendering: optimizeLegibility;
  font-feature-settings: "liga" 1; /* 连字符 */
}
```

---

## 参考

- [Tailwind Typography](https://tailwindcss.com/docs/typography-plugin)
- [Material Design Typography](https://material.io/design/typography/the-type-system.html)
- [Web Typography](https://webtypography.net/)
