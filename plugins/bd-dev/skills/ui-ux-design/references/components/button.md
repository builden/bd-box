# Button - 按钮

按钮用于触发操作，是界面中最常用的交互元素。

---

## 核心设计考量

### 类型区分

| 类型    | 用途     | 视觉强度       |
| ------- | -------- | -------------- |
| Primary | 主要操作 | 强（主色填充） |
| Default | 次要操作 | 中（主色边框） |
| Text    | 辅助操作 | 弱（无边框）   |
| Danger  | 危险操作 | 强（红色填充） |

### 状态定义

- **Default**：正常状态
- **Hover**：鼠标悬停，颜色加深
- **Active**：鼠标按下，颜色更深
- **Disabled**：禁用，透明度 30%
- **Loading**：加载中，显示 Spin

---

## 交互行为

### 点击反馈

```css
.btn:active {
  transform: scale(0.98);
  transition: transform 0.1s;
}
```

### 组合按钮

```jsx
<Button.Group>
  <Button>左</Button>
  <Button>中</Button>
  <Button>右</Button>
</Button.Group>
```

---

## 动效规范

- **Hover**：150ms 颜色过渡
- **Click**：100ms 缩放反馈
- **Loading**：旋转动画 1s 循环

---

## 可访问性

- 必须支持键盘 Enter/Space 触发
- 禁用状态需设置 `aria-disabled`
- 图标按钮需提供 `aria-label`
- 焦点状态需有明显outline

---

## 禁忌

- 不要在一个区域放置多个 Primary 按钮
- 不要用按钮做导航（用链接）
- 避免使用过长的按钮文本
