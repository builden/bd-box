# 间距系统

定义产品的空间尺寸系统，确保界面的一致性和节奏感。

---

## 间距基准

### 基础间距

使用 4px 或 8px 作为基准倍数，保持间距的一致性。

| 名称 | 数值 | 用途                     |
| ---- | ---- | ------------------------ |
| xxs  | 4px  | 紧凑元素间               |
| xs   | 8px  | 标签与输入框、图标与文字 |
| sm   | 12px | 卡片内元素间距           |
| md   | 16px | 组件内间距、列表项间距   |
| lg   | 24px | 区块间距                 |
| xl   | 32px | 区块间大间距             |
| xxl  | 48px | 页面分区                 |
| xxxl | 64px | 大分区、主要内容间       |

---

## 组件尺寸

### 按钮

| 尺寸    | 高度 | 字号 | 内边距 |
| ------- | ---- | ---- | ------ |
| Small   | 24px | 12px | 0 8px  |
| Default | 32px | 14px | 0 16px |
| Large   | 40px | 16px | 0 24px |

### 输入框

| 尺寸    | 高度 | 字号 | 内边距 |
| ------- | ---- | ---- | ------ |
| Small   | 24px | 12px | 0 8px  |
| Default | 32px | 14px | 0 12px |
| Large   | 40px | 16px | 0 16px |

### 标签

| 尺寸    | 高度 | 字号 | 内边距 |
| ------- | ---- | ---- | ------ |
| Small   | 20px | 12px | 0 6px  |
| Default | 24px | 14px | 0 10px |
| Large   | 28px | 16px | 0 14px |

---

## Padding

### 组件内边距

```css
/* 紧凑 */
.padding-sm {
  padding: 8px;
}

/* 默认 */
.padding-md {
  padding: 16px;
}

/* 宽松 */
.padding-lg {
  padding: 24px;
}

/* 卡片 */
.card {
  padding: 24px;
}

/* 模态框 */
.modal-body {
  padding: 24px;
}
```

### 响应式内边距

```css
.container {
  padding: 16px;
}

@media (min-width: 768px) {
  .container {
    padding: 24px;
  }
}

@media (min-width: 1200px) {
  .container {
    padding: 32px;
  }
}
```

---

## Margin

### 外边距

```css
/* 垂直间距 */
.mt-sm {
  margin-top: 8px;
}
.mt-md {
  margin-top: 16px;
}
.mt-lg {
  margin-top: 24px;
}

.mb-sm {
  margin-bottom: 8px;
}
.mb-md {
  margin-bottom: 16px;
}
.mb-lg {
  margin-bottom: 24px;
}

/* 水平间距 */
.ml-sm {
  margin-left: 8px;
}
.ml-md {
  margin-left: 16px;
}

.mr-sm {
  margin-right: 8px;
}
.mr-md {
  margin-right: 16px;
}
```

### 区块间距

```css
/* 区块间大间距 */
.section {
  margin-bottom: 48px;
}

/* 列表项间距 */
.list-item {
  margin-bottom: 12px;
}

/* 表单元素间距 */
.form-item {
  margin-bottom: 16px;
}
```

---

## Gap

### Flex 间距

```css
/* 网格间距 */
.flex-gap-sm {
  gap: 8px;
}
.flex-gap-md {
  gap: 16px;
}
.flex-gap-lg {
  gap: 24px;
}

/* 行内间距 */
.inline-flex-gap-sm {
  gap: 8px;
}
.inline-flex-gap-md {
  gap: 12px;
}
```

### Grid 间距

```css
.grid {
  display: grid;
  gap: 16px;
}

.grid-gap-sm {
  gap: 8px;
}
.grid-gap-md {
  gap: 16px;
}
.grid-gap-lg {
  gap: 24px;
}
```

---

## 圆角

### 基础圆角

| 名称    | 数值   | 用途           |
| ------- | ------ | -------------- |
| none    | 0      | 无圆角         |
| sm      | 2px    | 标签、小按钮   |
| default | 4px    | 输入框、按钮   |
| lg      | 8px    | 卡片、Modal    |
| xl      | 12px   | 大卡片、浮层   |
| full    | 9999px | 圆形、胶囊按钮 |

### 使用场景

```css
/* 按钮 */
.btn {
  border-radius: 4px;
}
.btn-sm {
  border-radius: 2px;
}
.btn-lg {
  border-radius: 8px;
}
.btn-circle {
  border-radius: 9999px;
}

/* 输入框 */
.input {
  border-radius: 4px;
}

/* 卡片 */
.card {
  border-radius: 8px;
}

/* 模态框 */
.modal {
  border-radius: 12px;
}

/* 标签 */
.tag {
  border-radius: 2px;
}

/* 头像 */
.avatar {
  border-radius: 50%;
}
```

---

## 字体大小

### 字体系统

| 名称 | 字号 | 行高 | 用途           |
| ---- | ---- | ---- | -------------- |
| xs   | 12px | 1.5  | 辅助文字、标签 |
| sm   | 14px | 1.5  | 正文、次要信息 |
| base | 14px | 1.5  | 默认字体       |
| lg   | 16px | 1.5  | 小标题         |
| xl   | 20px | 1.4  | 页面标题       |
| 2xl  | 24px | 1.3  | 大标题         |
| 3xl  | 30px | 1.2  | 页面主标题     |
| 4xl  | 38px | 1.2  | Hero 标题      |

### 移动端调整

```css
html {
  font-size: 14px;
}

@media (max-width: 576px) {
  html {
    font-size: 13px;
  }
}
```

---

## 留白原则

### 视觉呼吸感

- **内紧外松**：组件内部紧凑，组件之间宽松
- **层次分明**：不同级别的内容使用不同的间距
- **节奏一致**：相邻元素使用相同间距倍数

### 亲密性原则

```css
/* 标签和输入框靠近 */
.form-label + .form-input {
  margin-top: 4px;
}

/* 相关按钮放在一起 */
.btn-group .btn + .btn {
  margin-left: 8px;
}

/* 标题和内容靠近 */
.section-title {
  margin-bottom: 8px;
}
.section-content {
  /* 内容 */
}
.section-actions {
  margin-top: 16px; /* 与内容分开 */
}
```

---

## 响应式间距

```css
/* 移动端优先 */
.spacing {
  margin: 16px;
  padding: 12px;
}

@media (min-width: 768px) {
  .spacing {
    margin: 24px;
    padding: 16px;
  }
}

@media (min-width: 1200px) {
  .spacing {
    margin: 32px;
    padding: 24px;
  }
}
```

---

## 参考

- [Ant Design 间距](https://ant.design/docs/spec/space-cn)
- [Material Design Spacing](https://material.io/design/layout/spacing-methods.html)
- [8pt Grid System](https://spec.fm/specifics/8pt-grid-system)
