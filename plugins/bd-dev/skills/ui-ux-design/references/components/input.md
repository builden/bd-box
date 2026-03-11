# Input - 输入框

用于接收用户文本输入的基础表单组件。

---

## 定义

Input 是一个允许用户输入和编辑单行文本的表单组件。它是所有表单交互的基础，其他复杂表单组件（Select、DatePicker 等）都继承自 Input 的交互模式。

---

## 为什么好

- **通用性**：所有文本输入的基础
- **一致性**：统一的交互模式降低学习成本
- **灵活性**：支持多种类型和状态
- **可扩展**：易于构建复杂表单组件

---

## 适用场景

- 文本输入（姓名、邮箱、地址）
- 搜索框
- 密码输入
- 数字输入
- 文本域输入（见 TextArea）

---

## 禁忌

- 不要用于多行文本（使用 TextArea）
- 不要用于需要格式化的输入（使用 DatePicker 等）
- 长文本输入不应使用 Input

---

## 类型

| 类型     | 说明     |
| -------- | -------- |
| Text     | 普通文本 |
| Password | 密码     |
| Number   | 数字     |
| Email    | 邮箱     |
| Tel      | 电话     |
| Search   | 搜索框   |
| TextArea | 多行文本 |

---

## 状态定义

| 状态     | 说明       |
| -------- | ---------- |
| Default  | 默认状态   |
| Focus    | 获得焦点   |
| Filled   | 已填写内容 |
| Error    | 验证错误   |
| Disabled | 禁用       |
| Loading  | 加载中     |

---

## 交互规范

### 聚焦样式

```css
.input:focus {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  outline: none;
}
```

### 前置/后置元素

```html
<!-- 前置图标 -->
<div class="input-wrapper">
  <span class="input-prefix">🔍</span>
  <input class="input" placeholder="搜索" />
</div>

<!-- 后置按钮 -->
<div class="input-wrapper">
  <input class="input" placeholder="搜索" />
  <button class="input-suffix">搜索</button>
</div>
```

### 清空按钮

```css
.input-clear {
  opacity: 0;
  transition: opacity 150ms;
}

.input:not(:placeholder-shown) .input-clear {
  opacity: 1;
}
```

---

## 可访问性

```html
<!-- 正确关联标签 -->
<label for="username">用户名</label>
<input id="username" type="text" placeholder="请输入用户名" />

<!-- 错误提示关联 -->
<input id="email" type="email" aria-invalid="true" aria-describedby="email-error" />
<p id="email-error" role="alert">请输入有效的邮箱地址</p>
```

- 使用 `<label for="...">` 关联标签
- 错误提示使用 `aria-invalid` 和 `aria-describedby`
- 占位符不能替代标签

---

## CSS 实现

```css
.input {
  width: 100%;
  height: 32px;
  padding: 4px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition:
    border-color 150ms,
    box-shadow 150ms;
}

.input:hover {
  border-color: #4096ff;
}

.input:focus {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.input-error {
  border-color: #ff4d4f;
}

.input-error:focus {
  box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2);
}

.input-disabled {
  background: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.6;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-prefix {
  position: absolute;
  left: 12px;
  color: #bfbfbf;
}

.input-suffix {
  position: absolute;
  right: 12px;
}
```

---

## 参考

- [Ant Design Input](https://ant.design/components/input/)
