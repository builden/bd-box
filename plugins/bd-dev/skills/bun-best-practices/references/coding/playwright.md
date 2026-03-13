# Playwright E2E 测试

Bun 内置测试框架和 Playwright 都会扫描 `.spec.ts` 和 `.test.ts` 文件，导致冲突。使用 `.e2e.ts` 后缀解决。

## 目录

- [基础配置](#基础配置)
- [Visual Testing](#visual-testing-可选)
- [输出目录](#输出目录)
- [最佳实践](#最佳实践)
- [AI 辅助测试生成](#ai-辅助测试生成)
- [开发服务器兼容](#开发服务器兼容)

---

## 基础配置

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: path.resolve(__dirname, 'tests/e2e'),
  testMatch: '**/*.e2e.ts', // 只识别 .e2e.ts
  timeout: 90000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry', // 失败时录制 trace
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

### 配置说明

| 配置                              | 说明                                      |
| --------------------------------- | ----------------------------------------- |
| `testMatch: "**/*.e2e.ts"`        | 只识别 .e2e.ts 文件，避免与 bun test 冲突 |
| `trace: "on-first-retry"`         | 首次失败时录制 trace，用于调试            |
| `forbidOnly: !!process.env.CI`    | CI 环境中禁止 `.only`                     |
| `retries: process.env.CI ? 2 : 0` | CI 中重试 2 次                            |

---

## Visual Testing（可选）

使用 `expect(page).toHaveScreenshot()` 进行视觉回归测试：

- 首次运行生成基准截图
- 后续运行自动比对差异
- 适用于组件库样式验证、关键页面一致性

```typescript
import { test, expect } from '@playwright/test';

test('homepage visual', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot();
});
```

---

## 输出目录

Playwright 输出目录需要加入 `.gitignore`：

```
# 测试输出
test-results/
.playwright/
playwright-report/
```

首次使用需创建 `.gitkeep` 占位：

```bash
mkdir -p tests/test-results
touch tests/test-results/.gitkeep
```

---

## 最佳实践

### 测试哲学

- **测试用户可见行为**：验证功能而非实现细节（不测函数名、数组结构、CSS 类名）
- **测试隔离**：每个测试独立运行，有自己的 localStorage/cookie/数据
- **只测可控部分**：避免测试第三方外部链接或 API

### Locator 选择

**优先使用 user-facing locators**：

```typescript
// ✓ 推荐
page.getByRole('button', { name: 'Submit' });
page.getByText('Welcome');
page.getByLabel('Email');

// ✗ 避免
page.locator('.btn-primary');
page.locator('div:nth-child(2)');
```

Playwright locators 有 auto-waiting，不需要手动 wait。

### 测试组织

- 使用 `test.describe` 分组
- 使用 `test.step` 分解测试步骤（便于调试）
- 使用 fixtures 共享 setup/teardown

### CI/CD

- 保持 Playwright 版本更新
- 使用 trace 替代 video（开销更小）
- 配置 `forbidOnly: !!process.env.CI`

---

## AI 辅助测试生成

### agent-browser（Vercel 官方）

浏览器自动化 CLI，专为零碎浏览器任务设计：

```bash
npx agent-browser https://example.com
agent-browser https://example.com --interactive
agent-browser screenshot --annotate
```

特点：

- 支持 annotated screenshots（带编号元素标签）
- 支持 `-i` 只显示交互元素
- 支持 `-C` 包含 cursor:pointer 元素

### Playwright Codegen

录制浏览器操作自动生成测试：

```bash
npx playwright codegen --output tests/e2e/login.e2e.ts http://localhost:3000
```

### Playwright MCP

AI 代理基于 accessibility tree 生成测试（推荐）：

- 需要配置 MCP 服务器
- 支持自然语言描述测试场景
- 自动生成 `getByRole`、`getByLabel` 等稳定 locators

---

## 开发服务器兼容

### portless 兼容

当项目使用 [portless](https://github.com/vercel-labs/portless) 时，使用环境变量配置 baseURL：

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
  },
});
```

运行时传入 URL：

```bash
BASE_URL=http://myapp.localhost bun run test:e2e
```

---

## 运行命令

```bash
bun run test:e2e     # Playwright E2E 测试
```

或使用 npx：

```bash
npx playwright test
```
