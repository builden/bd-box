# 状态设计模式

处理数据加载、数据为空、发生错误等常见数据状态的 UI 设计模式。

---

## 为什么重要

良好的状态处理是用户体验的关键：

- **减少焦虑**：明确的等待/加载状态让用户知道系统在工作
- **防止困惑**：空状态和错误状态需要清晰告知用户下一步
- **引导操作**：通过状态 UI 引导用户采取正确的行动

---

## 加载状态

### 原则

1. **即时响应**：操作后立即显示加载状态
2. **延迟显示**：避免闪烁，可设置 200-300ms 延迟
3. **位置相关**：加载指示器放在受影响区域

### 类型

| 类型         | 适用场景      |
| ------------ | ------------- |
| 全屏 Spin    | 页面初始加载  |
| 骨架屏       | 列表/卡片加载 |
| 行内 Loading | 按钮操作中    |
| 区域加载     | 局部内容刷新  |

### 骨架屏

```css
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 4px;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 骨架屏示例 */
.skeleton-text {
  height: 16px;
  margin-bottom: 8px;
}

.skeleton-title {
  height: 24px;
  width: 60%;
  margin-bottom: 16px;
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}
```

### 设计要点

- 骨架屏应与实际内容布局一致
- 避免使用纯白色占位
- 动画应流畅，避免卡顿

---

## 空状态

### 原则

1. **友好提示**：用自然的语言解释当前状态
2. **引导行动**：提供用户可以做的操作
3. **视觉吸引**：使用插画或图标缓解冷清感

### 类型

| 类型   | 场景            |
| ------ | --------------- |
| 无数据 | 列表/表格为空   |
| 无结果 | 搜索/筛选无结果 |
| 无内容 | 新用户/新项目   |

### 示例

```html
<div class="empty-state">
  <!-- 插画区域 -->
  <div class="empty-illustration">
    <svg viewBox="0 0 120 120">
      <!-- 简洁的图标 -->
      <circle cx="60" cy="60" r="40" fill="#f0f0f0" />
    </svg>
  </div>

  <!-- 标题 -->
  <h3 class="empty-title">暂无数据</h3>

  <!-- 描述 -->
  <p class="empty-description">暂无相关内容，请尝试其他操作</p>

  <!-- 操作按钮 -->
  <button class="empty-action btn-primary">刷新试试</button>
</div>
```

### CSS 样式

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-illustration {
  width: 120px;
  height: 120px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-title {
  margin: 0 0 8px;
  font-size: 16px;
  color: #000000e0;
}

.empty-description {
  margin: 0 0 24px;
  font-size: 14px;
  color: #00000073;
  max-width: 300px;
}

.empty-action {
  min-width: 120px;
}
```

---

## 错误状态

### 原则

1. **清晰明确**：用简单语言说明问题
2. **提供帮助**：告知用户如何解决
3. **允许重试**：提供重新操作的途径

### 类型

| 类型     | 场景          |
| -------- | ------------- |
| 网络错误 | 请求失败      |
| 服务错误 | 500 错误      |
| 权限错误 | 未登录/无权限 |
| 验证错误 | 表单验证失败  |

### 示例

```html
<div class="error-state">
  <div class="error-icon">⚠️</div>
  <h3 class="error-title">加载失败</h3>
  <p class="error-description">网络不稳定，请检查网络后重试</p>
  <div class="error-actions">
    <button class="btn-primary">重新加载</button>
    <button class="btn-secondary">返回</button>
  </div>
</div>
```

### 设计要点

- 错误提示应与当前上下文相关
- 敏感信息脱敏处理
- 区分可恢复错误和永久错误

---

## 全局状态管理

### 页面级状态

```
┌─────────────────────────────────┐
│  Loading                        │  ← 初始加载
│  ┌───────────────────────────┐  │
│  │        Spin / 骨架屏        │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│  Success                        │  ← 正常显示
│  ┌───────────────────────────┐  │
│  │         数据内容             │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│  Empty                         │  ← 空状态
│  ┌───────────────────────────┐  │
│  │       Empty State          │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│  Error                         │  ← 错误状态
│  ┌───────────────────────────┐  │
│  │        Error State          │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### React 示例

```jsx
function DataList() {
  const { data, loading, error } = useData();

  if (loading) {
    return <Skeleton />;
  }

  if (error) {
    return <ErrorState onRetry={refetch} />;
  }

  if (!data || data.length === 0) {
    return <EmptyState onRefresh={refetch} />;
  }

  return <List data={data} />;
}
```

---

## 可访问性

### 加载状态

```html
<div aria-live="polite" aria-busy="true">
  <div class="skeleton"></div>
  <span class="sr-only">正在加载，请稍候</span>
</div>
```

### 错误状态

```html
<div role="alert" aria-live="assertive">
  <p>加载失败，请检查网络后重试</p>
  <button onclick="refetch()">重新加载</button>
</div>
```

---

## 参考

- [Ant Design Empty](https://ant.design/components/empty/)
- [Ant Design Result](https://ant.design/components/result/)
