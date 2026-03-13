---
name: shadcn-ui-best-practices
description: 使用 shadcn/ui 组件时，尤其是 Sidebar、Resizable、Tabs 等使用复杂 Tailwind CSS group 选择器的组件。以及需要为特定 UI 场景选择合适的 shadcn 组件时。
---

# shadcn/ui 最佳实践

## 概述

shadcn/ui 提供 50+ 基础组件。本指南涵盖两部分：**CSS 选择器模式** 和 **组件选型指南**，帮助你在开发管理后台时做出正确选择。

---

## 第一部分：CSS 选择器模式

### 核心原则：CSS 选择器驱动 DOM 结构

shadcn/ui 组件不使用 JavaScript 切换类名，而是通过 **父元素上的 data 属性** 让子元素通过 `group-data-[*]` 选择器响应状态变化。

```tsx
// ❌ 错误：把属性添加到了错误的元素
<div data-slot="sidebar-container" data-variant="inset" data-side="left">
  {/* 样式不会生效 - CSS 在父元素上查找 group-data-[variant] */}
</div>

// ✅ 正确：属性放在带 'group' 类的外层包装元素上
<div className="group peer" data-variant={variant} data-side={side}>
  <div data-slot="sidebar-container">
    {/* 现在 group-data-[variant] 和 group-data-[side] 可以正常工作了 */}
  </div>
</div>
```

### `group` 模式的工作原理

1. **外层元素** 带有 `className="group"` 或 `className="group/identifier"`
2. **CSS 通过 `group-data-[attr=value]:类名`** 样式化子元素
3. **父元素属性变化 → 子元素样式变化**

```tsx
// Sidebar 组件结构示例
<div
  className="group peer text-sidebar-foreground hidden md:block" // 'group' 在这里
  data-state={state}
  data-collapsible={dataCollapsible} // CSS 读取这个属性
  data-variant={variant}
  data-side={side}
>
  {/* 子元素使用 group-data-[*] 选择器 */}
  <div className="group-data-[collapsible=offcanvas]:w-0 ... ..."></div>
</div>
```

### 常用 Data 属性

| 属性               | 用途           | 可选值                         |
| ------------------ | -------------- | ------------------------------ |
| `data-collapsible` | 侧边栏折叠模式 | `offcanvas`, `icon`, `none`    |
| `data-variant`     | 视觉变体       | `sidebar`, `floating`, `inset` |
| `data-side`        | 位置方向       | `left`, `right`                |
| `data-state`       | 展开/折叠状态  | `expanded`, `collapsed`        |

### 测试策略

**不要测试属性是否存在，测试实际渲染的样式。**

```typescript
// ❌ 错误：测试可能不存在的属性
await expect(sidebarContainer).toHaveAttribute('data-variant', 'inset');

// ✅ 正确：测试实际计算的样式
const padding = await sidebarContainer.evaluate((el) => window.getComputedStyle(el).padding);
expect(padding).not.toBe('0px'); // inset 有 padding，sidebar 没有

// ✅ 正确：测试布局位置
const rightPos = await sidebarContainer.evaluate((el) => window.getComputedStyle(el).right);
expect(rightPos).toBe('0px'); // RTL 模式下侧边栏在右侧
```

### 添加新属性时的注意事项

1. **找到 CSS 选择器** - 在组件中搜索 `group-data-[`
2. **找到带 `group` 的父元素** - 属性应该放在那里
3. **不要重复添加属性** - 如果父元素已有 `data-variant`，子元素不需要再添加
4. **测试渲染输出** - 验证样式是否生效，不只是属性是否存在

### 侧边栏布局模式速查

| 模式    | `collapsible` | 宽度  | `data-collapsible`    |
| ------- | ------------- | ----- | --------------------- |
| Default | `offcanvas`   | 256px | `""` (空字符串)       |
| Compact | `icon`        | 48px  | `"icon"`              |
| Full    | `none`        | 隐藏  | N/A (元素从 DOM 移除) |

