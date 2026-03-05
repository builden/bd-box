# @builden/bd-utils

公共工具库

## 安装

```bash
npm install @builden/bd-utils
```

## 依赖

本库需要以下 peer dependencies：

```bash
npm install execa ora picocolors
```

或使用 yarn/pnpm：

```bash
yarn add execa ora picocolors
pnpm add execa ora picocolors
```

## 使用

### CLI 升级功能

```typescript
import { upgradeSelf } from "@builden/bd-utils";

// 自动检测并升级
await upgradeSelf();

// 自定义选项
await upgradeSelf({
  packageName: "@builden/my-cli",
  currentVersion: "1.0.0",
  silent: true,
});
```

### 查找 package.json

```typescript
import { findPackageJson } from "@builden/bd-utils";

const pkgPath = findPackageJson();
```

### 检测包管理器

```typescript
import { detectPackageManager } from "@builden/bd-utils";

const pm = await detectPackageManager();
// 返回 { name: 'npm', command: 'npm', args: ['install', '-g', 'package'] } 或 null
```

## API

### upgradeSelf(options?)

| 参数                   | 类型    | 说明                               |
| ---------------------- | ------- | ---------------------------------- |
| options.packageName    | string  | 包名，默认从 package.json 读取     |
| options.currentVersion | string  | 当前版本，默认从 package.json 读取 |
| options.silent         | boolean | 静默模式，不输出日志               |

### findPackageJson()

向上遍历目录查找 package.json。

### detectPackageManager()

检测当前使用的包管理器 (bun/npm/yarn/pnpm)。
