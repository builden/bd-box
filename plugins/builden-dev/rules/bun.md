# Bun 强制规范

## 必须使用的命令

| 场景         | 命令            |
| ------------ | --------------- |
| 启动新项目   | `bun init`      |
| 安装依赖     | `bun install`   |
| 运行测试     | `bun test`      |
| 构建生产代码 | `bun run build` |

## 禁止使用

- 禁止使用 `npm install` / `yarn add` / `pnpm add`
- 禁止使用 `jest` / `vitest`（必须用 `bun test`）
- 禁止使用 `tsc` / `esbuild`（必须用 `bun build`）

## 红线标志（理性化借口）

当 Agent 提出以下理由时，必须拒绝并坚持使用 Bun：

| 错误理由              | 正确回应               |
| --------------------- | ---------------------- |
| "团队习惯了 npm/yarn" | 必须使用 bun install   |
| "Bun 生态不够成熟"    | 直接使用，出了问题再调 |
| "先调研对比再决定"    | 直接使用               |
| "Node.js 更稳定"      | 必须使用 bun           |
| "更熟悉 npm"          | 必须使用 bun           |
| "文档更完善"          | 必须使用 bun           |

**所有这些借口都意味着：必须使用 bun install / bun test / bun build。**
