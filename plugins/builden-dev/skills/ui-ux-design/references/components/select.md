# Select - 选择器

从预定义选项列表中选择单个或多个值的表单组件。

---

## 定义

Select 是一个允许用户从下拉列表中选择一个或多个选项的表单组件。它替代了原生的 `<select>` 元素，提供更丰富的交互和视觉效果。

---

## 为什么好

- **空间效率**：折叠时只占一行空间
- **搜索支持**：可配置的搜索过滤
- **多选支持**：原生 select 不支持多选
- **自定义选项**：支持图标、分组等复杂内容

---

## 适用场景

- 国家/城市选择
- 分类选择
- 标签选择（多选）
- 带搜索的下拉选择

---

## 禁忌

- 选项少于 3 个时考虑使用 Radio
- 选项过多（>100）时考虑使用 TreeSelect 或带搜索的选择器
- 不要用于需要展示大量信息的场景

---

## 类型

| 类型       | 说明     |
| ---------- | -------- |
| Single     | 单选     |
| Multiple   | 多选     |
| Searchable | 可搜索   |
| Async      | 异步加载 |

---

## 状态定义

| 状态     | 说明         |
| -------- | ------------ |
| Default  | 默认状态     |
| Hover    | 鼠标悬停选项 |
| Focus    | 获得焦点     |
| Selected | 已选中选项   |
| Disabled | 禁用         |
| Loading  | 加载中       |
| Empty    | 无结果       |

---

## 交互规范

### 下拉动画

```css
.select-dropdown {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition:
    max-height 200ms ease-out,
    opacity 150ms;
}

.select-dropdown-open {
  max-height: 200px;
  opacity: 1;
  overflow-y: auto;
}
```

### 键盘操作

- Enter/Space 打开/关闭下拉
- 方向键选择选项
- 输入文字搜索选项
- Esc 关闭下拉

---

## 可访问性

```html
<label for="country">国家</label>
<div class="select" role="combobox" aria-haspopup="listbox" aria-expanded="false">
  <button class="select-selection" id="country" aria-label="选择国家">
    <span class="select-placeholder">请选择</span>
  </button>
  <ul class="select-dropdown" role="listbox">
    <li role="option" aria-selected="false">中国</li>
    <li role="option" aria-selected="true">美国</li>
  </ul>
</div>
```

- 使用 `role="combobox"` 和 `role="listbox"`
- `aria-expanded` 表示下拉展开状态
- 选项使用 `role="option"`

---

## CSS 实现

```css
.select {
  position: relative;
  width: 200px;
}

.select-selection {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  padding: 0 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
}

.select-selection:hover {
  border-color: #4096ff;
}

.select-focused .select-selection {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1050;
}

.select-option {
  padding: 8px 12px;
  cursor: pointer;
}

.select-option:hover {
  background: #f5f5f5;
}

.select-option-selected {
  background: #e6f4ff;
  color: #1677ff;
}
```

---

## 参考

- [Ant Design Select](https://ant.design/components/select/)
