---
name: bun-mono-lib
description: Use when creating npm packages in bun monorepo that will be published as public libraries with shared build scripts
---

# Bun Monorepo Tool Library

Create and publish npm packages in a bun monorepo with shared build utilities.

## Package Structure

```
packages/
  bd-utils/
    src/
      index.ts          # 主入口
      find-package.ts   # 工具函数
      detect-pm.ts      # 工具函数
      upgrade.ts        # 主功能
    scripts/
      build.ts          # 共享构建脚本
    build.ts            # 构建入口
    package.json        # 包配置
```

## package.json Configuration

### Basic Fields

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

### Exports Field (ESM + CJS)

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

### Dependencies Strategy

**Runtime dependencies (CLI tools):** Use `peerDependencies` + `devDependencies`

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

**Why:** CLI tools should use the version from the consuming project, not bundle their own copy.

### Remove Redundant Fields

When using `exports` field, remove redundant fields:

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

## Shared Build Scripts

Create shared build utility in `scripts/build.ts`:

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

### Naming Convention

**Important:** Name the build directory `scripts/` not `build/` to avoid conflict with the build output directory.

```
❌ packages/bd-utils/build/      # 与 dist/build 冲突
✅ packages/bd-utils/scripts/    # 安全
```

## Consuming Packages

Update consuming package to use shared build:

```typescript
// packages/bd-color/build.ts
import { buildPkg } from "@builden/bd-utils/scripts";

await buildPkg({
  entrypoint: "./src/index.ts",
  outDir: "./dist",
  external: ["picocolors"],
});
```

Update `package.json`:

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

## Code Patterns

### Import from Package

```typescript
// ❌ 直接复制代码
function findPackageJson(): string { ... }

// ✅ 从包导入
import { findPackageJson } from "@builden/bd-utils";
```

### Avoid Duplicate Functions

Before committing, check for duplicates:

```bash
grep -r "function findPackageJson" packages/
grep -r "function detectPackageManager" packages/
```

## Publishing

### Pre-publish Checklist

1. Update version in `package.json`
2. Build: `bun run build`
3. Test: `bun test`
4. Publish: `npm publish --access public`

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

## Common Mistakes

### ❌ Bundling runtime dependencies

```json
{
  "dependencies": {
    "execa": "^9.0.0" // 错误！CLI 包应该用 peerDependencies
  }
}
```

✅ Use `peerDependencies` for runtime deps

### ❌ Naming conflict

```
build/
  index.ts    # ❌ 与 build/index.js 冲突
scripts/
  build.ts    # ✅ 安全
```

### ❌ Missing exports field types

```json
{
  "exports": {
    ".": {
      "import": "./src/index.ts" // ❌ 缺少 types
    }
  }
}
```

✅ Always include `types` in exports

### ❌ Duplicate code across packages

✅ Refactor to shared package, import instead of copy
