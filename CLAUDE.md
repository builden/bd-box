# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

bd-box 是一个 monorepo 项目，包含多个 npm 包。使用 bun 作为包管理器。

## Packages

| 包名                        | 说明                                                                        |
| --------------------------- | --------------------------------------------------------------------------- |
| **bd-cc**                   | 主应用 - CloudCLI (Claude Code Web UI)，支持 Claude/Cursor/Codex/Gemini CLI |
| **@builden/bd-utils**       | 公共工具库（CLI 升级功能）                                                  |
| **@builden/bd-color**       | 颜色工具包                                                                  |
| **@builden/bd-lunar**       | 农历工具包                                                                  |
| **@builden/bd-skills**      | Claude Code Skills 工具包                                                   |
| **bd-antd-token-previewer** | Ant Design Token 预览器                                                     |
| **vscode-md-diagram**       | VS Code 扩展，为 Markdown 预览添加 Mermaid 图表支持                         |
| **git-src**                 | Git 源码管理工具                                                            |

## Plugins

`plugins/` 目录包含自定义 Skills：

- **bd-dev**: 开发辅助 Skill（TDD、Bun 最佳实践、调试等）
- **bd**: 通用 Skill

## Common Commands

```bash
# Install dependencies
bun install

# Run all tests
bun test

# TypeScript type check
bun run typecheck

# Format code
bun run format

# Lint code
bun run lint

# Run tests for individual packages
bun run test:color     # bd-color
bun run test:lunar     # bd-lunar
bun run test:diagram   # vscode-md-diagram
bun run test:token-previewer  # bd-antd-token-previewer
```

## Package-Specific Commands

### bd-cc (主应用)

```bash
cd packages/bd-cc

# 开发模式
bun run dev          # 同时运行服务端和客户端
bun run server       # 仅运行 Express 服务端
bun run client       # 运行 Vite 开发服务器

# 构建
bun run build        # 构建前端到 dist/
bun run start        # 构建并运行生产环境服务

# 代码检查
bun run lint
bun run lint:fix
bun run typecheck

# 发布
bun run release
```

### vscode-md-diagram

```bash
cd packages/vscode-md-diagram
bun run build
bun test
bun run release
```

### bd-color / bd-lunar

```bash
cd packages/bd-color && bun test && bun run build
cd packages/bd-lunar && bun run build
```

## Architecture

### bd-cc (主要应用)

```
packages/bd-cc/
├── src/                    # React 前端
│   ├── features/           # 功能模块（按业务划分）
│   │   ├── chat/           # 聊天功能
│   │   ├── projects/       # 项目管理
│   │   └── shell/          # 终端功能
│   ├── components/        # 通用 UI 组件
│   ├── store/              # 全局状态 (Jotai)
│   ├── hooks/              # 通用 hooks
│   ├── lib/                # 通用库
│   └── i18n/               # 国际化
├── server/                 # Express 后端 + WebSocket
│   ├── database/           # SQLite 数据库
│   ├── routes/             # REST API
│   └── utils/              # 工具函数
└── shared/                 # 共享常量
```

### vscode-md-diagram

- `src/vscode-extension/`: VS Code 扩展入口
- `src/preview/`: Webview 入口
- `src/renderers/`: 图表渲染器 (mermaid, dot)
- `src/core/`: 核心模块
- `build/`: esbuild 脚本
- `tests/`: 集成测试

<!-- code-review-graph MCP tools -->

## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool                        | Use when                                               |
| --------------------------- | ------------------------------------------------------ |
| `detect_changes`            | Reviewing code changes — gives risk-scored analysis    |
| `get_review_context`        | Need source snippets for review — token-efficient      |
| `get_impact_radius`         | Understanding blast radius of a change                 |
| `get_affected_flows`        | Finding which execution paths are impacted             |
| `query_graph`               | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes`     | Finding functions/classes by name or keyword           |
| `get_architecture_overview` | Understanding high-level codebase structure            |
| `refactor_tool`             | Planning renames, finding dead code                    |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
