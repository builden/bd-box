# Collapse - 折叠面板

允许用户展开/收起内容区域的组件。

---

## 定义

Collapse 是一个可展开/收起的面板容器，用于按需显示和隐藏内容。它通过"渐进披露"原则帮助用户专注于当前任务，同时保持信息的可访问性。

---

## 为什么好

- **渐进披露**：先显示关键信息，需要时再展开细节
- **空间效率**：折叠状态下只占用标题行空间
- **组织信息**：将长内容分组为可管理的块
- **状态保持**：展开/收起状态可被记忆

---

## 适用场景

- FAQ 问答页面
- 高级选项/设置
- 表单分组
- 详情展示
- 协议/条款

---

## 禁忌

- 默认状态应该有意义，不要全部收起
- 不要嵌套使用 Collapse
- 不要用于需要同时查看所有内容的场景

---

## 类型

| 类型      | 说明                     |
| --------- | ------------------------ |
| Default   | 默认，点击头部切换       |
| Accordion | 手风琴模式，只能展开一个 |
| Bordered  | 带边框样式               |
| Ghost     | 无背景样式               |

---

## 状态定义

| 状态      | 说明       |
| --------- | ---------- |
| Collapsed | 收起状态   |
| Expanded  | 展开状态   |
| Disabled  | 禁用状态   |
| Loading   | 异步加载中 |

---

## 交互规范

### 展开动画

```css
.collapse-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 200ms ease-out;
}

.collapse-content-expanded {
  max-height: 1000px; /* 设置足够大的值 */
}
```

### 键盘操作

- Enter/Space 展开/收起面板
- Tab 在面板间导航

---

## 可访问性

```html
<!-- 使用 role="region" -->
<div class="collapse" role="region" aria-label="高级设置">
  <div class="collapse-item">
    <button class="collapse-header" aria-expanded="false" aria-controls="collapse-content-1" id="collapse-header-1">
      <span class="collapse-icon">›</span>
      <span class="collapse-title">高级选项</span>
    </button>
    <div class="collapse-content" id="collapse-content-1" role="region" aria-labelledby="collapse-header-1" hidden>
      详细内容...
    </div>
  </div>
</div>
```

- 头部按钮使用 `aria-expanded`
- 内容区域使用 `aria-labelledby` 关联标题
- 收起状态使用 `hidden` 属性

---

## CSS 实现

```css
.collapse {
  border: 1px solid #d9d9d9;
  border-radius: 8px;
}

.collapse-ghost {
  border: none;
}

.collapse-ghost .collapse-item {
  border-bottom: 1px solid #f0f0f0;
}

.collapse-header {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  font-size: 14px;
}

.collapse-icon {
  margin-right: 8px;
  transition: transform 200ms ease-out;
  font-size: 12px;
  color: #bfbfbf;
}

.collapse-header[aria-expanded="true"] .collapse-icon {
  transform: rotate(90deg);
}

.collapse-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 200ms ease-out;
}

.collapse-content-expanded {
  max-height: 1000px;
}

.collapse-content-inner {
  padding: 0 16px 16px;
}

.collapse-item-disabled .collapse-header {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## 渐进披露原则

### 设计建议

1. **标题清晰**：让用户知道展开后会看到什么
2. **默认展开**：重要内容默认展开，次要内容收起
3. **内容独立**：每个面板内容应独立完整
4. **动画平滑**：展开/收起应有平滑过渡

---

## 参考

- [Ant Design Collapse](https://ant.design/components/collapse/)
