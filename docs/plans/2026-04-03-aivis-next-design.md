# Aivis-Next 设计文档

> **日期**：2026-04-03
> **目标**：完全重构 aivis，使用 React 19 + Jotai + Immer + Tailwind

## 概述

Aivis-Next 是面向 AI 编程代理的视觉反馈工具重构版本，提供三种职责：

1. **标注问题**：点击元素 → 输入评论 → 确认
2. **样式调整**：选择元素 → 修改 CSS → 实时预览 → 复制 diff
3. **第三方提取**：CDP 注入 → 提取节点/样式

## 技术栈

| 技术         | 版本 | 用途            |
| ------------ | ---- | --------------- |
| React        | 19   | UI 框架         |
| Jotai        | ≥2.0 | 状态管理        |
| Immer        | ≥10  | 不可变操作      |
| Tailwind CSS | 4    | 样式            |
| TypeScript   | 5    | 类型安全        |
| bun          | 1    | 包管理器 + 测试 |
| happy-dom    | -    | 单元测试环境    |
| Playwright   | -    | E2E 测试        |

## 架构原则

### 数据层：4 层架构

```
store/
├── primitives/     # Layer 1: 基础 atoms
├── derived/       # Layer 2: 派生 atoms
├── operations/    # Layer 3: 纯函数操作
└── actions/       # Layer 4: React hooks 组合
```

### UI 层：3 层架构

```
ui/
├── primitives/     # Layer 1: 原子组件（Button、Icon、Input）
├── composables/    # Layer 2: 复合组件（Toolbar、AnnotationMarker）
└── pages/         # Layer 3: 页面组件（AnnotationLayer）
```

### 核心理念

- **外部传入 DOM 接口**：解耦、可测试、SSR 友好
- **纯函数优先**：operations 层必须无 React 依赖
- **渐进式开发**：每阶段可验证、可体验

## 目录结构

```
packages/aivis-next/
├── src/
│   ├── annotations/                 # 标注功能
│   │   ├── core/                    # 纯函数
│   │   │   ├── selector.ts
│   │   │   ├── selector.test.ts
│   │   │   ├── protocol.ts
│   │   │   ├── protocol.test.ts
│   │   │   └── dom.ts              # DOM 抽象接口
│   │   │
│   │   ├── store/                   # 4 层架构
│   │   │   ├── constants.ts
│   │   │   ├── types.ts
│   │   │   ├── primitives/         # atoms
│   │   │   ├── derived/           # derived atoms
│   │   │   ├── operations/         # 纯函数
│   │   │   │   └── *.test.ts
│   │   │   └── actions/            # React hooks
│   │   │
│   │   └── ui/                     # 3 层架构
│   │       ├── primitives/         # Button、Icon、Input、Badge
│   │       ├── composables/        # Toolbar、Marker、Popup、Highlight
│   │       │   └── *.test.tsx
│   │       └── pages/              # AnnotationLayer
│   │
│   ├── design/                      # 设计模式（阶段 6+）
│   ├── style/                       # 样式编辑（阶段 6+）
│   └── shared/                      # 跨模块共用
│       ├── core/
│       ├── components/
│       └── hooks/
│
├── tests/
│   ├── integration/
│   └── e2e/
│
├── example/                         # 可运行 Demo
│
├── package.json
├── vite.config.ts
├── bunfig.toml
└── tsconfig.json
```

## 开发阶段

### 阶段 0：空壳（验证构建）

**目标**：建立项目骨架 + 可运行的 Demo，悬浮按钮外观与原 aivis 一致

**交付物**：

- `packages/aivis-next/` 目录结构
- Vite + React 19 构建配置
- `example/App.tsx` 可运行示例（参考原 aivis example）
- 悬浮按钮渲染

**验收标准（阶段 0-1）**：

