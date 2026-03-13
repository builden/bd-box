---
name: bun-best-practices
description: Bun 运行时开发技巧。用于 Bun 项目开发、monorepo 配置、npm 包发布、单元测试。使用 bun install、bun build、bun test + happy-dom。
---

# Bun 最佳实践

## 快速命令

| 操作       | 命令                                                              |
| ---------- | ----------------------------------------------------------------- |
| 启动新项目 | `bun init`                                                        |
| 安装依赖   | `bun install`                                                     |
| 构建代码   | `bun build ./src/index.ts --outdir ./dist --minify --target node` |
| 运行测试   | `bun test`                                                        |

## 调试优先级

1. **日志** → 2. **测试** → 3. **源码** → 4. **chrome-devtools**

## 详细规范（按需查阅）

| 场景       | 规范文件                                                                              |
| ---------- | ------------------------------------------------------------------------------------- |
| 架构设计   | [references/architecture/index.md](./references/architecture/index.md)                |
| 项目搭建   | [setup/index.md](./references/setup/index.md)                                         |
| 测试与重构 | [coding/index.md](./references/coding/index.md)                                       |
| 问题调试   | [debugging/index.md](./references/debugging/index.md)                                 |
| 常见错误   | [troubleshooting/common-mistakes.md](./references/troubleshooting/common-mistakes.md) |
