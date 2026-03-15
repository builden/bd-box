# 前端模块化重构实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use builden-dev:executing-plans to implement this plan task-by-task.

**目标：** 将 bd-cc 前端从当前的扁平结构重构为按功能模块划分的 features 目录结构

**架构：** 功能模块化 + 通用分层，参考 store 的 4 层架构模式

**技术栈：** React + TypeScript + Jotai

---

## 现状分析

### 当前问题

1. `components/` 下 20 个目录，功能代码与 UI 混在一起
2. `hooks/lib/utils` 三个目录职责不清
3. 业务逻辑散落各处，难以定位
4. 新增功能时不知道该创建新目录还是复用现有

### 现有结构

```
src/
├── components/          # 20 个功能目录，扁平散落
│   ├── chat/
│   ├── shell/
│   ├── sidebar/
│   └── ...
├── hooks/               # 扁平散落
├── lib/                 # 扁平散落
├── utils/               # 扁平散落
├── types/               # 扁平散落
└── store/               # ✅ 已规范（primitives/derived/operations/actions）
```

### 目标结构

```
src/
├── features/            # 功能模块（新增）
│   ├── chat/           # 聊天功能
│   ├── projects/       # 项目管理
│   ├── shell/          # 终端功能
│   └── ...
├── components/         # 通用 UI 组件（现有，逐步迁移）
├── store/              # 全局状态（已有规范）
├── hooks/              # 通用 hooks
├── lib/                # 通用库
├── utils/              # 通用工具
├── types/              # 全局类型
└── shared/             # 共享代码
```

---

## features 目录结构规范

### 功能模块内部结构

```
feature-name/
├── ui/                      # UI 组件
│   ├── parts/              # 原子组件（无状态，纯展示）
│   ├── composites/         # 分子组件（组合 parts）
│   ├── containers/         # 有机体（连接 store/hooks）
│   └── pages/             # 页面级组件
├── hooks/                  # 功能专用 hooks
├── types.ts               # 功能类型定义
├── biz/                  # 纯业务逻辑（无 React 依赖）
│   ├── index.ts          # 聚合导出
│   └── {domain}-biz.ts   # 按领域细分
└── index.ts              # 模块导出
```

### ui 组件层级

| 层级       | 说明     | 特点                   | 示例                     |
| ---------- | -------- | ---------------------- | ------------------------ |
| parts      | 原子组件 | 无状态，纯展示，可复用 | Button, Input, Avatar    |
| composites | 分子组件 | 组合 parts，有局部状态 | ChatInput, MessageBubble |
| containers | 有机体   | 连接 store/hooks       | ChatPane, Sidebar        |
| pages      | 页面     | 完整功能页面           | ChatPage, SettingsPage   |

### biz 命名规范

- 目录名：`biz/`
- 文件名：`*-biz.ts`（如 `projects-biz.ts`, `sessions-biz.ts`）
- 函数前缀：`calc`（如 `calcFilterProjects`, `calcTogglePin`）

---

## 迁移顺序

按优先级迁移：

1. **chat** - 核心功能，文件最多（~50 个文件）
2. **projects** - 核心业务，耦合度高
3. **shell** - 终端功能，相对独立
4. 其他模块按需迁移

---

## 任务 1：创建 features 目录结构

### 步骤 1：创建目录结构

```bash
mkdir -p packages/bd-cc/src/features/chat/ui/{parts,composites,containers,pages}
mkdir -p packages/bd-cc/src/features/chat/hooks
mkdir -p packages/bd-cc/src/features/chat/biz
```

### 步骤 2：创建 index.ts 模板

**文件：** 创建 `packages/bd-cc/src/features/chat/index.ts`

```typescript
// Chat 功能模块导出

// UI 组件
export { default as ChatPage } from './ui/pages/ChatPage';

// hooks
export { useChat } from './hooks/useChat';

// biz
export * from './biz';
```

### 步骤 3：提交

```bash
git add packages/bd-cc/src/features/
git commit -m "feat: add features directory structure"
```

---

## 任务 2：迁移 chat 模块

### 分析现有文件

**源文件（`components/chat/`）：**

```
chat/
├── constants/           # 可迁移 → features/chat/types.ts
├── hooks/              # 可迁移 → features/chat/hooks/
├── tools/              # 可迁移 → features/chat/ui/parts/
├── types/              # 可迁移 → features/chat/types.ts
├── utils/              # 可迁移 → features/chat/biz/
└── view/               # 可迁移 → features/chat/ui/
```

### 步骤 1：迁移类型定义

**文件：** 创建 `packages/bd-cc/src/features/chat/types.ts`

从 `components/chat/types/types.ts` 迁移类型定义。

### 步骤 2：迁移 biz

**文件：** 创建 `packages/bd-cc/src/features/chat/biz/`

- 从 `components/chat/utils/` 迁移纯函数
- 添加 `calc` 前缀命名
- 创建 `index.ts` 聚合导出

### 步骤 3：迁移 hooks

**文件：** 移动 `packages/bd-cc/src/components/chat/hooks/` → `packages/bd-cc/src/features/chat/hooks/`

### 步骤 4：重组 ui 目录

