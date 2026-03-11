# 视觉层级

定义组件的堆叠顺序、阴影、层级关系，确保界面的空间感和层次分明。

---

## Z-Index 系统

### 基础层级

| 层级           | 数值 | 用途           |
| -------------- | ---- | -------------- |
| Base           | 0    | 普通文档流元素 |
| Dropdown       | 1000 | 下拉菜单       |
| Sticky         | 1100 | 粘性定位元素   |
| Fixed          | 1200 | 固定定位元素   |
| Modal Backdrop | 1300 | 弹窗遮罩       |
| Modal          | 1400 | 弹窗           |
| Popover        | 1500 | 浮层、Tooltip  |
| Tooltip        | 1600 | 提示文字       |
| Toast          | 1700 | 通知提示       |

### 使用原则

```css
/* 不要使用魔法数字 */
.modal {
  z-index: 9999;
} /* ❌ */

/* 使用预定义的层级变量 */
.modal {
  z-index: var(--z-index-modal); /* ✓ */
}
```

---

## 阴影系统

### 基础阴影

| 名称    | 数值                                                   | 用途     |
| ------- | ------------------------------------------------------ | -------- |
| none    | none                                                   | 无阴影   |
| sm      | 0 1px 2px rgba(0,0,0,0.05)                             | 微弱阴影 |
| default | 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.04) | 默认阴影 |
| md      | 0 4px 6px rgba(0,0,0,0.1)                              | 中等阴影 |
| lg      | 0 10px 20px rgba(0,0,0,0.15)                           | 大阴影   |
| xl      | 0 25px 50px rgba(0,0,0,0.25)                           | 极大阴影 |

### 场景应用

```css
/* 按钮、输入框 - 微弱 */
.input {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* 卡片 - 默认 */
.card {
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.12),
    0 1px 2px rgba(0, 0, 0, 0.04);
}

/* 悬停卡片 */
.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 弹窗 */
.modal {
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}
```

### 悬停阴影

```css
/* 按钮悬停 */
.btn:hover {
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

/* 卡片悬停 */
.card-hover:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
  transition: all 0.2s ease-out;
}
```

---

## 组件层级关系

### 浮层组件

| 组件         | 层级 | 说明     |
| ------------ | ---- | -------- |
| Dropdown     | 1050 | 下拉菜单 |
| Sticky       | 1100 | 粘性元素 |
| Fixed        | 1200 | 固定定位 |
| Backdrop     | 1300 | 遮罩层   |
| Modal        | 1400 | 对话框   |
| Drawer       | 1500 | 抽屉     |
| Popover      | 1600 | 浮层     |
| Tooltip      | 1700 | 提示     |
| Notification | 1800 | 通知     |

### 遮罩层级

```css
/* 弹窗遮罩 */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: var(--z-index-modal-backdrop);
}

/* 抽屉遮罩 */
.drawer-mask {
  background: rgba(0, 0, 0, 0.3);
  z-index: 1400;
}
```

---

## 视觉突出

### 突出方式

1. **颜色突出** - 使用主色强调
2. **尺寸突出** - 更大的字号/间距
3. **阴影突出** - 添加阴影
4. **边框突出** - 添加边框
5. **位置突出** - 放置在视觉焦点

### 激活状态

```css
/* 主按钮 - 颜色+阴影 */
.btn-primary {
  background: #1677ff;
  color: #fff;
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.3);
}

/* 选中项 */
.menu-item-selected {
  background: #e6f4ff;
  color: #1677ff;
  font-weight: 500;
}

/* 当前项 */
.menu-item-active {
  background: #f0f0f0;
  border-left: 2px solid #1677ff;
}
```

---

## 空间层级

### 深度效果

```css
/* 平面 - 默认 */
.surface-flat {
  background: #fff;
}

/* 浮起 */
.surface-raised {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 高浮 */
.surface-floating {
  background: #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

/* 最高 */
.surface-overlay {
  background: #fff;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
}
```

### 组件深度

```css
/* 页面 - 最底层 */
.page {
  background: #f5f5f5;
}

/* 卡片 - 中间层 */
.card {
  background: #fff;
  border-radius: 8px;
}

/* 浮层 - 最上层 */
.popover {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}
```

---

## 边框效果

### 边框样式

```css
/* 细边框 */
.border {
  border: 1px solid #d9d9d9;
}

/* 粗边框 */
.border-thick {
  border: 2px solid #d9d9d9;
}

/* 聚焦边框 */
.border-focus {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

/* 错误边框 */
.border-error {
  border-color: #ff4d4f;
}
```

### 分隔线

```css
/* 水平分隔线 */
.divider {
  height: 1px;
  background: #f0f0f0;
  margin: 16px 0;
}

/* 垂直分隔线 */
.divider-vertical {
  width: 1px;
  height: 20px;
  background: #d9d9d9;
  margin: 0 8px;
}
```

---

## 叠加效果

### 层级管理原则

```css
/* 1. 使用 CSS 变量 */
:root {
  --z-dropdown: 1000;
  --z-modal-backdrop: 1300;
  --z-modal: 1400;
  --z-tooltip: 1700;
}

/* 2. 避免硬编码 */
.modal {
  z-index: 9999; /* ❌ */
  z-index: var(--z-modal); /* ✓ */
}

/* 3. 组件内部管理 */
.modal-wrapper {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal-backdrop);
}

.modal-wrapper .modal {
  position: relative;
  z-index: var(--z-modal);
}
```

---

## 参考

- [Ant Design 阴影](https://ant.design/docs/spec/shadow-cn)
- [Material Design Elevation](https://material.io/design/environment/elevation.html)
- [z-index 系统设计](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context)
