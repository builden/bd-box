# Grid - 栅格

用于创建响应式列布局的系统。

---

## 定义

Grid 栅格系统是一种将页面划分为等宽列的布局方式，通过列的组合实现灵活的响应式布局。它是现代 UI 框架的基础设施，让开发者能够以声明式方式创建复杂的响应式布局。

---

## 为什么好

- **声明式**：通过配置而非 CSS 实现布局
- **响应式**：一套代码适配多端
- **一致性**：统一的 gutters 和 margins
- **可组合**：嵌套使用构建复杂布局

---

## 适用场景

- 仪表盘 Dashboard
- 表单布局
- 卡片列表
- 产品展示
- 任何需要多列布局的场景

---

## 禁忌

- 不要用于简单的单列布局（使用 Flex 即可）
- 不要过度嵌套（超过 3 层性能下降）
- 不要在 Grid 内混用不同尺寸系统

---

## 核心概念

### 基础

| 概念   | 说明         |
| ------ | ------------ |
| Row    | 行容器       |
| Col    | 列组件       |
| Gutter | 列间距       |
| Span   | 列宽（1-24） |
| Offset | 偏移量       |

### 响应式断点

| 断点 | 屏幕宽度 | 列数 |
| ---- | -------- | ---- |
| xs   | < 576px  | 1    |
| sm   | ≥ 576px  | 2    |
| md   | ≥ 768px  | 3    |
| lg   | ≥ 992px  | 4    |
| xl   | ≥ 1200px | 6    |

---

## 类型

| 类型       | 说明              |
| ---------- | ----------------- |
| Fixed      | 固定列宽          |
| Fluid      | 等宽列            |
| Responsive | 响应式列          |
| Offset     | 带偏移的列        |
| Order      | 排序（push/pull） |

---

## 状态定义

Grid 本身无状态，但列有以下状态：

| 状态      | 说明       |
| --------- | ---------- |
| Visible   | 正常显示   |
| Hidden    | 隐藏       |
| Collapsed | 响应式收起 |

---

## 交互规范

### 响应式切换

```
桌面 (≥1200px): 6 列
平板 (≥768px):  3 列
手机 (<576px):  1 列
```

### Gutter 间距

```css
/* 默认 gutter */
.row {
  margin-left: -8px;
  margin-right: -8px;
}

.col {
  padding-left: 8px;
  padding-right: 8px;
}

/* 大间距 */
.row-lg {
  margin-left: -16px;
  margin-right: -16px;
}

.col-lg {
  padding-left: 16px;
  padding-right: 16px;
}
```

---

## CSS 实现

```css
/* Row 容器 */
.row {
  display: flex;
  flex-wrap: wrap;
  margin-left: -8px;
  margin-right: -8px;
}

/* 列基础 */
.col {
  padding-left: 8px;
  padding-right: 8px;
  box-sizing: border-box;
}

/* 24 等分系统 */
.col-1 {
  flex: 0 0 4.166667%;
}
.col-2 {
  flex: 0 0 8.333333%;
}
.col-3 {
  flex: 0 0 12.5%;
}
.col-4 {
  flex: 0 0 16.666667%;
}
.col-6 {
  flex: 0 0 25%;
}
.col-8 {
  flex: 0 0 33.333333%;
}
.col-12 {
  flex: 0 0 50%;
}
.col-24 {
  flex: 0 0 100%;
}

/* 响应式 */
@media (max-width: 576px) {
  .col-xs-24 {
    flex: 0 0 100%;
  }
  .col-xs-12 {
    flex: 0 0 50%;
  }
  .col-xs-6 {
    flex: 0 0 25%;
  }
}

@media (min-width: 576px) {
  .col-sm-24 {
    flex: 0 0 100%;
  }
  .col-sm-12 {
    flex: 0 0 50%;
  }
  .col-sm-6 {
    flex: 0 0 25%;
  }
  .col-sm-4 {
    flex: 0 0 16.666667%;
  }
}

@media (min-width: 768px) {
  .col-md-24 {
    flex: 0 0 100%;
  }
  .col-md-12 {
    flex: 0 0 50%;
  }
  .col-md-8 {
    flex: 0 0 33.333333%;
  }
  .col-md-6 {
    flex: 0 0 25%;
  }
  .col-md-4 {
    flex: 0 0 16.666667%;
  }
}

/* 偏移 */
.col-offset-6 {
  margin-left: 25%;
}
.col-offset-12 {
  margin-left: 50%;
}
```

---

## 使用示例

### 两列布局

```html
<div class="row">
  <div class="col col-12 col-md-6">左侧内容</div>
  <div class="col col-12 col-md-6">右侧内容</div>
</div>
```

### 表单布局

```html
<div class="row">
  <div class="col col-24 col-md-8">
    <label>用户名</label>
    <input type="text" />
  </div>
  <div class="col col-24 col-md-8">
    <label>邮箱</label>
    <input type="email" />
  </div>
  <div class="col col-24 col-md-8">
    <label>手机</label>
    <input type="tel" />
  </div>
</div>
```

### 卡片网格

```html
<div class="row">
  <div class="col col-12 col-sm-8 col-md-6 col-lg-4">
    <div class="card">卡片 1</div>
  </div>
  <div class="col col-12 col-sm-8 col-md-6 col-lg-4">
    <div class="card">卡片 2</div>
  </div>
  <div class="col col-12 col-sm-8 col-md-6 col-lg-4">
    <div class="card">卡片 3</div>
  </div>
</div>
```

---

## 可访问性

- Grid 布局本身不影响可访问性
- 确保屏幕阅读器可以正确读取列内容
- 响应式隐藏内容时使用 `display: none` 而非 `visibility: hidden`

---

## 参考

- [Ant Design Grid](https://ant.design/components/grid/)
- [Bootstrap Grid](https://getbootstrap.com/docs/5.0/layout/grid/)
