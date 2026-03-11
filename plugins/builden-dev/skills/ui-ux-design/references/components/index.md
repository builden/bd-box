# 组件设计模式索引

本文档整理常见 UI 组件的设计模式，帮助开发者理解组件的设计考量。

---

## 组件分类

### 反馈类

- [Modal - 对话框](modal.md)
- [Drawer - 抽屉](drawer.md)
- [Tooltip - 提示](tooltip.md)
- [Toast - 轻提示](toast.md)
- [Alert - 警告提示](alert.md)
- [Spin - 加载](spin.md)
- [Button - 按钮](button.md)

### 导航类

- [Tabs - 标签页](tabs.md)
- [Menu - 菜单](menu.md)
- [Breadcrumb - 面包屑](breadcrumb.md)

### 表单类

- [Input - 输入框](input.md)
- [Select - 选择器](select.md)
- [Form - 表单](form.md)
- [Switch - 开关](switch.md)
- [DatePicker - 日期选择器](date-picker.md)

### 数据展示类

- [Table - 表格](table.md)
- [Pagination - 分页](pagination.md)

### 布局类

- [Grid - 栅格](grid.md)
- [Card - 卡片](card.md)
- [Collapse - 折叠面板](collapse.md)

---

## 组件设计要素

每个组件设计文档包含：

1. **定义**：组件是什么，用于什么场景
2. **核心设计考量**：设计时需要考虑的关键点
3. **状态定义**：组件的所有状态
4. **交互行为**：用户的交互方式
5. **动效规范**：动画效果
6. **可访问性**：无障碍要求

---

## 选择指南

### 按功能选择

- 需要用户确认操作 → Modal
- 需要展示更多详情 → Drawer
- 需要解释性文本 → Tooltip
- 需要非阻断式通知 → Toast

### 按复杂度选择

- 简单通知 → Toast / Alert
- 单一操作确认 → Modal
- 复杂操作流程 → Drawer
