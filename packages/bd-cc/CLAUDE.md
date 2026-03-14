# CLAUDE.md

本文档为 Claude Code (claude.ai/code) 在本项目中工作时提供指导。

## 项目概述

CloudCLI (Claude Code UI) 是一个基于 Web 的 Claude Code CLI 界面。同时支持 Cursor CLI、Codex 和 Gemini CLI。项目提供完整功能界面，包括聊天、终端、文件浏览器和 Git 集成。

## 技术栈

- **前端**: React 18 + Vite 7 + TypeScript + Tailwind CSS
- **编辑器**: CodeMirror 6
- **终端**: xterm.js
- **后端**: Express.js + WebSocket
- **数据库**: SQLite (better-sqlite3)
- **Node 版本**: v22 (见 `.nvmrc`)

## 常用命令

```bash
# 开发
npm run dev          # 同时运行服务端和客户端
npm run server       # 仅运行 Express 服务端
npm run client       # 运行 Vite 开发服务器

# 构建与运行
npm run build        # 构建前端到 dist/
npm run start        # 构建并运行生产环境服务

# 代码检查与类型校验
npm run lint         # 运行 ESLint
npm run lint:fix     # 修复 ESLint 问题
npm run typecheck    # TypeScript 类型检查

# 发布
npm run release      # 创建发布版本 (使用 release-it)
```

## 架构

```
src/                          # React 前端
├── features/                 # 功能模块（按业务划分）
│   ├── chat/               # 聊天功能
│   ├── projects/           # 项目管理功能
│   ├── shell/              # 终端功能
│   └── ...
├── components/              # 通用 UI 组件
│   ├── app/                # 应用外壳
│   ├── auth/               # 认证
│   ├── chat/               # 聊天（迁移到 features 后废弃）
│   └── ...
├── store/                   # 全局状态（Jotai）
├── hooks/                   # 通用 hooks
├── lib/                     # 通用库
├── utils/                   # 通用工具
├── constants/               # 常量定义
├── types/                   # 全局类型定义
├── i18n/                    # 国际化配置
└── shared/                  # 跨包共享代码
    └── view/ui/            # 共享 UI 组件
```

### 功能模块结构（features）

> 新增功能或重构时使用，按业务功能划分。通用代码保持在根目录。

```
feature-name/                 # 功能模块目录
├── ui/                      # UI 组件
│   ├── parts/              # 原子组件（无状态，纯展示）
│   ├── composites/         # 分子组件（组合 parts）
│   ├── containers/         # 有机体（连接 store/hooks）
│   └── pages/              # 页面级组件
├── hooks/                   # 功能专用 hooks
├── types.ts                 # 功能类型定义
├── operations/             # 业务逻辑（纯函数，无 React 依赖）
│   ├── index.ts            # 聚合导出
│   └── {domain}-ops.ts     # 按领域细分，如 projects-ops.ts
└── index.ts                 # 模块导出
```

### ui 组件层级

| 层级       | 说明     | 示例                     |
| ---------- | -------- | ------------------------ |
| parts      | 原子组件 | Button, Input, Avatar    |
| composites | 分子组件 | ChatInput, MessageBubble |
| containers | 有机体   | ChatPane, Sidebar        |
| pages      | 页面     | ChatPage, SettingsPage   |

### operations 命名规范

- 目录名：`operations/`
- 文件名：`*-ops.ts`（如 `projects-ops.ts`）
- 函数前缀：`calc`（如 `calcFilterProjects`）

### store 结构（参考）

```
store/
├── {feature}/               # 功能状态模块
│   ├── primitives/        # 原始 atom
│   ├── derived/           # 派生 atom
│   ├── operations/       # 纯函数操作
│   ├── actions/           # React 组件 action
│   └── index.ts           # 导出入口
└── index.ts               # 全局 store 导出
```

server/ # Express 后端
├── database/ # SQLite 数据库
├── routes/ # REST API 端点
├── utils/ # 工具函数
│ ├── plugin-loader.ts # 插件加载
│ ├── skill-loader.ts # Skill 加载
│ ├── mcp-detector.ts # MCP 服务器检测
│ ├── commandParser.ts # 命令解析
│ └── taskmaster-websocket.ts # 任务看板 WebSocket
├── sessionManager.ts # 会话管理
├── claude-sdk.ts # Claude Code 集成
├── cursor-cli.ts # Cursor CLI 集成
├── openai-codex.ts # Codex 集成
├── gemini-cli.ts # Gemini CLI 集成
└── index.ts # 服务端入口

shared/ # 共享常量
└── modelConstants.ts # 支持的 AI 模型

```

### 模块依赖关系

```

App.tsx (根组件)
├── AuthProvider (认证上下文)
│ └── ProtectedRoute (路由守卫)
├── WebSocketProvider (WebSocket)
│ └── Sidebar (侧边栏)
│ ├── ProjectList (项目列表)
│ └── SessionList (会话列表)
├── PluginsContext (插件)
│ └── Settings (设置面板 → 插件设置)
├── SkillsContext (Skills)
│ └── Settings (设置面板 → Skills 设置)
├── TaskMasterContext (任务看板)
│ └── TaskMaster (看板视图)
└── AppContent (主布局)
├── Sidebar (左侧)
│ └── Chat (聊天入口)
└── MainContent (右侧)
├── Shell (终端)
├── CodeEditor (编辑器)
└── Chat (聊天界面)
├── ChatMessagesPane (消息列表)
├── ChatInput (输入框)
└── Tools (工具面板)

