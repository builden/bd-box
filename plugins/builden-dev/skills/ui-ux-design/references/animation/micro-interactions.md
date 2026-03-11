# 微交互

小型、聚焦的用户交互反馈，增强用户体验的细节设计。

---

## 定义

微交互（Micro-interaction）是用户与界面元素进行小型交互时的即时反馈，如点击按钮、切换开关、悬停图标等。微交互让用户感知到操作已被系统识别和响应。

---

## 常见类型

### 按钮交互

#### Hover 反馈

```css
.btn {
  transition: all 150ms ease-out;
}
.btn:hover {
  background-color: darken(#1890ff, 10%);
  transform: translateY(-1px);
}
.btn:active {
  transform: translateY(0);
}
```

#### 点击反馈

```css
.btn {
  transition: transform 50ms ease-out;
}
.btn:active {
  transform: scale(0.96);
}
```

### 开关交互

```css
.toggle {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.toggle.active {
  background-color: #52c41a;
  transform: translateX(20px);
}
```

### 输入框交互

```css
.input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  transition: all 200ms ease-out;
}
```

### 选中反馈

```css
.checkbox {
  transition: all 150ms ease-out;
}
.checkbox.checked {
  background-color: #1890ff;
  transform: scale(1);
}
```

---

## 微交互原则

### 1. 即时响应

- 反馈时间 < 100ms
- 让用户感知到系统已响应

### 2. 适度

- 不要过度使用
- 每个交互都有明确目的
- 避免干扰用户操作

### 3. 一致性

- 同类元素使用相同的交互反馈
- 符合用户预期

### 4. 可中断

- 微交互不应阻止用户继续操作
- 用户可以立即进行下一步

---

## 动效规范

### 时长

| 交互类型  | 时长     |
| --------- | -------- |
| 点击反馈  | 50-100ms |
| Hover     | 150ms    |
| 状态切换  | 200ms    |
| 展开/收起 | 250ms    |

### 曲线选择

- 点击反馈：linear 或 ease-out
- 状态切换：ease-out
- 展开/收起：ease-in-out

---

## 案例

### 收藏按钮

```
未收藏 → 悬停: 图标轻微放大
未收藏 → 点击: 图标填充 + 弹跳动画 + 数量增加
已收藏 → 点击: 图标边框 + 数量减少
```

### 点赞按钮

```
未点赞 → 点击: 图标放大 + 填充颜色 + 粒子效果
已点赞 → 点击: 图标恢复
```

### 切换标签

```
选中: 背景色过渡 + 文字色变化 + 下划线移动
```

---

## 性能考虑

- 使用 `transform` 和 `opacity`
- 避免复杂的粒子效果
- 检测 `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
```

---

## 工具推荐

- [Motion One](https://motion.dev/) - 现代动画库
- [Framer Motion](https://www.framer.com/motion/) - React 动画
- [React Spring](https://www.react-spring.dev/) - 物理弹簧动画

---

## 禁忌

- ❌ 过多的微交互让人感到烦躁
- ❌ 过长的动画延迟响应
- ❌ 与平台惯例不符的交互
- ❌ 动画造成性能问题
