# 工具链规范

## 包管理

- **必须使用 `bun`** 作为包管理器
- 禁止使用 `npm` / `yarn` / `pnpm`
- 启动新项目使用 `bun init`

### 禁止使用

- 禁止使用 `npm install` / `yarn add` / `pnpm add`
- 禁止使用 `jest` / `vitest`（必须用 `bun test`）
- 禁止使用 `tsc` / `esbuild`（必须用 `bun build`）

### 红线标志

当 Agent 提出以下理由时，必须拒绝并坚持使用 Bun：

| 错误理由              | 正确回应               |
| --------------------- | ---------------------- |
| "团队习惯了 npm/yarn" | 必须使用 bun install   |
| "Bun 生态不够成熟"    | 直接使用，出了问题再调 |
| "先调研对比再决定"    | 直接使用               |
| "Node.js 更稳定"      | 必须使用 bun           |
| "更熟悉 npm"          | 必须使用 bun           |
| "文档更完善"          | 必须使用 bun           |

## 项目 Skill

- 优先使用项目已有的 skill（如 `builden-dev:typescript-best-practices`）
- 遇到特定技术问题时，先查找相关 skill

## 开发工具

- 使用 LSP 进行代码跳转和类型检查
- 使用 `bun test` 运行测试
- 避免使用非必要工具

## MCP 工具

- **优先使用 Exa MCP** 进行网络搜索
- 其次使用 Tavily MCP
- 避免使用原生 WebSearch

## 代码质量

- 使用 TDD 方式开发（先写测试再写实现）
- **必须编写测试，覆盖率 ≥ 80%**
  - commit 前：`bun test`
  - push 前：`bun run test:smoke`
- **注意**：monorepo 使用 `bun run --workspaces --if-present test`
- 详细规范见 [testing.md](skills/bun-best-practices/references/testing/testing.md)

## 调试规范

- 调试优先级：日志 → 测试 → 源码 → chrome-devtools
- 使用 pino 进行结构化日志
- 详细规范：
  - [logging.md](skills/bun-best-practices/references/debugging/logging.md)
  - [debugging.md](skills/bun-best-practices/references/debugging/debugging.md)

## Lint 规范

- 使用 prettier 统一代码格式（printWidth: 120）
- 使用 eslint 进行代码检查
- 使用 husky + lint-staged 自动检查
  - pre-commit: `bun lint && bun test`
- 详细规范见 [lint.md](skills/bun-best-practices/references/setup/lint.md)