**注意**：`data-collapsible` 只在 `collapsible === 'icon'` 时设置。对于 `offcanvas`，属性为空字符串（通过 `group-data-[collapsible=offcanvas]` 为假值来触发）。

### 常见错误

| 错误做法                                   | 正确做法                                                           |
| ------------------------------------------ | ------------------------------------------------------------------ |
| 把 `data-variant` 添加到 sidebar-container | 添加到带 `group` 类的外层包装元素                                  |
| 测试 `data-side` 属性                      | 测试 CSS 的 `left`/`right` 位置                                    |
| 假设所有变体都有 padding                   | 只有 `floating`/`inset` 有 padding；`sidebar` 是 0px               |
| `data-collapsible=""` 不生效               | 正确 - 空字符串为假值，触发 `group-data-[collapsible=offcanvas]:*` |
| Full 布局导致测试失败                      | Full 模式会从 DOM 移除侧边栏，测试容器可见性                       |

### 扩展 shadcn/ui 组件

1. **先读源码** - 理解 CSS 选择器链后再修改
2. **保留 `group` 类** - 不要从父元素移除
3. **属性加在正确位置** - 通常是最外层包装元素
4. **测试渲染样式** - 而不是 DOM 结构或属性
5. **参考官方源码** - 不确定时对比 shadcn/ui 仓库

### RTL 支持示例

```tsx
// 正确：data-side 加在带 'group' 的外层包装元素上
function Sidebar({ side = 'left', ...props }) {
  return (
    <div
      className="group peer..."
      data-side={side} // CSS 使用 group-data-[side=right]
    >
      <div
        className={cn(
          side === 'left' ? 'left-0' : 'right-0',
          'group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]', // left 两者通用
          'group-data-[side=right]:group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]' // RTL 覆盖
        )}
      ></div>
    </div>
  );
}
```

### 验证清单

- [ ] 属性在带 `group` 类的元素上
- [ ] CSS 正确使用 `group-data-[*]` 选择器
- [ ] 测试验证计算的样式，而非属性
- [ ] 支持所有变体 (sidebar, floating, inset)
- [ ] 支持两种方向 (LTR, RTL)

---

## 第二部分：组件选型指南

### 布局组件

| 场景               | 组件                                      | 原因                                  |
| ------------------ | ----------------------------------------- | ------------------------------------- |
| 带折叠的侧边栏导航 | `Sidebar`                                 | 内置响应式、group 选择器、RTL 支持    |
| 可调节大小的面板   | `ResizablePanelGroup`                     | 拖拽调整、基于 react-resizable-panels |
| 页面分区           | `ResizablePanelGroup` + `ResizableHandle` | 可分割视图，比例可调                  |
| 粘性顶部栏         | 自定义 `Header`                           | 配合 `SidebarTrigger`、滚动检测       |

### 导航组件

| 场景   | 组件                            | 原因                          |
| ------ | ------------------------------- | ----------------------------- |
| 主导航 | `Sidebar` + `SidebarMenuButton` | 自动折叠图标、工具提示        |
| 面包屑 | `Breadcrumb` (项目未包含)       | 使用 shadcn 官方的 breadcrumb |
| 标签页 | `Tabs`                          | 支持垂直/水平、基于 Radix     |

### 表单组件

| 场景         | 组件                 | 原因                         |
| ------------ | -------------------- | ---------------------------- |
| 简单文本输入 | `Input`              | 基础输入，支持验证           |
| 长文本       | `Textarea`           | 可调整大小，支持自动调整变体 |
| 下拉选择     | `Select`             | 原生体验，可搜索选项         |
| 复选框       | `Checkbox`           | 可访问，支持不定状态         |
| 单选组       | `RadioGroup`         | 从选项中单选                 |
| 切换按钮     | `Toggle`             | 二进制开关状态               |
| 切换组       | `ToggleGroup`        | 多选项目                     |
| 开关         | `Switch`             | 设置风格的开关               |
| 带验证的表单 | `Form` + `FormField` | Zod 集成，可访问             |
| 密码输入     | `PasswordInput`      | 显示/隐藏切换                |
| 验证码/OTP   | `InputOTP`           | 一次性密码输入               |
| 滑块         | `Slider`             | 范围选择                     |

