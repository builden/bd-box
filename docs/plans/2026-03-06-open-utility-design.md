# Open Utility 设计文档

**日期**: 2026-03-06
**作者**: Claude
**状态**: 已审批

## 需求背景

在开发工具（如 Vite dev 模式）中，需要实现：

1. 打开浏览器时，复用已有标签页并激活（类似 Vite 的行为）
2. 支持打开文件夹（类似 Mac 的 `open` 命令）

## 技术选型

| 库           | 用途         | 备注                                       |
| ------------ | ------------ | ------------------------------------------ |
| `better-opn` | 核心打开功能 | 基于 `open` 库，支持 Mac Chrome 标签页复用 |
| `open`       | 底层依赖     | 跨平台打开 URL/文件                        |

### 为什么选择 better-opn？

- 它已实现 Mac 下 Chrome 标签页复用的 AppleScript 逻辑
- 已在 Vite、Create React App 等成熟项目中使用
- 支持多种 Chromium 浏览器：Google Chrome、Edge、Brave、Vivaldi 等

## 平台行为

| 平台            | 浏览器                    | 行为                                 |
| --------------- | ------------------------- | ------------------------------------ |
| macOS           | Chrome/Edge/Brave/Vivaldi | 查找已有标签页，激活并刷新           |
| macOS           | Safari / 其他             | 回退到 `open` 库，打开新标签页       |
| Windows / Linux | 任意                      | 回退到 `open` 库（不支持标签页复用） |

## API 设计

### TypeScript 接口

```typescript
export interface OpenOptions {
  /** 指定浏览器，如 "google chrome"、"safari" */
  app?: string;
  /** 等待浏览器关闭（默认 false） */
  wait?: boolean;
}

/**
 * 打开 URL 或文件
 * - URL: 在浏览器中打开，Mac 下优先复用 Chrome 已有标签页
 * - 文件夹: 在 Finder 中打开
 */
export function open(target: string, options?: OpenOptions): Promise<void>;
```

### 使用示例

```typescript
import { open } from "@builden/bd-utils";

// 打开 URL（Mac 下复用 Chrome 标签页）
await open("http://localhost:5173");

// 指定浏览器
await open("http://localhost:5173", { app: "safari" });

// 打开文件夹（Mac 下用 Finder）
await open("/path/to/folder");
```

## 文件结构

```
packages/bd-utils/
├── src/
│   ├── index.ts       # 导出 open
│   └── open.ts       # 实现
├── package.json      # 添加 better-opn 依赖
└── scripts/          # 构建脚本（已存在）
```

## 依赖配置

```json
{
  "dependencies": {
    "better-opn": "^3.0.0"
  }
}
```

注意：`better-opn` 会自动携带 `open` 库作为依赖。

## 实现步骤

1. 安装 `better-opn` 依赖
2. 创建 `packages/bd-utils/src/open.ts` 实现
3. 在 `packages/bd-utils/src/index.ts` 导出
4. 添加单元测试
5. 构建验证

## 错误处理

- 浏览器未安装：回退到系统默认浏览器
- 无效 URL：抛出错误
- 权限问题（AppleScript）：静默回退到 `open` 库

## 参考资料

- [better-opn](https://github.com/ExiaSR/better-opn) - 核心库
- [Vite openBrowser.js](https://github.com/vitejs/vite/blob/main/packages/vite/bin/openChrome.js) - 类似实现
- [facebook/create-react-app](https://github.com/facebook/create-react-app/blob/master/packages/react-dev-utils/openBrowser.js) - 原始实现
