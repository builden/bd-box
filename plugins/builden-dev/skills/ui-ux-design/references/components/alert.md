# Alert - 警告提示

用于展示重要信息、警告或操作反馈的非侵入式提示。

---

## 定义

Alert 是一个轻量级的信息展示组件，用于在页面顶部或特定区域内显示成功、警告、错误或提示信息。用户可以通过点击关闭按钮或等待自动消失来Dismiss。

---

## 为什么好

- **非侵入性**：不打断用户当前操作
- **上下文相关**：信息与当前操作相关
- **可Dismiss**：用户可以主动关闭
- **视觉明确**：颜色+图标传达信息类型

---

## 适用场景

- 操作成功/失败反馈
- 表单验证错误提示
- 系统状态通知
- 重要警告信息
- 新功能上线提示

---

## 禁忌

- 不应用于需要用户立即处理的紧急情况（用 Modal）
- 不应放置在页面核心内容区域
- 避免同时显示多个 Alert（用 Toast 队列）

---

## 交互规范

### 显示规则

- 位于页面顶部或特定容器内
- 固定定位时避免遮挡核心内容
- 多个 Alert 垂直堆叠

### 关闭行为

- 提供关闭按钮（×）
- 支持自动消失（可选）
- 关闭时从 DOM 移除

### 动画

- 进入：fade-in + slide-down，200ms
- 退出：fade-out，150ms

---

## 状态定义

| 状态    | 颜色                       | 图标 | 用途           |
| ------- | -------------------------- | ---- | -------------- |
| Success | #f6ffed 背景，#52c41a 边框 | ✓    | 成功、操作完成 |
| Warning | #fffbe6 背景，#faad14 边框 | ⚠    | 警告、需要关注 |
| Error   | #fff2f0 背景，#ff4d4f 边框 | ✕    | 错误、操作失败 |
| Info    | #e6f7ff 背景，#1890ff 边框 | ℹ    | 信息、提示     |

---

## 可访问性

```html
<!-- 警告提示需使用 role="alert" -->
<div role="alert" class="alert alert-success">
  <span class="alert-icon">✓</span>
  <span class="alert-message">操作成功</span>
  <button class="alert-close" aria-label="关闭">×</button>
</div>
```

- 使用 `role="alert"` 确保屏幕阅读器即时读取
- 关闭按钮需要 `aria-label`
- 颜色不能是传达信息的唯一方式

---

## CSS 实现

```css
.alert {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 4px;
  border: 1px solid;
  margin-bottom: 16px;
}

.alert-success {
  background: #f6ffed;
  border-color: #b7eb8f;
  color: #52c41a;
}

.alert-warning {
  background: #fffbe6;
  border-color: #ffe58f;
  color: #faad14;
}

.alert-error {
  background: #fff2f0;
  border-color: #ffccc7;
  color: #ff4d4f;
}

.alert-info {
  background: #e6f7ff;
  border-color: #91d5ff;
  color: #1890ff;
}

.alert-message {
  flex: 1;
  margin-left: 8px;
}

.alert-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  opacity: 0.6;
}

.alert-close:hover {
  opacity: 1;
}
```

---

## 参考

- [Ant Design Alert](https://ant.design/components/alert/)
