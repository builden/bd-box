# Aivis 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use bd-dev:executing-plans to implement this plan task-by-task.

**目标：** 基于 agentation 源码复刻 + 扩展，创建 Aivis 视觉反馈工具

**架构：** 以 agentation 为基础，复刻其完整功能（标注、样式提取、输出），然后扩展样式修改和 CDP 注入能力

**技术栈：** TypeScript + React 18 + SCSS + Bun

---

## 阶段一：复刻 agentation（完美复刻样式、布局、交互）

### 任务 1：初始化 aivis 包结构

**文件：**

- 创建：`packages/aivis/package.json`
- 创建：`packages/aivis/tsconfig.json`
- 创建：`packages/aivis/tsup.config.ts`
- 创建：`packages/aivis/vitest.config.ts`

**步骤 1：创建 package.json**

```json
{
  "name": "@builden/aivis",
  "version": "1.0.0",
  "description": "Visual feedback for AI coding agents",
  "sideEffects": false,
  "license": "MIT",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": {
        "types": "./dist/index.d.mts",
        "default": "./dist/index.mjs"
      },
      "require": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      }
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "watch": "tsup --watch",
    "dev": "pnpm build && pnpm watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "prepublishOnly": "pnpm build"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "peerDependenciesMeta": {
    "react": { "optional": true },
    "react-dom": { "optional": true }
  }
}
```

**步骤 2：创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "types": ["bun-types", "node"]
  },
  "include": ["src/**/*"]
}
```

**步骤 3：创建 tsup.config.ts**

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
});
```

**步骤 4：创建 vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

**步骤 5：提交**

```bash
git add packages/aivis/package.json packages/aivis/tsconfig.json packages/aivis/tsup.config.ts packages/aivis/vitest.config.ts
git commit -m "chore(aivis): init package structure"
```

---

### 任务 2：复刻 types.ts

**源文件：** `/Users/builden/.git-src/benjitaylor/agentation/package/src/types.ts`

**文件：**

- 创建：`packages/aivis/src/types.ts`

**步骤 1：复制源码**

直接复制 agentation 的 `types.ts`，这是 Annotation、Session 等核心类型定义。

**步骤 2：提交**

```bash
git add packages/aivis/src/types.ts
git commit -m "feat(aivis): replicate types from agentation"
```

---

### 任务 3：复刻 icons.tsx

**源文件：** `/Users/builden/.git-src/benjitaylor/agentation/package/src/components/icons.tsx` (44KB)

**文件：**

- 创建：`packages/aivis/src/components/icons.tsx`

**步骤 1：复制源码**

复制完整的 icons.tsx，包含所有 SVG 图标。

**步骤 2：提交**

```bash
git add packages/aivis/src/components/icons.tsx
git commit -m "feat(aivis): replicate icons from agentation"
```

---

### 任务 4：复刻 utils 目录

**源目录：** `/Users/builden/.git-src/benjitaylor/agentation/package/src/utils/`

**文件：**

- 创建：`packages/aivis/src/utils/element-identification.ts`
- 创建：`packages/aivis/src/utils/freeze-animations.ts`
- 创建：`packages/aivis/src/utils/generate-output.ts`
- 创建：`packages/aivis/src/utils/react-detection.ts`
- 创建：`packages/aivis/src/utils/screenshot.ts`
- 创建：`packages/aivis/src/utils/source-location.ts`
- 创建：`packages/aivis/src/utils/storage.ts`
- 创建：`packages/aivis/src/utils/sync.ts`
- 创建：`packages/aivis/src/utils/index.ts`

**步骤 1：逐一复制**

按顺序复制每个文件，保持功能完整。

**步骤 2：提交**

```bash
git add packages/aivis/src/utils/
git commit -m "feat(aivis): replicate utils from agentation"
```

---

### 任务 5：复刻基础组件（checkbox、switch、tooltip、help-tooltip）

**源目录：** `/Users/builden/.git-src/benjitaylor/agentation/package/src/components/`

**文件：**

