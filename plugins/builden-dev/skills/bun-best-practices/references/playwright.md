# Playwright E2E 测试

Bun 内置测试框架和 Playwright 都会扫描 `.spec.ts` 和 `.test.ts` 文件，导致冲突。

## 解决方案

### 使用 `.e2e.ts` 后缀

Playwright 配置 `testMatch` 只识别 `.e2e.ts`

### 分离测试文件

- E2E 测试放 `tests/e2e/`
- 集成测试放 `tests/integration/`
- 单元测试放源码目录

## Playwright 配置

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

## 运行 E2E 测试

```bash
npx playwright test
```
