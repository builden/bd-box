# Release 配置

本文件包含两部分：

1. **发布工具配置**：使用 release-it 管理版本发布
2. **npm 包配置**：package.json 字段、依赖策略、构建脚本

---

## 第一部分：release-it 发布工具

### 安装

```bash
bun add -D release-it
```

### 配置 .release-it.json

```json
{
  "git": {
    "commitMessage": "chore(release): v${version}",
    "tagName": "v${version}"
  },
  "npm": {
    "publish": false
  },
  "github": {
    "release": true,
    "releaseName": "${name} v${version}"
  },
  "hooks": {
    "before:init": ["bun run build"]
  },
  "plugins": {
    "@release-it/conventional-changelog": {
      "infile": "CHANGELOG.md"
    }
  }
}
```

## 配置说明

| 字段                | 说明                                               |
| ------------------- | -------------------------------------------------- |
| `git.commitMessage` | 提交信息模板                                       |
| `git.tagName`       | Git tag 格式                                       |
| `npm.publish`       | 是否发布到 npm（设为 false 仅生成 GitHub Release） |
| `github.release`    | 是否创建 GitHub Release                            |
| `hooks.before:init` | 发布前执行的命令（如构建）                         |
| `plugins`           | CHANGELOG 生成插件                                 |

## package.json 脚本

```json
{
  "scripts": {
    "release": "bunx release-it",
    "release:patch": "bunx release-it patch",
    "release:minor": "bunx release-it minor",
    "release:major": "bunx release-it major"
  }
}
```

## 使用

```bash
# 交互式选择版本
bun run release

# 直接发布补丁版本
bun run release:patch

# 发布次版本
bun run release:minor

# 发布主版本
bun run release:major
```

## 常见问题

### 不需要发布到 npm

设置 `"npm.publish": false`，只生成 GitHub Release。

### 不需要 CHANGELOG

移除 `plugins` 配置。

### 不需要 GitHub Release

设置 `"github.release": false`。

### Windows 环境

release-it 跨平台，但如果遇到问题，确保使用 Git Bash 或 WSL。

---

## 第二部分：npm 包配置

### package.json 基础字段

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

### 依赖策略：CLI 工具

CLI 工具应使用 peerDependencies + devDependencies：

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

### 共享构建脚本

创建 `scripts/build.ts`：

```typescript
import { execa } from 'execa';

export interface BuildOptions {
  entrypoint: string;
  outDir: string;
  external: string[];
}

export async function buildPkg(options: BuildOptions): Promise<void> {
  const { entrypoint, outDir, external } = options;

  // 1. Generate TypeScript declarations
  await execa('bun', [
    'x',
    'tsc',
    '--declaration',
    '--emitDeclarationOnly',
    '--outDir',
    outDir,
    '--project',
    'tsconfig.json',
  ]);

  // 2. Build ESM
  await execa('bun', [
    'build',
    entrypoint,
    '--outdir',
    outDir,
    '--target',
    'node',
    '--format',
    'esm',
    '--external',
    ...external,
  ]);

  // 3. Build CJS
  await execa('bun', [
    'build',
    entrypoint,
    '--outdir',
    outDir,
    '--target',
    'node',
    '--format',
    'cjs',
    '--external',
    ...external,
    '--outfile',
    'index.cjs',
  ]);
}
```

**注意**：将构建目录命名为 `scripts/` 而不是 `build/`，避免与输出目录冲突。

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