- 创建：`packages/aivis/src/components/checkbox/index.tsx`
- 创建：`packages/aivis/src/components/checkbox/styles.module.scss`
- 创建：`packages/aivis/src/components/switch/index.tsx`
- 创建：`packages/aivis/src/components/switch/styles.module.scss`
- 创建：`packages/aivis/src/components/tooltip/index.tsx`
- 创建：`packages/aivis/src/components/help-tooltip/index.tsx`
- 创建：`packages/aivis/src/components/help-tooltip/styles.module.scss`
- 创建：`packages/aivis/src/components/icon-transitions.module.scss`

**步骤 1：复制组件和样式**

逐一复制每个基础组件及其 SCSS 样式。

**步骤 2：提交**

```bash
git add packages/aivis/src/components/checkbox/ packages/aivis/src/components/switch/ packages/aivis/src/components/tooltip/ packages/aivis/src/components/help-tooltip/ packages/aivis/src/components/icon-transitions.module.scss
git commit -m "feat(aivis): replicate base components from agentation"
```

---

### 任务 6：复刻 annotation-popup-css

**源文件：** `/Users/builden/.git-src/benjitaylor/agentation/package/src/components/annotation-popup-css/`

**文件：**

- 创建：`packages/aivis/src/components/annotation-popup-css/index.tsx`
- 创建：`packages/aivis/src/components/annotation-popup-css/styles.module.scss`

**步骤 1：复制弹窗组件**

这是标注输入弹窗的核心组件，10319 行。

**步骤 2：提交**

```bash
git add packages/aivis/src/components/annotation-popup-css/
git commit -m "feat(aivis): replicate annotation popup from agentation"
```

---

### 任务 7：复刻 annotation-marker

**源文件：** `/Users/builden/.git-src/benjitaylor/agentation/package/src/components/page-toolbar-css/annotation-marker/`

**文件：**

- 创建：`packages/aivis/src/components/annotation-marker/index.tsx`
- 创建：`packages/aivis/src/components/annotation-marker/styles.module.scss`

**步骤 1：复制标注标记组件**

**步骤 2：提交**

```bash
git add packages/aivis/src/components/annotation-marker/
git commit -m "feat(aivis): replicate annotation marker from agentation"
```

---

### 任务 8：复刻 settings-panel

**源文件：** `/Users/builden/.git-src/benjitaylor/agentation/package/src/components/page-toolbar-css/settings-panel/`

**文件：**

- 创建：`packages/aivis/src/components/settings-panel/index.tsx`
- 创建：`packages/aivis/src/components/settings-panel/styles.module.scss`
- 创建：`packages/aivis/src/components/settings-panel/checkbox-field/index.tsx`
- 创建：`packages/aivis/src/components/settings-panel/checkbox-field/styles.module.scss`

**步骤 1：复制设置面板组件**

**步骤 2：提交**

```bash
git add packages/aivis/src/components/settings-panel/
git commit -m "feat(aivis): replicate settings panel from agentation"
```

---

### 任务 9：复刻 page-toolbar-css（核心主件）

**源文件：** `/Users/builden/.git-src/benjitaylor/agentation/package/src/components/page-toolbar-css/`

**文件：**

- 创建：`packages/aivis/src/components/page-toolbar-css/index.tsx`
- 创建：`packages/aivis/src/components/page-toolbar-css/styles.module.scss` (2223 行)

**步骤 1：复制主工具栏组件**

这是 4709 行的核心组件，包含：

- 工具栏 Toolbar
- 标注标记层 MarkersLayer
- Hover 高亮
- 点击处理
- 设置面板
- 输出生成

**步骤 2：运行测试验证**

```bash
cd ~/Develop/my-proj/bd-box && bun test packages/aivis
```

**步骤 3：提交**

```bash
git add packages/aivis/src/components/page-toolbar-css/
git commit -m "feat(aivis): replicate page toolbar from agentation"
```

---

### 任务 10：复刻 design-mode（可选高级功能）

**源目录：** `/Users/builden/.git-src/benjitaylor/agentation/package/src/components/design-mode/`

**文件：**

