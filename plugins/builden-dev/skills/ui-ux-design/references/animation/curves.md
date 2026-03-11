# 动画曲线

定义动画的时间-速度曲线，控制动画的节奏感。

---

## 常用曲线

### CSS 内置曲线

| 曲线          | 描述                                         | 适用场景 |
| ------------- | -------------------------------------------- | -------- |
| `ease`        | 慢-快-慢（cubic-bezier(0.25, 0.1, 0.25, 1)） | 默认过渡 |
| `linear`      | 匀速                                         | 颜色渐变 |
| `ease-in`     | 慢开始                                       | 元素离开 |
| `ease-out`    | 慢结束（推荐）                               | 元素进入 |
| `ease-in-out` | 慢开始-慢结束                                | 完整动画 |

### 推荐曲线

#### ease-out（进入动画）

```css
animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
/* 或 */
animation-timing-function: ease-out;
```

- 元素快速进入，缓慢到达终点
- 适合 Modal、Drawer、Tooltip 的出现动画

#### ease-in（离开动画）

```css
animation-timing-function: cubic-bezier(0.4, 0, 1, 1);
/* 或 */
animation-timing-function: ease-in;
```

- 元素缓慢开始，快速离开
- 适合 Modal、Drawer、Tooltip 的消失动画

#### ease-in-out（强调动画）

```css
animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
```

- 慢开始、慢结束
- 适合强调、突出的动画效果

---

## 弹簧曲线

### Spring 动画

```css
/* 轻微弹簧 */
animation-timing-function: cubic-bezier(0.18, 0.89, 0.32, 1.28);

/* 中等弹簧 */
animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);

/* 强烈弹簧 */
animation-timing-function: cubic-bezier(0.68, -0.55, 0.27, 1.55);
```

### 物理模拟

| 类型        | 参数                                 | 适用     |
| ----------- | ------------------------------------ | -------- |
| Spring (快) | mass: 1, stiffness: 400, damping: 30 | 按钮点击 |
| Spring (慢) | mass: 1, stiffness: 200, damping: 25 | 面板展开 |
| Spring (弹) | mass: 1, stiffness: 500, damping: 15 | 弹跳效果 |

---

## 贝塞尔曲线工具

- [cubic-bezier.com](https://cubic-bezier.com/) - 在线调试
- [easings.net](https://easings.net/) - 常用曲线参考

---

## 选择原则

### 进入动画 → ease-out

- 元素出现时快速吸引注意
- 缓慢到达终点，给人稳定感

### 离开动画 → ease-in

- 元素消失时快速离开
- 避免占用用户太多注意力

### 交互反馈 → spring

- 按钮点击、拖拽等
- 提供物理感的反馈

---

## 曲线对比

| 曲线        | 特点     | 感受       |
| ----------- | -------- | ---------- |
| linear      | 机械     | 无聊       |
| ease        | 常规     | 自然       |
| ease-out    | 快-慢    | 流畅、轻快 |
| ease-in     | 慢-快    | 拖沓、等待 |
| ease-in-out | 慢-快-慢 | 平滑、自然 |
| spring      | 弹性     | 生动、有趣 |

---

## 移动端考虑

- 性能优先：transform + opacity
- 减少动画：检测 `prefers-reduced-motion`
- 响应式调整：小屏使用较短时长
