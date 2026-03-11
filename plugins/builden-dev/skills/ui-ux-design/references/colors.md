# 颜色设计模式

定义产品的色彩系统，确保视觉一致性和可访问性。

---

## 色彩体系

### 主色（Primary）

主色是产品的核心品牌色，用于主要操作按钮、链接、选中状态等。

| 名称             | 用途           | 十六进制 |
| ---------------- | -------------- | -------- |
| Primary          | 主按钮、主链接 | #1677ff  |
| Primary Hover    | 主按钮悬停     | #4096ff  |
| Primary Active   | 主按钮按下     | #0958d9  |
| Primary Disabled | 主按钮禁用     | #a0cfff  |

### 中性色（Neutral）

中性色用于文本、背景、边框等，构成界面的基础色调。

| 名称           | 用途     | 十六进制  |
| -------------- | -------- | --------- |
| Text Primary   | 主要文本 | #000000e0 |
| Text Secondary | 次要文本 | #00000073 |
| Text Tertiary  | 弱化文本 | #00000045 |
| Text Disabled  | 禁用文本 | #00000025 |
| Border         | 边框     | #d9d9d9   |
| Border Hover   | 边框悬停 | #4096ff   |
| Fill           | 填充     | #ffffff   |
| Fill Secondary | 次要填充 | #f5f5f5   |
| Fill Tertiary  | 弱化填充 | #f0f0f0   |
| Bg Layout      | 页面背景 | #f5f5f5   |
| Bg Container   | 容器背景 | #ffffff   |

### 功能色（Functional）

功能色用于传达特定语义：成功、警告、错误、信息。

| 类型    | 名称 | 用途     | 十六进制 |
| ------- | ---- | -------- | -------- |
| Success | 成功 | 操作成功 | #52c41a  |
| Warning | 警告 | 需要注意 | #faad14  |
| Error   | 错误 | 操作失败 | #ff4d4f  |
| Info    | 信息 | 通知提示 | #1890ff  |

---

## 语义用色

### 文本颜色

```css
/* 主要文本 - 用于标题、重要内容 */
.text-primary {
  color: #000000e0;
}

/* 次要文本 - 用于正文、描述 */
.text-secondary {
  color: #00000073;
}

/* 弱化文本 - 用于提示、占位 */
.text-tertiary {
  color: #00000045;
}

/* 禁用文本 */
.text-disabled {
  color: #00000025;
}

/* 链接文本 */
.text-link {
  color: #1677ff;
}
```

### 背景颜色

```css
/* 页面背景 */
.bg-page {
  background: #f5f5f5;
}

/* 卡片背景 */
.bg-card {
  background: #ffffff;
}

/* 悬停背景 */
.bg-hover {
  background: #f5f5f5;
}

/* 选中背景 */
.bg-selected {
  background: #e6f4ff;
}

/* 禁用背景 */
.bg-disabled {
  background: #f5f5f5;
}
```

### 边框颜色

```css
/* 默认边框 */
.border {
  border-color: #d9d9d9;
}

/* 悬停边框 */
.border-hover {
  border-color: #4096ff;
}

/* 聚焦边框 */
.border-focus {
  border-color: #1677ff;
}

/* 错误边框 */
.border-error {
  border-color: #ff4d4f;
}
```

---

## 可访问性

### 对比度要求

| 场景            | 最小对比度 | 适用       |
| --------------- | ---------- | ---------- |
| 大文本（≥18px） | 3:1        | 标题       |
| 小文本（<18px） | 4.5:1      | 正文       |
| UI 组件         | 3:1        | 按钮、图标 |
| 装饰性文本      | 无要求     | 禁用状态   |

### 实现方式

```css
/* 确保文字在背景上有足够对比度 */
.text-on-primary {
  color: #ffffff; /* 在主色背景上使用白色文字 */
}

.text-on-dark {
  color: #ffffff; /* 在深色背景上使用白色文字 */
}

/* 检测用户偏好 */
@media (prefers-contrast: more) {
  /* 高对比度模式 */
}
```

---

## 色彩工具

### 生成调色板

```javascript
// 使用 HSL 生成同色系不同亮度
function generatePalette(baseHue, saturation) {
  return {
    1: `hsl(${baseHue}, ${saturation}%, 95%)`, // 极浅
    2: `hsl(${baseHue}, ${saturation}%, 90%)`, // 浅
    3: `hsl(${baseHue}, ${saturation}%, 80%)`, // 次浅
    4: `hsl(${baseHue}, ${saturation}%, 70%)`, // 中浅
    5: `hsl(${baseHue}, ${saturation}%, 60%)`, // 中
    6: `hsl(${baseHue}, ${saturation}%, 50%)`, // 主色
    7: `hsl(${baseHue}, ${saturation}%, 40%)`, // 深
    8: `hsl(${baseHue}, ${saturation}%, 30%)`, // 次深
    9: `hsl(${baseHue}, ${saturation}%, 20%)`, // 深
    10: `hsl(${baseHue}, ${saturation}%, 10%)`, // 极深
  };
}
```

---

## 参考

- [Ant Design 色彩系统](https://ant.design/docs/spec/colors-cn)
- [Material Design 色彩](https://material.io/design/color/)
- [WCAG 对比度标准](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