### 浮层组件

| 场景          | 组件                 | 原因                    |
| ------------- | -------------------- | ----------------------- |
| 模态对话框    | `Dialog`             | 焦点捕获，ESC 关闭      |
| 侧边面板      | `Sheet`              | 从边缘滑入，响应式      |
| 抽屉 (移动端) | `Drawer`             | 底部弹窗，手势支持      |
| 下拉菜单      | `DropdownMenu`       | 嵌套项目，单选/多选项   |
| 弹出框        | `Popover`            | 浮动内容，悬停/点击触发 |
| 工具提示      | `Tooltip`            | 悬停提示，可访问        |
| 吐司通知      | `Toaster` + `Sonner` | 可堆叠，自动消失        |
| 确认对话框    | `ConfirmDialog`      | 危险操作                |
| 警告对话框    | `AlertDialog`        | 重要确认                |

### 数据展示

| 场景       | 组件          | 原因                       |
| ---------- | ------------- | -------------------------- |
| 卡片容器   | `Card`        | 头部、内容、底部区块       |
| 头像图片   | `Avatar`      | 回退显示首字母，状态指示器 |
| 徽章/标签  | `Badge`       | 状态、分类、计数           |
| 警告消息   | `Alert`       | 错误/警告/成功，带图标     |
| 进度条     | `Progress`    | 加载状态，定时/不定时      |
| 骨架屏     | `Skeleton`    | 加载时的闪烁效果           |
| 表格       | `Table`       | 可排序、分页、行操作       |
| 手风琴     | `Accordion`   | 可折叠区块                 |
| 可折叠内容 | `Collapsible` | 自定义可折叠内容           |

### 交互组件

| 场景       | 组件         | 原因                                             |
| ---------- | ------------ | ------------------------------------------------ |
| 按钮       | `Button`     | 变体：default, destructive, outline, ghost, link |
| 命令面板   | `Command`    | 可搜索，键盘导航                                 |
| 分页       | `Pagination` | 页面导航控件                                     |
| 滚动区域   | `ScrollArea` | 自定义滚动条，内边距                             |
| 分隔线     | `Separator`  | 可视分割                                         |
| 快捷键显示 | `Kbd`        | 键盘快捷键展示                                   |
| 分段控制   | `Segmented`  | 类似标签的可选切换                               |

---

## 第三部分：管理后台常用模式

### 侧边栏 + 顶部栏布局

```tsx
<Sidebar>
  <SidebarHeader><TeamSwitcher /></SidebarHeader>
  <SidebarContent><NavGroup /></SidebarContent>
  <SidebarFooter><NavUser /></SidebarFooter>
</Sidebar>
<Header fixed>
  <SidebarTrigger />
  <Separator orientation="vertical" />
  <TopNav />
</Header>
<Main>...</Main>
```

### 可调节大小的分割视图

```tsx
<ResizablePanelGroup direction="horizontal">
  <ResizablePanel defaultSize={20} minSize={15}>
    <Sidebar />
  </ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize={80}>
    <MainContent />
  </ResizablePanel>
</ResizablePanelGroup>
```

### 设置面板 (Sheet)

```tsx
<Sheet>
  <SheetTrigger>Settings</SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>Theme Settings</SheetHeader>
    <RadioGroup>...</RadioGroup>
  </SheetContent>
</Sheet>
```

### 带操作的数据表格

```tsx
<Table>
  <TableHeader>...</TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>...</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### 什么时候不使用 shadcn 组件

- **第三方库自带 UI** - 日期选择器、富文本编辑器、图表
- **高度自定义交互** - 使用基础组件 (`Button`, `Input`) 自定义
- **简单 HTML 足够** - `div`, `span`, `a` 用于基本结构
