# 工具链规范

## 包管理

- **必须使用 `bun`** 作为包管理器
- 禁止使用 `npm` / `yarn` / `pnpm`
- 启动新项目使用 `bun init`

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
  - 详细规范见 [testing.md](skills/bun-best-practices/references/testing.md)
- 提交前进行代码审查
- 保持代码简洁，避免过度工程化
