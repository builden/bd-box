# bd-utils open 方法实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 bd-utils 中实现 open 方法，支持 Mac 下 Chrome 标签页复用，以及打开文件夹功能

**Architecture:** 基于 better-opn 库实现跨平台打开 URL/文件功能，Mac 下通过 AppleScript 复用 Chrome 已有标签页

**Tech Stack:** TypeScript, better-opn

---

## 准备工作

### Task 1: 创建 worktree 并切换到新分支

**Step 1: 创建 worktree**

Run:

```bash
git worktree add .worktrees/open-feature -b feat/open-utility
```

**Step 2: 切换到 worktree 目录**

Run:

```bash
cd .worktrees/open-feature
```

---

## 实现步骤

### Task 2: 安装 better-opn 依赖

**Step 1: 进入 bd-utils 目录并安装依赖**

Run:

```bash
cd packages/bd-utils
bun add better-opn
```

**Step 2: 验证依赖已添加**

检查 `package.json` 中是否包含 `better-opn` 依赖

---

### Task 3: 创建 open.ts 实现

**Files:**

- Create: `packages/bd-utils/src/open.ts`

**Step 1: 编写测试**

```typescript
// packages/bd-utils/src/open.test.ts
import { describe, it, expect, mock } from "bun:test";
import { open } from "./open";

describe("open", () => {
  it("should export open function", () => {
    expect(typeof open).toBe("function");
  });

  it("should accept target URL string", () => {
    // 简单验证函数签名
    expect(open.length).toBeGreaterThanOrEqual(1);
  });
});
```

**Step 2: 运行测试验证失败**

Run:

```bash
cd packages/bd-utils && bun test src/open.test.ts
```

Expected: FAIL (open 模块不存在)

**Step 3: 实现 open.ts**

```typescript
// packages/bd-utils/src/open.ts
import opener from "better-opn";

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
export async function open(target: string, options?: OpenOptions): Promise<void> {
  const { app, wait } = options ?? {};

  await opener(target, {
    app: app ? [app] : undefined,
    wait: wait ?? false,
  });
}
```

**Step 4: 运行测试验证通过**

Run:

```bash
cd packages/bd-utils && bun test src/open.test.ts
```

Expected: PASS

---

### Task 4: 在 index.ts 导出 open

**Files:**

- Modify: `packages/bd-utils/src/index.ts`

**Step 1: 添加导出**

在 index.ts 中添加:

```typescript
export { open } from "./open.js";
export type { OpenOptions } from "./open.js";
```

**Step 2: 运行测试确认导出正常**

Run:

```bash
cd packages/bd-utils && bun test
```

Expected: PASS

---

### Task 5: 构建验证

**Step 1: 构建 package**

Run:

```bash
cd packages/bd-utils && bun run build
```

**Step 2: 验证构建产物**

检查 `dist/` 目录下是否生成了 `open.js` 和 `open.d.ts`

---

### Task 6: 手动测试功能

**Step 1: 创建测试脚本**

```typescript
// test-open.ts
import { open } from "./packages/bd-utils/src/open";

async function main() {
  // 测试打开 URL
  console.log("Opening URL...");
  await open("http://localhost:5173");
  console.log("Done");

  // 测试打开文件夹
  console.log("Opening folder...");
  await open("/tmp");
  console.log("Done");
}

main().catch(console.error);
```

**Step 2: 运行测试**

Run:

```bash
bun test-open.ts
```

---

## 提交变更

### Task 7: 提交代码

**Step 1: 查看变更**

Run:

```bash
git status
git diff
```

**Step 2: 暂存并提交**

Run:

```bash
git add packages/bd-utils/src/open.ts packages/bd-utils/src/open.test.ts packages/bd-utils/src/index.ts packages/bd-utils/package.json docs/plans/2026-03-06-open-utility-design.md
git commit -m "feat(bd-utils): add open utility with Chrome tab reuse support

- 基于 better-opn 实现跨平台打开 URL/文件
- Mac 下优先复用 Chrome 已有标签页
- 支持打开文件夹功能
- 添加单元测试"
```

---

## 后续步骤

完成实现后，可选择：

1. 合并到主分支并发布新版本
2. 在其他项目中开始使用此工具

---

**Plan complete and saved to `docs/plans/2026-03-06-open-utility-implementation.md`**

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
