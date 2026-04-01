# Aivis - AI 视觉反馈工具

## 概述

Aivis 是一款面向 AI 编程代理的视觉反馈工具，让用户通过可视化方式标注页面问题、调整样式、提取元素信息，帮助 AI 精准定位和理解修改意图。

**三种职责：**

1. **标注问题**：快速给 AI 反馈页面哪里有问题
2. **样式调整**：实时调整样式（padding、color 等），满意后复制改动
3. **第三方提取**：注入到任意网页，提取节点/样式让 AI 复刻

## 架构设计

### 分层结构

```
packages/aivis/
├── core/                 # 纯 TypeScript，零 DOM 依赖
│   ├── selector.ts       # 生成唯一选择器（class/id/data-attr 组合）
│   ├── extractor.ts      # 提取 computed styles → CSS 规则
│   ├── annotation.ts     # 标注状态机（idle → selecting → annotating）
│   └── protocol.ts       # 消息协议定义
│
├── react/                # 内置模式（React 18+）
│   ├── AivisPanel.tsx    # 主面板组件
│   ├── Toolbar.tsx       # 工具栏（标注/编辑/提取模式切换）
│   ├── AnnotationLayer.tsx # 页面标注覆盖层
│   └── hooks.ts          # useAivis / useAnnotation 等
│
└── injection/            # 注入模式
    ├── index.ts          # IIFE bundle 入口
    ├── overlay.ts        # 独立渲染的标注层
    └── dom.ts            # DOM 操作工具
```

### 模式切换

```tsx
// 内置模式（React App）
import { AivisPanel } from 'aivis/react';

function App() {
  return (
    <>
      <YourApp />
      <AivisPanel mode="embedded" />
    </>
  );
}

// 注入模式：通过 CDP 注入 injection bundle
// tmux browser 命令通过 Chrome DevTools Protocol 注入
```

### 技术约束

- **禁止 any**：全部用 `unknown` + 类型守卫
- **CDP 注入**：`Page.addScriptToEvaluateOnNewDocument` 注入 IIFE bundle
- **样式修改**：`element.style.setProperty()` 实时预览
- **选择器生成**：优先 `data-aivis-id`，其次 class/id 组合

## 功能详解

### 职责一：标注问题

**用户操作**：点击元素 → 输入评论 → 确认

**输出格式**：

```markdown
## Feedback

- Selector: .btn-primary
- Position: { x: 120, y: 340 }
- Comment: 这个按钮间距太大了
```

### 职责二：样式调整

**用户操作**：选择元素 → 修改 CSS 属性 → 实时预览 → 复制 diff

**输出格式**：

```markdown
## Change

- Selector: .sidebar > .nav-item
- Changes:
  - padding: 8px → 16px
  - color: #666 → #333
```

### 职责三：第三方提取

**用户操作**：CDP 注入 → 点击元素 → 提取样式 → 添加评论 → 复制

**输出格式**：

```markdown
## Extract

- Selector: .nav-item
- Computed Styles:
  - padding: 12px
  - color: #333
  - font-size: 14px
- Comment: 导航项的样式，需要复刻
```

## 消息协议

```typescript
type AivisMessage =
  | { type: 'annotation'; selector: string; position: DOMRect; comment?: string }
  | { type: 'style-change'; selector: string; changes: Record<string, string> }
  | { type: 'extract'; selector: string; computedStyles: Record<string, string>; comment?: string };
```

## 测试策略

| 类型     | 工具             | 覆盖场景                                       |
| -------- | ---------------- | ---------------------------------------------- |
| 单元测试 | bun test         | core 纯函数（selector、extractor、annotation） |
| 集成测试 | bun test + jsdom | react 组件交互                                 |
| E2E      | Playwright       | 内置模式完整流程                               |

## 交付物

1. `packages/aivis-core` - 核心逻辑包
2. `packages/aivis-react` - React 组件包（内置模式）
3. `packages/aivis-injection` - 注入模式 IIFE bundle
4. `packages/aivis` - 主包，聚合上述三个