**文件：** 按层级重组 `packages/bd-cc/src/features/chat/ui/`

- `parts/`: 原子组件（从 tools/ 迁移）
- `composites/`: 分子组件（从 view/subcomponents/ 迁移）
- `containers/`: 容器组件
- `pages/`: 页面级组件

### 步骤 5：更新导入路径

修改所有导入 `components/chat/` 的文件，改为从 `features/chat/` 导入。

### 步骤 6：验证

```bash
cd packages/bd-cc && bun run typecheck
```

### 步骤 7：提交

```bash
git add packages/bd-cc/src/features/chat/
git add packages/bd-cc/src/components/chat/
git commit -m "refactor(chat): migrate to features structure"
```

---

## 任务 3：迁移 projects 模块

### 分析现有文件

**源文件（`store/projects/` + `components/sidebar/`）：**

- `store/projects/` - 已有较好结构
- `components/sidebar/` - 项目列表组件

### 步骤：类似 chat 模块的迁移流程

1. 创建 `features/projects/` 目录结构
2. 迁移组件到 `ui/` 目录
3. 迁移 hooks 到 `hooks/` 目录
4. 迁移业务逻辑到 `biz/`
5. 更新导入路径
6. 验证并提交

---

## 任务 4：迁移 shell 模块

### 分析现有文件

**源文件（`components/shell/`）：**

- 终端 UI 组件
- WebSocket 连接逻辑

### 步骤：类似 chat 模块的迁移流程

---

## 任务 5：清理与收尾

### 步骤 1：删除空的旧目录

确认所有组件迁移后，删除空的旧目录：

```bash
rm -rf packages/bd-cc/src/components/chat/
rm -rf packages/bd-cc/src/components/sidebar/
rm -rf packages/bd-cc/src/components/shell/
```

### 步骤 2：更新 components 目录说明

在 CLAUDE.md 中说明 `components/` 目录仅用于通用 UI 组件。

### 步骤 3：运行完整测试

```bash
cd packages/bd-cc && bun test
```

---

## 验证命令

每个任务完成后运行：

```bash
# 类型检查
cd packages/bd-cc && bun run typecheck

# 运行测试
cd packages/bd-cc && bun test

# 启动开发服务器
cd packages/bd-cc && bun run dev
```

---

## 计划完成

**两种执行选项：**

**1. 子代理驱动（此会话）** - 我为每个任务调度新的子代理，任务之间代码审查，快速迭代

**2. 并行会话（单独）** - 在工作树中打开新会话使用 executing-plans，带检查点的批量执行

**哪种方法？**

**如果选择子代理驱动：**

- **必需子技能：** 使用 builden-dev:subagent-driven-development
- 留在当前会话
- 每个任务新子代理 + 代码审查

**如果选择并行会话：**

- 引导他们在工作树中打开新会话
- **必需子技能：** 新会话使用 builden-dev:executing-plans

---

## 执行状态（2026-03-15）

### 已完成

| 任务                   | 状态 | 说明                                   |
| ---------------------- | ---- | -------------------------------------- |
| 任务 1：创建目录结构   | ✅   | features/chat, projects, shell         |
| 子任务 2.1：迁移 types | ✅   | features/chat/types.ts                 |
| 子任务 2.2：迁移 biz   | ✅   | 9 个文件从 utils/ 迁移到 biz/          |
| 子任务 2.3：迁移 hooks | ✅   | 6 个 hooks 迁移到 features/chat/hooks/ |
| 子任务 2.4：迁移 UI    | ⚠️   | 暂停 - 依赖复杂                        |

### 待后续完成

1. **UI 组件迁移** - components/chat/view/ 下的组件依赖较多外部模块（llm-logo-provider, mic-button, quick-settings-panel 等），需要：
   - 先提取公共依赖到 features/chat/ui/parts/
   - 或保持现有 components/chat/ 结构，仅迁移业务逻辑

2. **projects 模块迁移** - components/sidebar/ 目录

3. **shell 模块迁移** - components/shell/ 目录

4. **清理旧目录** - 确认迁移完成后删除 components/chat/utils/, components/chat/hooks/

### 当前 features/chat 结构

```
features/chat/
├── index.ts          # 模块导出
├── types.ts          # 类型定义
├── biz/              # 业务逻辑（9 个文件）
│   ├── chatFormatting.ts
│   ├── chatPermissions.ts
│   ├── chatStorage.ts
│   ├── constants.ts
│   ├── index.ts
│   ├── messageKeys.ts
│   ├── messageTransforms.ts
│   ├── sessionId.ts
│   ├── streaming.ts
│   └── thinkingModes.ts
├── hooks/            # 功能 hooks（6 个文件）
│   ├── useChatComposerState.ts
│   ├── useChatProviderState.ts
│   ├── useChatRealtimeHandlers.ts
│   ├── useChatSessionState.ts
│   ├── useFileMentions.tsx
│   └── useSlashCommands.ts
└── ui/               # UI 组件（待迁移，目前仍在 components/chat/）
    ├── parts/
    ├── composites/
    ├── containers/
    └── pages/
```

### 验证

```bash
bun test  # 835 pass ✅
```
