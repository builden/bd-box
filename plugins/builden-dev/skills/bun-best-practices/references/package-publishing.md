# npm 包发布

创建并发布 Bun monorepo 中的 npm 包。

## 目录

- [package.json 配置](#package-json-配置)
- [依赖策略](#依赖策略)
- [共享构建脚本](#共享构建脚本)
- [发布流程](#发布流程)
- [代码模式](#代码模式)

## package.json 配置

### 基础字段

```json
{
  "name": "@builden/bd-utils",
  "version": "0.1.0",
  "type": "module",
  "private": false,
  "publishConfig": {
    "access": "public"
  }
}
```

### Exports 字段 (ESM + CJS)

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./src/index.ts",
      "require": "./dist/index.cjs"
    },
    "./scripts": {
      "import": "./scripts/build.ts"
    }
  }
}
```

### 移除冗余字段

使用 `exports` 字段时，删除冗余字段：

```json
// ❌ 删除这些
{
  "main": "./dist/index.js",
  "module": "./src/index.ts",
  "types": "./dist/index.d.ts"
}

// ✅ 只需要 exports
{
  "exports": { ... }
}
```

## 依赖策略

### CLI 工具：使用 peerDependencies + devDependencies

```json
{
  "peerDependencies": {
    "execa": "^9.0.0",
    "ora": "^8.0.0",
    "picocolors": "^1.0.0"
  },
  "devDependencies": {
    "execa": "^9.0.0",
    "ora": "^8.0.0",
    "picocolors": "^1.0.0"
  }
}
```

**原因**：CLI 工具应该使用消费项目的版本，而不是打包自己的副本。

## 共享构建脚本

### 创建共享构建工具

在 `scripts/build.ts` 中创建：

```typescript
import { execa } from "execa";
import { resolve } from "path";

export interface BuildOptions {
  entrypoint: string;
  outDir: string;
  external: string[];
}

export async function buildPkg(options: BuildOptions): Promise<void> {
  const { entrypoint, outDir, external } = options;

  // 1. Generate TypeScript declarations
  await execa("bun", [
    "x",
    "tsc",
    "--declaration",
    "--emitDeclarationOnly",
    "--outDir",
    outDir,
    "--project",
    "tsconfig.json",
  ]);

  // 2. Build ESM
  await execa("bun", [
    "build",
    entrypoint,
    "--outdir",
    outDir,
    "--target",
    "node",
    "--format",
    "esm",
    "--external",
    ...external,
  ]);

  // 3. Build CJS
  await execa("bun", [
    "build",
    entrypoint,
    "--outdir",
    outDir,
    "--target",
    "node",
    "--format",
    "cjs",
    "--external",
    ...external,
    "--outfile",
    "index.cjs",
  ]);
}
```

### 命名约定

**重要**：将构建目录命名为 `scripts/` 而不是 `build/`，避免与输出目录冲突。

```
❌ packages/bd-utils/build/      # 与 dist/build 冲突
✅ packages/bd-utils/scripts/    # 安全
```

### 消费包使用

更新消费包使用共享构建：

```typescript
// packages/bd-color/build.ts
import { buildPkg } from "@builden/bd-utils/scripts";

await buildPkg({
  entrypoint: "./src/index.ts",
  outDir: "./dist",
  external: ["picocolors"],
});
```

更新 `package.json`：

```json
{
  "dependencies": {
    "@builden/bd-utils": "workspace:*"
  },
  "scripts": {
    "build": "bun run ../bd-utils/build.ts"
  }
}
```

## 发布流程

### 发布前检查清单

1. 更新 `package.json` 中的版本号
2. 构建：`bun run build`
3. 测试：`bun test`
4. 发布：`npm publish --access public`

### .npmignore

```
node_modules/
src/
tests/
*.ts
!*.d.ts
.git/
.env
```

## 代码模式

### 从包导入

```typescript
// ❌ 直接复制代码
function findPackageJson(): string { ... }

// ✅ 从包导入
import { findPackageJson } from "@builden/bd-utils";
```

### 提交前检查重复

```bash
grep -r "function findPackageJson" packages/
grep -r "function detectPackageManager" packages/
```
