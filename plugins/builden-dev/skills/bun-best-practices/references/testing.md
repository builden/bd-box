# Bun Test 测试框架

使用 `bun test` + `happy-dom`，不用 vitest 或 jsdom。

## 目录

- [基础配置](#基础配置)
- [测试导入](#测试导入)
- [超时配置](#超时配置)
- [测试文件组织](#测试文件组织)
- [运行测试](#运行测试)
- [常用命令](#常用命令)

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

### 集成/冒烟测试

放在 `tests/` 目录：

```
tests/
├── integration/    # 集成测试
└── smoke/         # 冒烟测试
```

## 运行测试

```bash
# 运行单元测试
bun test

# 运行特定测试
bun run test -- -t "test name"

# 指定文件
bun run test:file -- "glob"
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

## Bun test 与 Playwright 共存

详见 [playwright.md](playwright.md)。
