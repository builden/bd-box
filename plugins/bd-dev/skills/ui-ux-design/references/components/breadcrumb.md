# Breadcrumb - 面包屑

显示当前页面在网站层级中的位置，提供快速导航回溯。

---

## 定义

Breadcrumb 是一个导航组件，展示用户在网站或应用中的当前位置，并提供返回上级页面的链接。它帮助用户理解当前位置的结构，并提供快速导航路径。

---

## 为什么好

- **位置感知**：用户知道自己在哪
- **快速回溯**：一键返回上级页面
- **降低跳出率**：帮助用户探索而非直接离开
- **层级表达**：清晰展示内容结构

---

## 适用场景

- 多层级网站/应用
- 电子商务产品分类页
- 文档/教程页面
- 设置/个人中心页面

---

## 禁忌

- 页面层级少于 2 级时不需要
- 不要在首页使用面包屑
- 避免在 Modal 内使用

---

## 类型

| 类型      | 说明                  |
| --------- | --------------------- |
| Separator | 使用分隔符（/、>、›） |
| Icon      | 使用图标作为分隔符    |

---

## 交互规范

### 悬停效果

```css
.breadcrumb-item a:hover {
  color: #4096ff;
  text-decoration: underline;
}
```

### 省略显示

当路径过长时，可以省略中间层级：

```
首页 / ... / 当前位置
```

---

## 可访问性

```html
<nav aria-label="面包屑导航">
  <ol>
    <li><a href="/">首页</a></li>
    <li><a href="/products">产品</a></li>
    <li aria-current="page">当前页面</li>
  </ol>
</nav>
```

- 使用 `<nav>` 包裹，添加 `aria-label`
- 使用 `<ol>` 语义化列表
- 当前页面使用 `aria-current="page"`

---

## CSS 实现

```css
.breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
}

.breadcrumb-item::after {
  content: "/";
  margin: 0 8px;
  color: #bfbfbf;
}

.breadcrumb-item:last-child::after {
  content: none;
}

.breadcrumb-item a {
  color: #1677ff;
  text-decoration: none;
}

.breadcrumb-item-current {
  color: #000000e0;
}

.breadcrumb-separator {
  margin: 0 8px;
  color: #bfbfbf;
}
```

---

## 参考

- [Ant Design Breadcrumb](https://ant.design/components/breadcrumb/)
