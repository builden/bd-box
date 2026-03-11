# Tabs - 标签页

在同一内容区域内切换不同视图或功能模块。

---

## 定义

Tabs 是一个导航组件，通过水平或垂直的标签列表，让用户在同一页面位置切换不同的内容面板。它允许在单个视图中组织多个相关但独立的内容区域。

---

## 为什么好

- **空间效率**：同一位置展示多组内容
- **认知负荷低**：用户无需跳转页面
- **状态保持**：切换标签保持上下文
- **内容分组**：逻辑上关联的内容放在一起

---

## 适用场景

- 设置页面：多个设置分类
- 数据面板：不同维度的数据展示
- 表单步骤：多步骤表单
- 内容分类：文章的不同章节

---

## 禁忌

- 标签数量不超过 5-7 个
- 不要用于完全不相关的内容
- 不要嵌套使用 Tabs
- 避免在移动端使用水平 Tabs

---

## 类型

### 按方向

| 类型       | 说明     | 适用场景       |
| ---------- | -------- | -------------- |
| Horizontal | 水平排列 | 桌面端主流     |
| Vertical   | 垂直排列 | 侧边栏、移动端 |

### 按风格

| 类型     | 说明                       |
| -------- | -------------------------- |
| Line     | 线条样式，当前标签下方边框 |
| Card     | 卡片样式，带背景和边框     |
| Editable | 可编辑标签，可添加/删除    |

---

## 状态定义

| 状态     | 说明               |
| -------- | ------------------ |
| Default  | 未选中，默认样式   |
| Hover    | 鼠标悬停，轻微高亮 |
| Active   | 当前激活，显著样式 |
| Disabled | 禁用状态，不可点击 |

---

## 交互规范

### 键盘操作

- Tab 键切换焦点到 Tabs 容器
- 方向键在标签间切换
- Enter 键激活选中标签
- Home/End 键跳转到首尾标签

### 动画

```css
/* 标签切换动画 */
.tab-panel {
  animation: fade-in 200ms ease-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 线条标签移动动画 */
.tab-active-bar {
  transition: transform 200ms ease-out;
}
```

---

## 可访问性

```html
<!-- 使用 role="tablist" 包裹所有标签 -->
<div role="tablist" aria-label="设置分类">
  <!-- 每个标签使用 role="tab" -->
  <button role="tab" aria-selected="true" aria-controls="panel-profile">个人资料</button>
  <button role="tab" aria-selected="false" aria-controls="panel-account">账号设置</button>
</div>

<!-- 内容面板使用 role="tabpanel" -->
<div role="tabpanel" id="panel-profile" aria-labelledby="tab-profile">内容区域</div>
```

- 使用 `role="tablist"`、`role="tab"`、`role="tabpanel"`
- `aria-selected` 标明当前选中标签
- `aria-controls` 关联标签和面板

---

## CSS 实现

```css
/* 基础样式 */
.tabs {
  display: flex;
  border-bottom: 1px solid #d9d9d9;
}

.tab {
  padding: 12px 16px;
  border: none;
  background: none;
  cursor: pointer;
  color: #00000073;
  transition: color 200ms;
}

.tab:hover {
  color: #1677ff;
}

.tab-active {
  color: #1677ff;
  border-bottom: 2px solid #1677ff;
  margin-bottom: -1px;
}

.tab-panel {
  padding: 16px 0;
}

/* 卡片风格 */
.tabs-card {
  border: 1px solid #d9d9d9;
  border-radius: 4px 4px 0 0;
}

.tabs-card .tab {
  background: #fafafa;
  border-right: 1px solid #d9d9d9;
}

.tabs-card .tab-active {
  background: #fff;
  border-bottom-color: #fff;
}
```

---

## 参考

- [Ant Design Tabs](https://ant.design/components/tabs/)
- [ARIA Authoring Practices - Tabs](https://www.w3.org/TR/wai-aria-practices-1.1/#tabpanel)