| 检查项         | 规格                                             | 验证方法      |
| -------------- | ------------------------------------------------ | ------------- |
| 按钮尺寸       | 44px × 44px                                      | DevTools 测量 |
| 按钮形状       | 圆形（border-radius: 22px）                      | DevTools 检查 |
| 按钮背景       | #1a1a1a                                          | DevTools 检查 |
| 按钮图标       | IconListSparkle（列表+闪光，24px）               | 视觉对比      |
| 图标颜色       | rgba(255, 255, 255, 0.85)                        | DevTools 检查 |
| 按钮位置       | 右下角 fixed，bottom: 1.25rem, right: 1.25rem    | DevTools 检查 |
| Hover 效果     | 背景变 #2a2a2a                                   | 鼠标悬停测试  |
| 点击效果       | scale(0.95)                                      | 鼠标点击测试  |
| 进入动画       | scale(0.5) rotate(90deg) → scale(1) rotate(0deg) | 页面刷新观察  |
| **拖动功能**   | 按钮可拖动到任意位置                             | 拖动测试      |
| **位置持久化** | 拖动后刷新页面，位置保持                         | 刷新测试      |
| Example 页面   | 包含 header、grid、card、sidebar、spinner        | 视觉对比原版  |

**验证**：`bun run dev` 启动，对照验收标准逐项检查

---

### 阶段 1：基础 Toolbar

**目标**：实现可拖动、宽度自适应的 Toolbar

**交付物**：

- `ui/primitives/`: Button、Icon 组件
- `ui/composables/Toolbar.tsx`: 可拖动 Toolbar
- `store/primitives/toolbar-state.ts`: 位置、可见性 atoms
- `store/operations/toolbar-ops.ts`: 纯函数操作

**用户可见**：Toolbar 出现在右下角，可拖动

**测试**：Toolbar 拖动 atom 测试

---

### 阶段 2：标注流程（核心）

**目标**：完成点击 → 选元素 → 弹窗输入 → 保存完整流程

**交付物**：

- `core/selector.ts`: 选择器生成
- `core/protocol.ts`: 输出格式
- `store/primitives/annotation-atoms.ts`: annotationIdxListAtom、recordAtomFamily
- `store/operations/annotation-ops.ts`: calcAdd、calcRemove
- `store/actions/use-annotation.ts`: addAnnotation、removeAnnotation
- `ui/composables/`: AnnotationLayer、AnnotationMarker、AnnotationPopup、HoverHighlight
- `ui/primitives/Input.tsx`

**用户可见**：

1. 点击 Toolbar 标注按钮
2. 点击页面元素，出现高亮框
3. 弹出输入框，输入评论
4. 保存后，元素上出现数字标记

**测试**：

- `core/selector.test.ts`
- `core/protocol.test.ts`
- `store/operations/annotation-ops.test.ts`
- `ui/composables/*.test.tsx`

---

### 阶段 3：输出与持久化

**目标**：复制 Markdown + 本地存储

**交付物**：

- `store/actions/use-annotation-storage.ts`: 持久化 hook
- `ui/composables/CopyButton.tsx`
- Markdown 格式输出

**用户可见**：

1. 点击复制按钮，生成 Markdown
2. 刷新页面后，标注仍然存在

**测试**：`store/operations/` 覆盖测试

---

### 阶段 4：Hover 交互增强

**目标**：Marker hover 显示详情，Popup 交互优化

**交付物**：

- `ui/composables/MarkerTooltip.tsx`
- `ui/composables/EditPopup.tsx`

**用户可见**：Hover 数字标记显示评论气泡，点击可编辑/删除

---

### 阶段 5：设置面板

**目标**：实现设置面板功能

**交付物**：

- `store/settings.ts`: 设置 atoms
- `ui/composables/SettingsPanel.tsx`

**用户可见**：Toolbar 设置按钮 → 弹出设置面板

---

### 阶段 6-9：扩展功能

| 阶段 | 功能             | 说明               |
| ---- | ---------------- | ------------------ |
| 6    | 样式编辑模式     | 修改 CSS，实时预览 |
| 7    | 设计/Layout 模式 | 拖拽组件布局       |
| 8    | CDP 注入模式     | 注入到第三方页面   |
| 9    | 同步与 Webhook   | 发送到服务器       |

