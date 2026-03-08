# Bun Test 测试框架

使用 `bun test` + `happy-dom`，不用 vitest 或 jsdom。

## 基础配置

### bunfig.toml

```toml
# bunfig.toml
[test]
preload = ["./tests/setup.ts"]
```

### setup.ts

```typescript
// tests/setup.ts
import { GlobalRegistrator } from "@happy-dom/global-registrator";
GlobalRegistrator.register();
```

### 依赖安装

```json
{
  "devDependencies": {
    "happy-dom": "^16.7.2",
    "@happy-dom/global-registrator": "^16.7.2"
  }
}
```

## 测试导入

```typescript
import { describe, it, expect, beforeEach, mock } from 'bun:test';

// mock 模块
mock.module('mermaid', () => ({
  default: { ... }
}));
```

## 超时配置

```typescript
test("slow test", async () => {
  await someSlowOperation();
}, 30000); // 30 seconds
```

## 测试文件组织

### 单元测试

与源文件同级目录：

```
src/
  utils.ts
  utils.test.ts      # 单元测试
```

### 集成/E2E/冒烟测试

放在 `tests/` 目录：

```
tests/
├── integration/    # 集成测试
├── e2e/           # E2E 测试
└── smoke/         # 冒烟测试
```

## Bun test 与 Playwright 共存

Bun 内置测试框架和 Playwright 都会扫描 `.spec.ts` 和 `.test.ts` 文件，导致冲突。

### 解决方案

1. **使用 `.e2e.ts` 后缀**：Playwright 配置 `testMatch` 只识别 `.e2e.ts`

2. **分离测试文件**：
   - E2E 测试放 `tests/e2e/`
   - 集成测试放 `tests/integration/`
   - 单元测试放源码目录

### Playwright 配置

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";
import path from "path";

export default defineConfig({
  testDir: path.resolve(__dirname, "tests/e2e"),
  testMatch: "**/*.e2e.ts", // 只识别 .e2e.ts
  timeout: 90000,
  // ...
});
```

## 运行测试

```bash
# 运行单元测试
bun test

# 运行特定测试
bun run test -- -t "test name"

# 指定文件
bun run test:file -- "glob"

# 运行 E2E 测试
npx playwright test
```

## 常用命令

```bash
# 类型检查
bun run typecheck

# 运行测试
bun run test -- -t "test name"   # 单个测试
bun run test:file -- "glob"      # 指定文件

# 代码检查
bun run lint                     # 全部
bun run lint -- "file.ts"        # 指定文件

# 提交前检查
bun run lint:claude && bun run test
```
