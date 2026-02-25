# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

bd-antd-token-previewer 是一个 Ant Design Token 预览器和主题编辑器组件库，用于自定义和预览 Ant Design 主题。

## Commands

```bash
# 安装依赖
bun install

# 运行测试
bun test          # watch 模式
bun test:run      # 单次运行
bun test:ui       # UI 模式

# 开发文档网站
bun start         # 启动 dumi dev server

# 构建
bun run compile   # 使用 father 构建库
bun run docs:build # 构建文档

# 代码检查
bun run lint      # ESLint 检查
```

## Architecture

### 导出组件 (src/index.tsx)

- `ThemeEditor` - 主题编辑器组件
- `Previewer` - 完整预览器（含组件演示）
- `TokenPanel` - Token 面板
- `PreviewDemo` - 预览演示组件
- `getDesignToken` - 获取设计 Token 的工具函数
- `parsePlainConfig` / `parseThemeConfig` - 配置解析工具

### 核心类型 (src/interface.ts)

- `Theme` - 主题配置对象 `{ name, key, config }`
- `MutableTheme` - 带回调的主题对象
- `PreviewerProps` - Previewer 组件属性
- `TokenPreviewProps` - TokenPanel 属性
- `ThemeEditorProps` - ThemeEditor 属性

### 重要配置

- `.dumirc.ts` - dumi 文档配置，包含 alias: `bd-antd-token-previewer` -> `./src`
- `vitest.config.ts` - 测试配置，jsdom 环境
- `father` - 用于构建库的构建工具

### 目录结构

```
src/
├── component-panel/      # 组件面板相关
├── component-token-editor/ # 组件 token 编辑器
├── editor-modal/         # JSON 编辑器模态框
├── hooks/                # React hooks
├── icons/                # SVG 图标
├── locale/               # 国际化（zh-CN, en-US）
├── meta/                 # Token 元数据和关系
├── previews/             # 组件预览示例
│   ├── components/      # 各 Ant Design 组件预览
│   └── overviews/       # 概览页面
├── token-panel/          # Token 面板
├── token-panel-pro/      # Pro 版 Token 面板
├── utils/                # 工具函数
├── ThemeEditor.tsx      # 主题编辑器
├── PreviewDemo.tsx       # 预览演示
├── previewer.tsx         # 预览器
└── index.tsx            # 入口文件
```

### 测试

- 测试文件位于 `tests/` 目录
- 使用 vitest + @testing-library/react
- 需要在测试中 mock: `matchMedia`, `ResizeObserver`, `getComputedStyle`
