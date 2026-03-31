---
name: bun-best-practices
description: Use when initializing Bun projects, configuring monorepo workspaces, writing unit tests with bun test, building npm packages, or debugging Bun runtime issues. Covers bun init, bun install, bun test, bun build, and common pitfalls like bun:sqlite limitations and node-pty compatibility.
---

# Bun 最佳实践

## Overview

Bun 是 Node.js 的替代运行时，集成了打包器、测试框架、包管理器。使用 bun install 安装依赖，bun test 运行测试，bun build 打包代码。

## 快速命令

| 操作       | 命令                                                              |
| ---------- | ----------------------------------------------------------------- |
| 启动新项目 | `bun init`                                                        |
| 安装依赖   | `bun install`                                                     |
| 运行测试   | `bun test`                                                        |
| 带覆盖率   | `bun test --coverage`                                             |
| 构建       | `bun build ./src/index.ts --outdir ./dist --minify --target node` |

## 调试优先级

1. **日志** → 2. **测试** → 3. **源码** → 4. **chrome-devtools**

详见 [references/debugging/index.md](./references/debugging/index.md)

## 场景决策

### 项目搭建

| 场景      | 规范文件                                            |
| --------- | --------------------------------------------------- |
| Monorepo  | [setup/monorepo.md](./references/setup/monorepo.md) |
| Lint 配置 | [setup/lint.md](./references/setup/lint.md)         |
| 发布 npm  | [setup/release.md](./references/setup/release.md)   |

### 编码测试

| 场景       | 规范文件                                                    |
| ---------- | ----------------------------------------------------------- |
| 单元测试   | [coding/testing.md](./references/coding/testing.md)         |
| E2E 测试   | [coding/playwright.md](./references/coding/playwright.md)   |
| 轻量浏览器 | [coding/lightpanda.md](./references/coding/lightpanda.md)   |
| 性能测试   | [coding/performance.md](./references/coding/performance.md) |
| 重构       | [coding/refactoring.md](./references/coding/refactoring.md) |
| 运行时技巧 | [coding/runtime.md](./references/coding/runtime.md)         |

## 常见错误

| 错误                     | 解决方案                                                                |
| ------------------------ | ----------------------------------------------------------------------- |
| bun:sqlite 只在 Bun 运行 | 使用统一 database 入口，通过 `process.versions?.bun` 检测运行时动态切换 |
| node-pty onData 不触发   | Bun 不支持，改用 Node.js 运行需要 PTY 的服务                            |
| 嵌套 Claude CLI          | 删除 `CLAUDECODE` 等环境变量                                            |
| 覆盖率不足               | 整体 ≥80%，新增 ≥90%                                                    |

详见 [troubleshooting/common-mistakes.md](./references/troubleshooting/common-mistakes.md)
