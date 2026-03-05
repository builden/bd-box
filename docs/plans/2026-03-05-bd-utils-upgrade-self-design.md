# bd-utils CLI 升级功能设计

## 概述

将 git-src 中的 `upgradeSelf` 功能封装为独立的公共库 `@builden/bd-utils`，供其他 CLI 工具复用。

## 背景

当前 git-src CLI 实现了自我升级功能，包含：

- 自动查找 package.json
- 检测包管理器 (bun/npm/yarn/pnpm)
- 检查最新版本并执行升级

未来计划有多个 CLI 工具需要此功能，因此需要封装为公共库。

## 设计

### 包信息

| 项目 | 值                   |
| ---- | -------------------- |
| 包名 | `@builden/bd-utils`  |
| 路径 | `packages/bd-utils/` |
| 类型 | TypeScript ESM       |

### 目录结构

```
packages/bd-utils/
├── src/
│   ├── index.ts        # 入口，导出 upgradeSelf
│   ├── upgrade.ts      # 核心升级逻辑
│   └── types.ts        # 类型定义
├── package.json
└── tsconfig.json
```

### 导出 API

```typescript
// 主函数
export async function upgradeSelf(options?: UpgradeOptions): Promise<void>;

// 选项
interface UpgradeOptions {
  packageName?: string; // 包名，默认从 package.json 读取
  currentVersion?: string; // 当前版本，默认从 package.json 读取
  silent?: boolean; // 静默模式，不输出日志
}
```

### 内部函数

| 函数                     | 说明                          |
| ------------------------ | ----------------------------- |
| `findPackageJson()`      | 向上遍历目录查找 package.json |
| `detectPackageManager()` | 检测当前使用的包管理器        |

### 依赖管理

使用 **peerDependencies** 避免打包重复：

```json
{
  "peerDependencies": {
    "execa": "^9.0.0",
    "ora": "^8.0.0",
    "picocolors": "^1.0.0"
  }
}
```

调用方（如 git-src）需要安装这些依赖。

### 使用方式

```typescript
import { upgradeSelf } from "@builden/bd-utils";

// 默认行为 - 自动检测
await upgradeSelf();

// 自定义选项
await upgradeSelf({
  packageName: "@builden/my-cli",
  currentVersion: "1.0.0",
});
```

## 实现步骤

1. 创建 `packages/bd-utils/` 目录结构
2. 实现核心升级逻辑
3. 配置 peerDependencies
4. 在 git-src 中引入并测试
5. 更新 CLAUDE.md 文档

## 风险与注意事项

- 需要确保 findPackageJson 在不同调用场景下都能正确工作
- 全局安装需要相应权限
- Windows 路径兼容性