---

## 测试策略

### 测试分类

| 类型     | 工具                 | 位置                          | 覆盖率要求 |
| -------- | -------------------- | ----------------------------- | ---------- |
| 单元测试 | bun test + happy-dom | `src/**/*.test.ts`            | ≥90%       |
| 集成测试 | bun test             | `tests/integration/*.spec.ts` | 关键路径   |
| E2E 测试 | Playwright           | `tests/e2e/*.e2e.ts`          | 关键路径   |
| 冒烟测试 | Playwright           | `tests/e2e/*.smoke.e2e.ts`    | 带 UI      |

### 测试原则

- **禁止外部依赖**：单元测试和集成测试禁止依赖 HTTP、WebSocket、文件系统
- **纯函数优先**：operations 层必须无 React 依赖
- **先写测试**：遵循 TDD 流程

### 运行命令

```bash
bun test                    # 单元测试 + 集成测试
bun test --coverage         # 带覆盖率
bun run test:e2e          # Playwright E2E
bun run test:smoke         # 冒烟测试（带 UI）
```

---

## 类型设计

### Annotation 类型

```typescript
// store/types.ts

export type AnnotationIdx = {
  id: string;
  selector: string;
  x: number;
  y: number;
  timestamp: number;
  isFixed: boolean;
};

export type AnnotationRecord = {
  id: string;
  selector: string;
  comment: string;
  element: string;
  elementPath: string;
  rect: DOMRect;
  timestamp: number;
  isFixed: boolean;
};
```

### DOM 抽象接口

```typescript
// shared/core/dom.ts

export type DOMService = {
  getBoundingClientRect: (element: unknown) => DOMRect | null;
  getClassName: (element: unknown) => string;
  getTagName: (element: unknown) => string;
  getSelector: (element: unknown) => string;
  getComputedStyles: (element: unknown) => Record<string, string>;
  getTextContent: (element: unknown) => string;
  getNearbyText: (element: unknown) => string;
  getElementPath: (element: unknown) => string[];
  isFixedPosition: (element: unknown) => boolean;
  getReactInfo?: (element: unknown) => { components: string; sourceFile?: string } | null;
};

export type AivisOptions = {
  dom: DOMService;
  onAnnotationAdd?: (annotation: AnnotationRecord) => void;
  onAnnotationDelete?: (id: string) => void;
  onCopy?: (markdown: string) => void;
  onSubmit?: (markdown: string, annotations: AnnotationRecord[]) => void;
};
```

---

## 输出格式

```typescript
// core/protocol.ts

export type OutputFormat = {
  type: 'feedback';
  selector: string;
  position: { x: number; y: number };
  comment: string;
  timestamp: number;
};

export function toMarkdown(annotations: AnnotationRecord[]): string {
  if (annotations.length === 0) return '';
  const lines = ['## Feedback\n'];
  annotations.forEach((a, i) => {
    lines.push(`- [${i + 1}] \`${a.selector}\` - ${a.comment}`);
  });
  return lines.join('\n');
}
```

---

## 依赖关系

```
阶段 0（空壳）
    ↓
阶段 1（Toolbar）← 依赖阶段 0
    ↓
阶段 2（标注）← 依赖阶段 0、1
    ↓
阶段 3-5（输出/交互/设置）← 依赖阶段 2
    ↓
阶段 6-9（扩展）← 依赖阶段 5
```

---

## 验收标准

- [ ] 阶段 0：Demo 可启动，按钮可点击
- [ ] 阶段 1：Toolbar 可拖动，位置记忆
- [ ] 阶段 2：完整标注流程可运行
- [ ] 阶段 3：复制功能正常，刷新数据保留
- [ ] 阶段 4：Hover/Edit 交互正常
- [ ] 阶段 5：设置面板功能完整
- [ ] 覆盖率 ≥80%，新增代码 ≥90%
- [ ] 所有 E2E 测试通过
