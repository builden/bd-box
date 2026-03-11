# Form - 表单

管理和验证一组表单输入组件的容器组件。

---

## 定义

Form 是一个管理表单数据、验证规则和提交逻辑的容器组件。它将多个输入组件组合在一起，提供统一的数据管理、验证和提交机制。

---

## 为什么好

- **统一管理**：集中管理表单数据
- **验证能力**：内置和自定义验证规则
- **布局控制**：统一的标签、错误提示布局
- **重置/提交**：内置的重置和提交处理

---

## 适用场景

- 用户注册/登录
- 信息编辑页面
- 设置页面
- 数据收集表单

---

## 禁忌

- 字段过多（>10）时考虑分步骤表单
- 简单场景不必使用 Form 组件
- 不要在 Form 外分散放置相关字段

---

## 核心概念

### 布局

| 类型       | 说明               |
| ---------- | ------------------ |
| Horizontal | 标签在左，字段在右 |
| Vertical   | 标签在上，字段在下 |
| Inline     | 标签和字段在一行   |

### 验证时机

| 时机     | 说明       |
| -------- | ---------- |
| onChange | 输入时验证 |
| onBlur   | 失焦时验证 |
| onSubmit | 提交时验证 |

---

## 交互规范

### 验证反馈

```css
.form-item-error .ant-input {
  border-color: #ff4d4f;
}

.form-item-error .ant-input:focus {
  box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2);
}

.form-error-message {
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 4px;
}
```

### 必填标记

```html
<label>
  用户名
  <span class="required-mark" aria-hidden="true">*</span>
  <span class="sr-only">（必填）</span>
</label>
```

---

## 可访问性

```html
<form role="form" aria-label="用户注册表单">
  <!-- 每个表单项 -->
  <div class="form-item">
    <label for="email">邮箱 <span aria-hidden="true">*</span></label>
    <input
      id="email"
      name="email"
      type="email"
      required
      aria-required="true"
      aria-invalid="false"
      aria-describedby="email-help email-error"
    />
    <span id="email-help" class="help">用于接收验证邮件</span>
    <span id="email-error" class="error" role="alert" hidden></span>
  </div>
</form>
```

- 必填字段使用 `aria-required="true"`
- 错误提示使用 `role="alert"` 和 `aria-invalid`
- 帮助文本使用 `aria-describedby` 关联

---

## CSS 实现

```css
.form {
  max-width: 500px;
}

/* 水平布局 */
.form-horizontal .form-item {
  display: flex;
  margin-bottom: 24px;
}

.form-horizontal .form-item-label {
  flex: 0 0 80px;
  padding-right: 8px;
  text-align: right;
}

/* 垂直布局 */
.form-vertical .form-item-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

/* 错误状态 */
.form-item-has-error .ant-input {
  border-color: #ff4d4f;
}

.form-item-has-error .ant-input:focus {
  box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2);
}

.form-item-help {
  margin-top: 4px;
  font-size: 12px;
  color: #00000073;
}

.form-item-help-error {
  color: #ff4d4f;
}

.required-mark {
  color: #ff4d4f;
  margin-left: 4px;
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

## 验证规则示例

```javascript
const rules = {
  username: [
    { required: true, message: "请输入用户名" },
    { min: 3, message: "用户名至少3个字符" },
    { max: 20, message: "用户名最多20个字符" },
  ],
  email: [
    { required: true, message: "请输入邮箱" },
    { type: "email", message: "请输入有效的邮箱" },
  ],
  password: [
    { required: true, message: "请输入密码" },
    { min: 8, message: "密码至少8个字符" },
  ],
};
```

---

## 参考

- [Ant Design Form](https://ant.design/components/form/)