```

### 核心数据流

1. **用户认证**: AuthProvider → /api/auth/*
2. **会话管理**: Sidebar → /api/projects/* → sessionManager.ts
3. **聊天**: ChatInput → /api/agent/* → claude-sdk.ts → WebSocket → ChatMessagesPane
4. **终端**: Shell → /api/commands/* → node-pty → WebSocket
5. **文件编辑**: FileTree → CodeEditor → /api/git/*
6. **插件/Skills**: PluginsContext/SkillsContext → /api/plugins/*, /api/skills/*

## 核心概念

- **Providers**: 应用支持多个 AI 提供商 (claude, cursor, codex, gemini)，每个都有各自的 CLI 集成
- **Sessions**: 每个提供商都有会话管理 - 会话从提供商特定的目录中发现 (如 `~/.claude/projects`)
- **Projects**: 会话按项目目录分组
- **Plugins**: 可扩展的插件系统，包含前端 UI 和可选的后端 (见 `server/routes/plugins.js`)

## 类型组织（渐进式改进）

### 现有结构

```

src/types/ # 全局共享类型
├── index.ts # 统一导出入口
├── app.ts # 应用核心类型 (Project, Session, PermissionMode 等)
└── sharedTypes.ts # 其他共享类型

src/components/\*/types/types.ts # 组件特有类型

````

### 改进原则

1. **高频共用类型** → `src/types/app.ts`
2. **组件特有类型** → 组件目录内的 `types/types.ts`
3. **向后兼容** → 旧导入路径仍然可用，通过重新导出保持兼容

### 已完成的迁移

- `PermissionMode`: 从 chat/types/types.ts 迁移到 src/types/app.ts
- 添加路径别名 `@/` 指向 `src/`

### 使用方式

```typescript
// 之前（相对路径，层级深）
import { Project, PermissionMode } from '../../../types/app';

// 之后（使用路径别名）
import { Project, PermissionMode } from '@/types';
````

### 第二阶段分析结果

经过分析，以下类型的迁移优先级较低（保持现状）：

| 类型              | 当前位置                 | 原因                     |
| ----------------- | ------------------------ | ------------------------ |
| McpServer         | settings/types/types.ts  | 特定领域，建议保持模块内 |
| TaskMasterTask    | task-master/types.ts     | 任务看板特有             |
| GitStatusResponse | git-panel/types/types.ts | Git 特有                 |

### 后续改进方向

1. **代码重复检查**：检查是否有重复的工具函数（如日期格式化）
2. **死代码清理**：移除未使用的导入和函数
3. **组件拆分**：过大的组件可以考虑拆分

### 已完成的改进总结

| 阶段     | 改进内容                     | 状态 |
| -------- | ---------------------------- | ---- |
| 第一阶段 | 创建 types/index.ts 统一入口 | ✅   |
| 第一阶段 | 迁移 PermissionMode 到全局   | ✅   |
| 第一阶段 | 添加 @/ 路径别名             | ✅   |
| 第二阶段 | 分析高频类型迁移必要性       | ✅   |

- **WebSocket**: 用于终端、聊天进度和会话更新的实时通信
- **node-pty**: 终端仿真的 PTY

## API 路由

`server/routes/` 中的关键路由：

- `/api/auth/*` - 认证
- `/api/projects/*` - 项目/会话管理
- `/api/agent/*` - Claude Code Agent 通信
- `/api/git/*` - Git 操作
- `/api/settings/*` - 用户设置
- `/api/mcp/*` - MCP 服务器管理
- `/api/plugins/*` - 插件管理

## 调试指南

### 终端问题排查

终端无法连接时，按以下顺序排查：

```bash
# 1. 快速诊断（推荐首选）
bun scripts/diagnose.ts

# 2. 终端功能验证
bun scripts/test-shell.ts

# 3. 运行集成测试
bun test tests/integration/terminal.spec.ts

# 4. 手动测试 WebSocket
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  http://localhost:3001/shell
```

### 常见问题

| 问题                      | 原因                   | 解决方案                 |
| ------------------------- | ---------------------- | ------------------------ |
| 终端提示"在 shell 中继续" | 服务未启动或端口冲突   | `bun run server` 重启    |
| WebSocket 连接失败        | 端口被占用或多实例冲突 | `lsof -i :3001` 检查     |
| 认证 token 缺失           | 开发模式下未登录       | `socket.ts` 允许无 token |
| 侧边栏会话为空            | Claude Code 格式变化   | 检查 jsonl 解析逻辑      |

### 诊断脚本

- `scripts/diagnose.ts` - 系统健康检查
- `scripts/test-shell.ts` - 终端功能验证
- `tests/api/terminal.api.test.ts` - 终端 API 测试
- `docs/specs/terminal/` - 终端架构文档

### 日志位置

- 服务日志: `/tmp/server.log`
- 前端日志: 浏览器 Console 查看 `[Shell]` 和 `[ShellSocket]` 标签
