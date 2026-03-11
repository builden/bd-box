# Design Tokens 设计

Design Tokens（设计变量）是设计系统的基础原子值，统一管理颜色、间距、字体等视觉属性。

---

## 什么是 Design Tokens

Design Tokens 是设计系统中的"原子"——不可再分的最小设计决策单元。它们是：

- **语义化命名**：描述用途而非值本身
- **技术无关**：同一套 tokens 可用于 CSS、React、Flutter 等
- **主题化基础**：通过 tokens 实现主题切换

---

## Token 分类

### 1. 颜色 Tokens

```css
:root {
  /* 主色 */
  --color-primary-500: #1677ff;
  --color-primary-600: #1456cc;
  --color-primary-400: #4096ff;

  /* 中性色 */
  --color-gray-50: #fafafa;
  --color-gray-100: #f5f5f5;
  --color-gray-200: #e8e8e8;
  --color-gray-300: #d9d9d9;
  --color-gray-400: #bfbfbf;
  --color-gray-500: #8c8c8c;
  --color-gray-600: #595959;
  --color-gray-700: #434343;
  --color-gray-800: #262626;
  --color-gray-900: #141414;

  /* 功能色 */
  --color-success: #52c41a;
  --color-warning: #faad14;
  --color-error: #ff4d4f;
  --color-info: #1890ff;
}
```

### 2. 间距 Tokens

```css
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;
  --spacing-2xl: 32px;
  --spacing-3xl: 48px;
  --spacing-4xl: 64px;
}
```

### 3. 字号 Tokens

```css
:root {
  --font-size-xs: 12px;
  --font-size-sm: 13px;
  --font-size-base: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 18px;
  --font-size-2xl: 20px;
  --font-size-3xl: 24px;
  --font-size-4xl: 30px;
  --font-size-5xl: 36px;
}
```

### 4. 圆角 Tokens

```css
:root {
  --radius-none: 0;
  --radius-sm: 2px;
  --radius-base: 4px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-2xl: 16px;
  --radius-full: 9999px;
}
```

### 5. 阴影 Tokens

```css
:root {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-base: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
}
```

### 6. z-index Tokens

```css
:root {
  --z-index-dropdown: 1000;
  --z-index-sticky: 1020;
  --z-index-fixed: 1030;
  --z-index-modal-backdrop: 1040;
  --z-index-modal: 1050;
  --z-index-popover: 1060;
  --z-index-tooltip: 1070;
}
```

---

## 语义化 Tokens

在基础 tokens 之上创建语义化 tokens：

```css
:root {
  /* 文本颜色 */
  --text-primary: var(--color-gray-900);
  --text-secondary: var(--color-gray-600);
  --text-tertiary: var(--color-gray-400);
  --text-disabled: var(--color-gray-300);

  /* 背景颜色 */
  --bg-primary: #ffffff;
  --bg-secondary: var(--color-gray-50);
  --bg-tertiary: var(--color-gray-100);

  /* 边框颜色 */
  --border-color: var(--color-gray-200);
  --border-color-hover: var(--color-gray-300);

  /* 组件特定 */
  --color-btn-primary-bg: var(--color-primary-500);
  --color-btn-primary-text: #ffffff;
  --color-input-bg: #ffffff;
  --color-input-border: var(--color-gray-300);
}
```

---

## 主题化

### 暗色主题

```css
[data-theme="dark"] {
  /* 覆盖语义化 tokens */
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-tertiary: rgba(255, 255, 255, 0.4);

  --bg-primary: #141414;
  --bg-secondary: #1f1f1f;
  --bg-tertiary: #262626;

  --border-color: #424242;
  --border-color-hover: #5c5c5c;

  --color-primary-500: #4096ff;
  --color-success: #95de64;
  --color-warning: #ffd666;
  --color-error: #ff7875;
}
```

---

## 使用方式

### CSS 中使用

```css
.button {
  background: var(--color-btn-primary-bg);
  color: var(--color-btn-primary-text);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-base);
}
```

### JavaScript 中使用

```javascript
// 通过 CSS 变量获取
const styles = getComputedStyle(document.documentElement);
const primaryColor = styles.getPropertyValue("--color-primary-500").trim();

// 或使用 CSS-in-JS 库
const theme = {
  colors: {
    primary: "var(--color-primary-500)",
  },
};
```

---

## Token 命名规范

### 命名结构

```
{category}-{semantic}-{grade}
```

| 部分     | 说明 | 示例                   |
| -------- | ---- | ---------------------- |
| category | 类别 | color, spacing, font   |
| semantic | 语义 | primary, surface, text |
| grade    | 级别 | 50-900, sm-lg          |

### 示例

- `color-primary-500` - 主色
- `color-surface-elevated` - 浮层背景
- `spacing-inline-md` - 内联间距

---

## 工具链

### Token 转换

```javascript
// style-dictionary 配置示例
{
  "color": {
    "primary": {
      "value": "#1677ff"
    }
  }
}
```

### 工具推荐

- **Style Dictionary** - Token 转换工具
- **Tokens Studio** - Figma Token 插件
- **Rainbow Palette** - 颜色生成

---

## 最佳实践

1. **分层结构**：基础 tokens → 语义 tokens → 组件 tokens
2. **命名语义化**：描述用途而非值
3. **避免硬编码**：始终使用 tokens
4. **文档化**：每个 token 都有明确用途
5. **版本控制**：Tokens 变更需要版本管理

---

## 参考

- [Design Tokens W3C Community Group](https://designtokens.org/)
- [Style Dictionary](https://amzn.github.io/style-dictionary/)
- [Tokenize](https://www.wearecube.co/cube-ui)
