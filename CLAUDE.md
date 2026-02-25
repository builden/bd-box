# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

bd-box 是一个 monorepo 项目，包含多个 npm 包。使用 bun 作为包管理器。

## Packages

- **@builden/bd-color**: 颜色工具包
- **@builden/bd-lunar**: 农历工具包
- **vscode-md-mermaid**: VS Code 扩展，为 Markdown 预览添加 Mermaid 图表支持

## Common Commands

```bash
# Install dependencies (run from root)
bun install

# Run tests in individual packages
bun run test:color     # bd-color
bun run test:lunar     # bd-lunar
bun run test:mermaid   # vscode-md-mermaid

# Or run in package directory
cd packages/bd-color && bun test
cd packages/bd-lunar && bun test
cd packages/vscode-md-mermaid && bun run test

# Run docs dev server
bun run docs:dev
```

## Package-Specific Commands

### vscode-md-mermaid

```bash
cd packages/vscode-md-mermaid

# Build the extension and webview
bun run build

# Run tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with UI
bun test:ui

# Run tests with coverage
bun test:coverage

# Release (builds, packages and installs the vsix)
bun run release
```

### bd-color

```bash
cd packages/bd-color
bun test
bun run build
```

### bd-lunar

```bash
cd packages/bd-lunar
bun run build
```

## Architecture

### vscode-md-mermaid

这是一个 VS Code 扩展，结构如下：
- `src/vscode-extension/`: VS Code 扩展入口
- `src/shared-mermaid/`: 共享的 Mermaid 渲染逻辑
- `src/markdownPreview/`: Markdown 预览集成
- `src/shared-md-mermaid/`: Markdown 和 Mermaid 的桥接代码
- `build/`: 构建脚本 (esbuild)
- `dist/`: 编译输出
- `tests/`: 集成测试
- `src/**/*.test.ts`: 单元测试（与源文件同级）

### bd-color

使用 bun build.ts 作为构建工具，输出到 dist/ 目录。

### bd-lunar

使用 tsc 编译，输出到 dist/ 目录。

## Documentation

使用 Mintlify 作为文档框架。运行 `bun run docs:dev` 启动本地文档服务器。文档位于 `docs/` 目录下。
