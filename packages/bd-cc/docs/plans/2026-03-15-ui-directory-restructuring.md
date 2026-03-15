# UI 目录结构统一实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use builden-dev:executing-plans to implement this plan task-by-task.

**目标：** 统一所有 features 的 ui 目录为 parts/composites/containers/pages 四层结构

**架构：**

- parts: 原子组件（无状态，纯展示）
- composites: 分子组件（组合 parts，有本地状态）
- containers: 有机体（连接 store/hooks）
- pages: 页面级组件

**技术栈：** React 组件重构

---

## 任务 1：重构 code-editor/ui

**文件：**

- 移动：`ui/pages/subcomponents/markdown/` → `ui/parts/markdown/`
- 移动：`ui/pages/subcomponents/*.tsx` → `ui/composites/`
- 移动：`ui/pages/CodeEditor.tsx` → `ui/containers/CodeEditorContainer.tsx`
- 移动：`ui/pages/EditorSidebar.tsx` → `ui/pages/EditorSidebar.tsx`
- 删除：`ui/pages/subcomponents/`

**步骤 1：创建目录结构**

```bash
mkdir -p ui/parts/markdown
mkdir -p ui/composites
mkdir -p ui/containers
```

**步骤 2：移动文件并更新导入路径**

- 将 markdown/ 移入 parts/
- 将 subcomponents/\*.tsx（非页面）移入 composites/
- CodeEditor.tsx 移入 containers/（因为使用 hooks）

**步骤 3：验证**

运行：`bun run typecheck`
预期：无类型错误

---

## 任务 2：重构 file-tree/ui

**文件：**

- 移动：`ui/pages/FileTree.tsx` → `ui/containers/FileTreeContainer.tsx`
- 移动：`ui/pages/*.tsx` → `ui/composites/`
- 删除：`ui/pages/`

**步骤 1：创建目录结构**

```bash
mkdir -p ui/composites
mkdir -p ui/containers
```

**步骤 2：分析组件层级**

- FileTree.tsx 使用 useFileTreeData → containers
- 其他组件 → composites

**步骤 3：验证**

运行：`bun run typecheck`
预期：无类型错误

---

## 任务 3：重构 prd-editor/ui

**文件：**

- 移动：`ui/pages/PRDEditor.tsx` → `ui/containers/PRDEditorContainer.tsx`
- 移动：`ui/pages/*.tsx` → `ui/composites/`

**步骤 1：创建目录结构**

```bash
mkdir -p ui/composites
mkdir -p ui/containers
```

**步骤 2：验证**

运行：`bun run typecheck`
预期：无类型错误

---

## 任务 4：重构 quick-settings/ui

**文件：**

- 移动：`ui/pages/QuickSettingsPanelView.tsx` → `ui/containers/QuickSettingsPanelView.tsx`
- 移动：`ui/pages/*.tsx` → `ui/composites/`

**步骤 1：创建目录结构**

```bash
mkdir -p ui/composites
mkdir -p ui/containers
```

**步骤 2：验证**

运行：`bun run typecheck`
预期：无类型错误

---

## 任务 5：重构 settings/ui

**文件：**

- 移动：`Settings*.tsx` → `composites/`
- 移动：`agents-settings/`, `api-settings/`, `git-settings/` → `containers/`
- 移动：`modals/` → `composites/`

**步骤 1：创建目录结构**

```bash
mkdir -p ui/composites
mkdir -p ui/containers
```

**步骤 2：验证**

运行：`bun run typecheck`
预期：无类型错误

---

## 任务 6：重构 plugins/ui

**文件：**

- 移动：`Plugin*.tsx` → `composites/`

**步骤 1：创建目录结构**

```bash
mkdir -p ui/composites
```

**步骤 2：验证**

运行：`bun run typecheck`
预期：无类型错误

---

## 任务 7：重构 skills/ui

**文件：**

- 移动：`Skills*.tsx` → `composites/`

**步骤 1：创建目录结构**

```bash
mkdir -p ui/composites
```

**步骤 2：验证**

运行：`bun run typecheck`
预期：无类型错误

---

## 任务 8：重构 standalone-shell/ui

**文件：**

- 移动：`pages/subcomponents/` → `parts/`
- 移动：`pages/StandaloneShell.tsx` → `containers/StandaloneShellContainer.tsx`

**步骤 1：创建目录结构**

```bash
mkdir -p ui/parts
mkdir -p ui/containers
```

**步骤 2：验证**

运行：`bun run typecheck`
预期：无类型错误

---

## 任务 9：重构 task-master/ui

**文件：**

- 移动：`view/*.tsx` → `containers/`
- 移动：`context/`, `hooks/`, `utils/` → 同级保留或移入 containers/

**步骤 1：创建目录结构**

```bash
mkdir -p ui/containers
```

**步骤 2：验证**

运行：`bun run typecheck`
预期：无类型错误

---

## 任务 10：最终验证

**步骤 1：运行完整测试**

运行：`bun test 2>&1 | tail -10`
预期：所有测试通过

**步骤 2：检查 TypeScript**

运行：`bun run typecheck 2>&1 | head -30`
预期：无类型错误
