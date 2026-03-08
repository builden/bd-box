---
name: bun-best-practices
description: Bun 运行时开发技巧。用于 Bun 项目开发、monorepo 配置、npm 包发布、单元测试。使用 bun install、bun build、bun test + happy-dom。配置 workspaces、shared build scripts、package.json exports。
---

# Bun Development Skill

使用 Bun 运行时进行现代 JavaScript/TypeScript 开发。

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
- [测试文件组织](references/testing.md#测试文件组织)

### 包发布

- [npm 包发布流程](references/package-publishing.md)
- [共享构建脚本](references/package-publishing.md#共享构建脚本)

### 常见错误

- [常见错误及解决方案](references/common-mistakes.md)

## Resources

- [Bun Documentation](https://bun.sh/docs)
- [Bun GitHub](https://github.com/oven-sh/bun)
- [Elysia Framework](https://elysiajs.com)
