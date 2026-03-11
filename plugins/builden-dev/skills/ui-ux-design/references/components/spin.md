# Spin - 加载指示器

表示系统正在处理请求或加载内容，需要用户等待。

---

## 定义

Spin 是一个视觉反馈组件，通过旋转动画表示系统正在忙碌、正在加载或正在处理请求。它告知用户操作正在进行中，而非系统无响应。

---

## 为什么好

- **即时反馈**：让用户知道系统正在响应
- **防止重复提交**：减少用户因等待而产生的重复操作
- **可预测**：明确的加载状态，避免用户焦虑

---

## 适用场景

- 页面初始加载
- 列表数据请求
- 表单提交中
- 按钮操作处理中
- 区域内容刷新

---

## 禁忌

- 不要在用户可交互的元素上显示
- 不要用于长时间（>10秒）的加载，考虑使用骨架屏
- 避免遮挡页面主要内容

---

## 状态定义

| 状态     | 说明               |
| -------- | ------------------ |
| Spinning | 旋转动画进行中     |
| Paused   | 鼠标悬停时暂停动画 |
| Static   | 仅显示图标，无动画 |

---

## 变体

### 大小

| 尺寸    | 尺寸 |
| ------- | ---- |
| Small   | 16px |
| Default | 20px |
| Large   | 32px |

### 类型

```css
/* 圆点旋转 */
.spin-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #1677ff;
  animation: spin 1s linear infinite;
}

/* 圆环 */
.spin-circle {
  width: 20px;
  height: 20px;
  border: 2px solid #d9d9d9;
  border-top-color: #1677ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 骨架屏 */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}
```

---

## 交互规范

### 加载覆盖

```css
/* 全屏加载遮罩 */
.spin-container {
  position: relative;
}

.spin-container.spinning::after {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### 延迟显示

```javascript
// 避免闪烁，延迟 200ms 显示
const showSpin = setTimeout(() => {
  setLoading(true);
}, 200);

// 清除
clearTimeout(showSpin);
```

---

## 动画规范

```css
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 缓动曲线 */
.spin-circle {
  animation-timing-function: linear;
}
```

---

## 可访问性

```html
<!-- 屏幕阅读器通知 -->
<div aria-live="polite" aria-busy="true">
  <div class="spin"></div>
  <span class="sr-only">正在加载，请稍候</span>
</div>
```

- 使用 `aria-busy="true"` 表明区域正在加载
- 提供文本说明让屏幕阅读器用户知道加载状态

---

## CSS 实现

```css
.spin {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #d9d9d9;
  border-top-color: #1677ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spin-lg {
  width: 32px;
  height: 32px;
  border-width: 3px;
}

.spin-sm {
  width: 16px;
  height: 16px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
```

---

## 参考

- [Ant Design Spin](https://ant.design/components/spin/)
