# Lightpanda 轻量级浏览器

Lightpanda 是一个用 Zig 从头编写的轻量级头戴浏览器，11x 更快，9x 更低内存。通过 CDP 协议与 Playwright/Puppeteer 兼容。

## 目录

- [安装](#安装)
- [Playwright 配置](#playwright-配置)
- [适用场景](#适用场景)
- [限制](#限制)

---

## 安装

### macOS

```bash
curl -L https://github.com/lightpanda-io/browser/releases/latest/download/lipanda-macos.tar.gz | tar xz
```

### Linux

```bash
curl -L https://github.com/lightpanda-io/browser/releases/latest/download/lipanda-linux.tar.gz | tar xz
```

### 启动 CDP Server

```bash
./lightpanda serve --port 9222
```

---

## Playwright 配置

### 方法 1：直接连接 CDP

```typescript
import { chromium } from '@playwright/test';

async function run() {
  // 连接 Lightpanda CDP server
  const browser = await chromium.connectOverCDP('http://localhost:9222');

  const page = await browser.newPage();
  await page.goto('http://localhost:5173');

  // 正常 Playwright 操作
  await page.click('button#submit');
  await expect(page.locator('.result')).toHaveText('Success');

  await browser.close();
}

run();
```

### 方法 2：Playwright 配置文件

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    {
      name: 'lightpanda',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          // 不启动浏览器，而是连接外部 CDP
          channel: 'chrome',
        },
      },
    },
  ],
});
```

### 方法 3：环境变量切换

```bash
# 使用 Lightpanda
LIGHTPANDA=true bun run test:e2e

# 使用标准 Chromium
bun run test:e2e
```

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    process.env.LIGHTPANDA
      ? {
          name: 'lightpanda',
          use: { ...devices['Desktop Chrome'] },
          webServer: undefined,
        }
      : {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
  ],
});
```

---

## 适用场景

Lightpanda 适合以下场景：

| 场景     | 适用度    | 说明                       |
| -------- | --------- | -------------------------- |
| 表单验证 | ✅ 适用   | 输入、提交、验证           |
| 异步操作 | ✅ 适用   | fetch、setTimeout、Promise |
| 导航跳转 | ✅ 适用   | click links, routing       |
| 拖拽     | ❌ 不适用 | Web API 不完整             |
| 动画     | ⚠️ 有限   | 基础动画可能可用           |
| 多浏览器 | ❌ 不适用 | 仅 Chromium                |

---

## 限制

### Web API 支持

Lightpanda 的 Web API 支持仍在完善中。以下功能可能不可用：

- 完整拖拽 API（Drag and Drop API）
- 某些 CSS 动画
- WebRTC
- Service Worker（部分）

### 检查兼容性

在生产环境使用前，建议先验证关键功能：

```typescript
test('关键功能兼容性检查', async ({ page }) => {
  // 检查拖拽 API
  const hasDragAPI = await page.evaluate(() => {
    return 'draggable' in document.createElement('div');
  });
  expect(hasDragAPI).toBe(true);
});
```

---

## 性能对比

| 指标     | Chromium | Lightpanda | 提升 |
| -------- | -------- | ---------- | ---- |
| 启动时间 | ~3s      | ~300ms     | 10x  |
| 内存占用 | ~300MB   | ~30MB      | 10x  |
| 页面加载 | 基准     | 相当       | -    |

> 实际性能取决于具体场景和页面复杂度。
