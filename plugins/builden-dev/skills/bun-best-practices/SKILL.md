---
name: bun-best-practices
description: Bun 运行时开发技巧。用于 Bun 项目开发、monorepo 配置、npm 包发布、单元测试。使用 bun install、bun build、bun test + happy-dom。配置 workspaces、shared build scripts、package.json exports。
---

# Bun Development Skill

使用 Bun 运行时进行现代 JavaScript/TypeScript 开发。

## 强制使用场景

**以下场景必须使用 Bun：**

- 启动新的 JS/TS 项目时 → 使用 `bun init`
- 安装依赖时 → 使用 `bun install`
- 运行测试时 → 使用 `bun test`
- 构建生产代码时 → 使用 `bun run build`

**禁止使用 npm/yarn/pnpm 替代 bun install。**

## 何时使用

- 启动新的 JS/TS 项目时
- 从 Node.js 迁移到 Bun 时
- 配置 Bun workspaces monorepo 时
- 发布 npm 包时
- 编写单元测试时

## 快速决策树

```
1. 需要安装依赖？
   → bun install

2. 需要构建生产代码？
   → bun build ./src/index.ts --outdir ./dist --minify --target node

3. 需要运行测试？
   → bun test

4. 配置 monorepo？
   → 参考 references/monorepo.md

5. 发布 npm 包？
   → 参考 references/package-publishing.md

6. 编写单元测试？
   → 参考 references/testing.md
```

## 基础命令

```bash
# 安装依赖
bun install

# 运行脚本
bun run <script>

# 构建生产代码
bun build ./src/index.ts --outdir ./dist --minify --target node

# 运行测试
bun test
```

## 详细参考

### Monorepo 配置

- [Bun workspaces 配置](references/monorepo.md)
- [package.json exports 字段](references/package-publishing.md)

### 测试框架

- [bun test + happy-dom](references/testing.md)
- [Playwright E2E 测试](references/playwright.md)
- [测试文件组织](references/testing.md#测试文件组织)

### 包发布

- [npm 包发布流程](references/package-publishing.md)
- [共享构建脚本](references/package-publishing.md#共享构建脚本)

### 常见错误

- [常见错误及解决方案](references/common-mistakes.md)

## 常见错误

| 错误行为              | 理性化                         | 正确做法               |
| --------------------- | ------------------------------ | ---------------------- |
| 使用 npm/yarn install | "团队习惯了 npm"、"生态更成熟" | 必须使用 bun install   |
| 使用 jest/vitest      | "更熟悉"、"文档更多"           | 必须使用 bun test      |
| 使用 tsc/esbuild      | "更稳定"、"兼容性更好"         | 必须使用 bun build     |
| 调研对比再决定        | "需要评估风险"                 | 直接使用，出了问题再调 |

## 红线标志 - 停止并重新开始

**以下情况意味着你要绕过 Bun：**

- "团队习惯了 npm/yarn"
- "Bun 生态不够成熟"
- "先调研对比再决定"
- "出了问题再换"
- "Node.js 更稳定"

**所有这些意味着：必须使用 bun install / bun test / bun build。**

## 参考资源

- [Bun Documentation](https://bun.sh/docs)
- [Bun GitHub](https://github.com/oven-sh/bun)
- [Elysia Framework](https://elysiajs.com)