- 创建：`packages/aivis/src/components/design-mode/index.tsx`
- 创建：`packages/aivis/src/components/design-mode/styles.module.scss`
- 创建：`packages/aivis/src/components/design-mode/palette.tsx`
- 创建：`packages/aivis/src/components/design-mode/rearrange.tsx`
- 创建：`packages/aivis/src/components/design-mode/skeletons.tsx`
- 创建：`packages/aivis/src/components/design-mode/spatial.ts`
- 创建：`packages/aivis/src/components/design-mode/output.ts`
- 创建：`packages/aivis/src/components/design-mode/section-detection.ts`
- 创建：`packages/aivis/src/components/design-mode/types.ts`

**步骤 1：复制设计模式组件**

包含 palette（调色板）、rearrange（重排）、skeletons（骨架屏）等高级功能。

**步骤 2：提交**

```bash
git add packages/aivis/src/components/design-mode/
git commit -m "feat(aivis): replicate design mode from agentation"
```

---

### 任务 11：创建主入口

**文件：**

- 创建：`packages/aivis/src/components/index.ts`
- 创建：`packages/aivis/src/index.ts`

**步骤 1：复制入口文件**

复制 agentation 的入口文件结构。

**步骤 2：提交**

```bash
git add packages/aivis/src/components/index.ts packages/aivis/src/index.ts
git commit -m "feat(aivis): replicate entry points from agentation"
```

---

## 阶段二：扩展功能

### 任务 12：添加样式修改能力

在 page-toolbar-css 的编辑模式下，添加直接修改 CSS 属性的能力。

**文件：**

- 修改：`packages/aivis/src/components/page-toolbar-css/index.tsx`
- 添加：`packages/aivis/src/components/style-editor/index.tsx`

**步骤 1：扩展编辑模式**

在原有 annotation-edit 模式上，添加 style-edit 模式，允许：

- 选择元素
- 修改 padding、margin、color 等属性
- 实时预览
- 复制 diff

**步骤 2：提交**

```bash
git add packages/aivis/src/components/style-editor/
git commit -m "feat(aivis): add style editing capability"
```

---

### 任务 13：添加 CDP 注入模式

**文件：**

- 创建：`packages/aivis/src/injection/index.ts`
- 创建：`packages/aivis/build-injection.ts`

**步骤 1：创建 IIFE bundle**

创建可注入的 JS bundle，支持 CDP 注入到第三方页面。

**步骤 2：提交**

```bash
git add packages/aivis/src/injection/ packages/aivis/build-injection.ts
git commit -m "feat(aivis): add CDP injection bundle"
```

---

## 验证阶段

### 任务 14：运行完整测试

**步骤 1：运行所有测试**

```bash
cd ~/Develop/my-proj/bd-box
bun test packages/aivis
```

**步骤 2：运行 typecheck**

```bash
bun run typecheck
```

**步骤 3：构建**

```bash
cd packages/aivis && bun run build
```

---

## 交付清单

- [ ] `packages/aivis/src/types.ts` - 核心类型定义
- [ ] `packages/aivis/src/utils/` - 工具函数（element-identification, freeze-animations, generate-output, react-detection, source-location, storage, sync）
- [ ] `packages/aivis/src/components/icons.tsx` - SVG 图标
- [ ] `packages/aivis/src/components/checkbox/` - 复选框组件
- [ ] `packages/aivis/src/components/switch/` - 开关组件
- [ ] `packages/aivis/src/components/tooltip/` - 提示组件
- [ ] `packages/aivis/src/components/help-tooltip/` - 帮助提示组件
- [ ] `packages/aivis/src/components/annotation-popup-css/` - 标注弹窗
- [ ] `packages/aivis/src/components/annotation-marker/` - 标注标记
- [ ] `packages/aivis/src/components/settings-panel/` - 设置面板
- [ ] `packages/aivis/src/components/page-toolbar-css/` - 主工具栏（核心）
- [ ] `packages/aivis/src/components/design-mode/` - 设计模式
- [ ] 样式修改能力
- [ ] CDP 注入能力
- [ ] 所有测试通过
- [ ] 构建成功

---

**计划完成并保存到 `docs/plans/2026-04-02-aivis-implementation.md`**。

**两种执行选项：**

**1. 子代理驱动（此会话）** - 我为每个任务调度新的子代理，任务之间审查，快速迭代

**2. 并行会话（单独）** - 在工作树中打开新会话使用 executing-plans，带检查点的批量执行

**哪种方法？**
