---
name: bun-best-practices
description: Bun 运行时开发技巧。用于 Bun 项目开发、monorepo 配置、npm 包发布、单元测试。使用 bun install、bun build、bun test + happy-dom。配置 workspaces、shared build scripts、package.json exports。
---

# Bun Best Practices

## 基础操作

| 操作       | 命令                                                              |
| ---------- | ----------------------------------------------------------------- |
| 启动新项目 | `bun init`                                                        |
| 安装依赖   | `bun install`                                                     |
| 构建代码   | `bun build ./src/index.ts --outdir ./dist --minify --target node` |
| 运行测试   | `bun test`                                                        |

## 调试问题

排查问题时按以下优先级：

1. **日志** → 详细规范见 `references/debugging/logging.md`
2. **测试** → 写测试复现问题
3. **源码** → 使用 LSP 跳转
4. **chrome-devtools** → 前端问题

## 详细规范

| 场景            | 规范文件                                        |
| --------------- | ----------------------------------------------- |
| 测试框架/覆盖率 | `references/testing/testing.md`                 |
| 性能基准测试    | `references/testing/performance.md`             |
| E2E 测试        | `references/testing/playwright.md`              |
| Monorepo 配置   | `references/setup/monorepo.md`                  |
| Lint 配置       | `references/setup/lint.md`                      |
| Gitignore 模板  | `references/setup/gitignore.md`                 |
| npm 包发布      | `references/publishing/package-publishing.md`   |
| 常见错误        | `references/troubleshooting/common-mistakes.md` |
