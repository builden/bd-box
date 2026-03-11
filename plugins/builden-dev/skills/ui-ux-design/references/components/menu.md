# Menu - 菜单

用于导航和功能组织的垂直或水平菜单组件。

---

## 定义

Menu 是一个导航组件，提供一组可导航的菜单项，支持单层或多层嵌套结构。它常用于网站导航、侧边栏菜单、功能菜单等场景。

---

## 为什么好

- **层级清晰**：嵌套结构表达内容层级
- **空间利用**：垂直菜单高效利用侧边栏空间
- **交互一致**：统一的点击/悬停行为
- **当前状态**：明确标识当前选中项

---

## 适用场景

- 网站主导航
- 侧边栏功能菜单
- 下拉导航菜单
- 面包屑导航（见 Breadcrumb）

---

## 禁忌

- 层级不要超过 3 级
- 菜单项不要超过 10 个（考虑分组）
- 避免在 Modal 内使用复杂菜单

---

## 类型

| 类型       | 说明     | 适用场景       |
| ---------- | -------- | -------------- |
| Horizontal | 水平排列 | 页面顶部导航   |
| Vertical   | 垂直排列 | 侧边栏         |
| Inline     | 内联展开 | 可折叠的侧边栏 |
| Submenu    | 带子菜单 | 多级导航       |

---

## 状态定义

| 状态     | 说明     |
| -------- | -------- |
| Default  | 未选中   |
| Hover    | 鼠标悬停 |
| Selected | 当前选中 |
| Active   | 正在访问 |
| Disabled | 禁用     |

---

## 交互规范

### 展开/收起

```css
/* 子菜单展开动画 */
.submenu {
  max-height: 0;
  overflow: hidden;
  transition: max-height 200ms ease-out;
}

.submenu-expanded {
  max-height: 500px;
}
```

### 键盘操作

- Tab 在菜单项间导航
- Enter 打开子菜单/激活菜单项
- 方向键在子菜单内导航
- Escape 关闭子菜单

---

## 可访问性

```html
<!-- 使用 nav 包裹 -->
<nav aria-label="主导航">
  <ul role="menu">
    <li role="menuitem">
      <a href="/">首页</a>
    </li>
    <li role="menuitem" aria-haspopup="true">
      <button aria-expanded="false">产品</button>
      <ul role="menu" hidden>
        <li role="menuitem"><a href="/product/1">产品 A</a></li>
      </ul>
    </li>
  </ul>
</nav>
```

- 使用 `role="menu"` 和 `role="menuitem"`
- `aria-expanded` 表示子菜单展开状态
- 当前项使用 `aria-current="page"`

---

## CSS 实现

```css
.menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-item {
  padding: 10px 16px;
  cursor: pointer;
  transition: background 150ms;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-item-selected {
  background: #e6f4ff;
  color: #1677ff;
}

.menu-item a {
  color: inherit;
  text-decoration: none;
}

/* 垂直菜单 */
.menu-vertical {
  width: 200px;
}

.menu-vertical .menu-item {
  display: block;
}

/* 子菜单 */
.submenu {
  padding-left: 20px;
}

.menu-item-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## 参考

- [Ant Design Menu](https://ant.design/components/menu/)
