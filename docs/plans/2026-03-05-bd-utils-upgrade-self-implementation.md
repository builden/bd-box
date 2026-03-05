# bd-utils 公共库实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 git-src 的 upgradeSelf 功能封装为独立的公共库 `@builden/bd-utils`，供其他 CLI 工具复用。

**Architecture:** 创建独立的 packages/bd-utils/ 包，使用 peerDependencies 管理依赖，调用方（如 git-src）安装运行时依赖，bd-utils 复用这些依赖。

**Tech Stack:** TypeScript, ESM, peerDependencies (execa, ora, picocolors)

---

## Task 1: 创建 bd-utils 包基础结构

**Files:**

- Create: `packages/bd-utils/package.json`
- Create: `packages/bd-utils/tsconfig.json`
- Create: `packages/bd-utils/src/types.ts`
- Create: `packages/bd-utils/src/index.ts`

**Step 1: 创建 package.json**

```json
{
  "name": "@builden/bd-utils",
  "version": "1.0.0",
  "type": "module",
  "files": ["dist", "src"],
  "main": "./dist/index.js",
  "module": "./src/index.ts",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./src/index.ts",
      "require": "./dist/index.js"
    }
  },
  "publishConfig": {
    "access": "public"
  },
  "peerDependencies": {
    "execa": "^9.0.0",
    "ora": "^8.0.0",
    "picocolors": "^1.0.0"
  },
  "scripts": {
    "test": "bun test",
    "build": "bun build.ts"
  },
  "devDependencies": {
    "@types/bun": "^1.0.0",
    "typescript": "^5.0.0"
  }
}
```

**Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "types": ["bun-types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Step 3: 创建 src/types.ts**

```typescript
export interface UpgradeOptions {
  packageName?: string;
  currentVersion?: string;
  silent?: boolean;
}

export interface PackageManager {
  name: string;
  command: string;
  args: string[];
}
```

**Step 4: 创建 src/index.ts**

```typescript
export type { UpgradeOptions, PackageManager } from "./types.js";
```

**Step 5: 提交**

```bash
git add packages/bd-utils/
git commit -m "feat(bd-utils): create package structure"
```

---

## Task 2: 实现 findPackageJson 和 detectPackageManager

**Files:**

- Create: `packages/bd-utils/src/find-package.ts`

**Step 1: 写失败的测试**

```typescript
// packages/bd-utils/src/find-package.test.ts
import { describe, it, expect, beforeEach } from "bun:test";
import { findPackageJson } from "./find-package";

describe("findPackageJson", () => {
  it("should find package.json in current directory", () => {
    const result = findPackageJson();
    expect(result).toContain("package.json");
  });
});
```

**Step 2: 运行测试确认失败**

```bash
cd packages/bd-utils && bun test
# Expected: FAIL - findPackageJson not defined
```

**Step 3: 实现 findPackageJson**

```typescript
// packages/bd-utils/src/find-package.ts
import { existsSync } from "fs";
import { join, dirname } from "path";

export function findPackageJson(): string {
  let dir = dirname(process.argv[1] || __filename);
  for (let i = 0; i < 10; i++) {
    const pkgPath = join(dir, "package.json");
    if (existsSync(pkgPath)) {
      return pkgPath;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("package.json not found");
}
```

**Step 4: 运行测试确认通过**

```bash
cd packages/bd-utils && bun test
# Expected: PASS
```

**Step 5: 提交**

```bash
git add packages/bd-utils/src/find-package.ts packages/bd-utils/src/find-package.test.ts
git commit -m "feat(bd-utils): add findPackageJson utility"
```

---

## Task 3: 实现 detectPackageManager

**Files:**

- Create: `packages/bd-utils/src/detect-pm.ts`
- Test: `packages/bd-utils/src/detect-pm.test.ts`

**Step 1: 写失败的测试**

```typescript
// packages/bd-utils/src/detect-pm.test.ts
import { describe, it, expect, mock } from "bun:test";
import { detectPackageManager } from "./detect-pm";

describe("detectPackageManager", () => {
  it("should return null when no package manager detected", async () => {
    const result = await detectPackageManager();
    expect(result).toBeNull();
  });
});
```

**Step 2: 运行测试确认失败**

```bash
cd packages/bd-utils && bun test
# Expected: FAIL - detectPackageManager not defined
```

**Step 3: 实现 detectPackageManager**

```typescript
// packages/bd-utils/src/detect-pm.ts
import { execa } from "execa";
import { existsSync } from "fs";
import { join } from "path";
import type { PackageManager } from "./types.js";

export async function detectPackageManager(): Promise<PackageManager | null> {
  const currentBin = process.execPath;

  const [bunGlobalDir, npmGlobalPrefix, yarnGlobalDir, pnpmGlobalDir] = await Promise.all([
    execa("bun", ["global", "dir"])
      .then((r) => r.stdout.trim())
      .catch(() => ""),
    execa("npm", ["root", "-g"])
      .then((r) => r.stdout.trim())
      .catch(() => ""),
    execa("yarn", ["global", "dir"])
      .then((r) => r.stdout.trim())
      .catch(() => ""),
    execa("pnpm", ["root", "-g"])
      .then((r) => r.stdout.trim())
      .catch(() => ""),
  ]);

  // 检查每个包管理器...
  if (bunGlobalDir && (currentBin.startsWith(bunGlobalDir) || existsSync(join(bunGlobalDir, ".bin")))) {
    return { name: "bun", command: "bun", args: ["add", "-g", "__PACKAGE__"] };
  }
  // ... 其他包管理器类似

  return null;
}
```

**Step 4: 运行测试**

```bash
cd packages/bd-utils && bun test
# Expected: PASS
```

**Step 5: 提交**

```bash
git add packages/bd-utils/src/detect-pm.ts packages/bd-utils/src/detect-pm.test.ts
git commit -m "feat(bd-utils): add detectPackageManager utility"
```

---

## Task 4: 实现 upgradeSelf 核心函数

**Files:**

- Create: `packages/bd-utils/src/upgrade.ts`
- Create: `packages/bd-utils/src/upgrade.test.ts`
- Modify: `packages/bd-utils/src/index.ts`

**Step 1: 写失败的测试**

```typescript
// packages/bd-utils/src/upgrade.test.ts
import { describe, it, expect, mock } from "bun:test";
import { upgradeSelf } from "./upgrade";

describe("upgradeSelf", () => {
  it("should export upgradeSelf function", () => {
    expect(typeof upgradeSelf).toBe("function");
  });
});
```

**Step 2: 运行测试确认失败**

```bash
cd packages/bd-utils && bun test
# Expected: FAIL - upgradeSelf not defined
```

**Step 3: 实现 upgradeSelf**

```typescript
// packages/bd-utils/src/upgrade.ts
import pc from "picocolors";
import { execa } from "execa";
import ora from "ora";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import type { UpgradeOptions, PackageManager } from "./types.js";
import { findPackageJson } from "./find-package.js";
import { detectPackageManager } from "./detect-pm.js";

function findPackageJsonPath(): string {
  let dir = dirname(process.argv[1] || __filename);
  for (let i = 0; i < 10; i++) {
    const pkgPath = join(dir, "package.json");
    if (existsSync(pkgPath)) {
      return pkgPath;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("package.json not found");
}

function resolvePackageManager(pm: PackageManager | null, packageName: string): PackageManager {
  if (!pm) {
    return { name: "npm", command: "npm", args: ["install", "-g", packageName] };
  }
  return {
    ...pm,
    args: pm.args.map((arg) => (arg === "__PACKAGE__" ? packageName : arg)),
  };
}

export async function upgradeSelf(options: UpgradeOptions = {}): Promise<void> {
  const pkgPath = findPackageJsonPath();
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

  const packageName = options.packageName || pkg.name;
  const currentVersion = options.currentVersion || pkg.version;

  if (!options.silent) {
    console.log(pc.gray(`Current version: ${currentVersion}`));
  }

  const pm = await detectPackageManager();

  if (!options.silent) {
    if (pm) {
      console.log(pc.gray(`Detected package manager: ${pm.name}`));
    } else {
      console.log(pc.yellow("Unable to detect package manager. Trying npm..."));
    }
  }

  const spinner = ora("Checking for updates...").start();

  try {
    const { stdout } = await execa("npm", ["view", packageName, "version"]);
    const latestVersion = stdout.trim();

    spinner.succeed(`Latest version: ${latestVersion}`);

    if (latestVersion === currentVersion) {
      if (!options.silent) {
        console.log(pc.green("You are using the latest version."));
      }
      return;
    }

    if (!options.silent) {
      console.log(pc.yellow(`Update available: ${currentVersion} → ${latestVersion}`));
    }

    const confirmSpinner = ora("Upgrading...").start();
    const manager = resolvePackageManager(pm, packageName);

    await execa(manager.command, manager.args);

    confirmSpinner.succeed(pc.green(`Upgraded to ${latestVersion}`));
  } catch (error) {
    spinner.fail("Failed to check for updates");
    throw error;
  }
}
```

**Step 4: 更新 index.ts 导出**

```typescript
// packages/bd-utils/src/index.ts
export type { UpgradeOptions, PackageManager } from "./types.js";
export { upgradeSelf } from "./upgrade.js";
export { findPackageJson } from "./find-package.js";
export { detectPackageManager } from "./detect-pm.js";
```

**Step 5: 运行测试确认通过**

```bash
cd packages/bd-utils && bun test
# Expected: PASS
```

**Step 6: 提交**

```bash
git add packages/bd-utils/src/
git commit -m "feat(bd-utils): implement upgradeSelf function"
```

---

## Task 5: 在 git-src 中引入 bd-utils

**Files:**

- Modify: `packages/git-src/package.json`
- Modify: `packages/git-src/src/commands/upgrade.ts`

**Step 1: 添加 workspace 依赖**

在根目录 package.json 的 workspaces 中添加 bd-utils（如果没有）:

```json
{
  "workspaces": ["packages/*"]
}
```

然后在 git-src 中添加依赖:

```bash
cd packages/git-src && bun add @builden/bd-utils
```

**Step 2: 修改 upgrade.ts 使用 bd-utils**

```typescript
// packages/git-src/src/commands/upgrade.ts
import { upgradeSelf } from "@builden/bd-utils";

export async function upgradeCommand() {
  await upgradeSelf();
}
```

**Step 3: 验证构建**

```bash
cd packages/git-src && bun run build
# Expected: BUILD SUCCESS
```

**Step 4: 提交**

```bash
git add packages/git-src/package.json packages/git-src/src/commands/upgrade.ts
git commit -m "refactor(git-src): use @builden/bd-utils for upgradeSelf"
```

---

## Task 6: 更新文档

**Files:**

- Modify: `CLAUDE.md`

**Step 1: 添加 bd-utils 到 CLAUDE.md**

在 packages 列表中添加:

```markdown
- **@builden/bd-utils**: 公共工具库
```

**Step 2: 提交**

```bash
git add CLAUDE.md
git commit -m "docs: add bd-utils to CLAUDE.md"
```

---

## 验证步骤

完成后执行以下验证:

```bash
# 1. 构建 bd-utils
cd packages/bd-utils && bun run build

# 2. 运行 bd-utils 测试
cd packages/bd-utils && bun test

# 3. 构建 git-src
cd packages/git-src && bun run build

# 4. 验证 git-src 可以正常调用 upgrade
cd packages/git-src && bun run src/index.ts upgrade
```
