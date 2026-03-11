# 常见错误及解决方案

## 包发布

### ❌ 打包运行时依赖

```json
{
  "dependencies": {
    "execa": "^9.0.0" // 错误！CLI 包应该用 peerDependencies
  }
}
```

✅ 使用 `peerDependencies` 用于运行时依赖

### ❌ 命名冲突

```
build/
  index.ts    # ❌ 与 build/index.js 冲突
scripts/
  build.ts    # ✅ 安全
```

### ❌ 缺少 exports types

```json
{
  "exports": {
    ".": {
      "import": "./src/index.ts" // ❌ 缺少 types
    }
  }
}
```

✅ 始终在 exports 中包含 `types`

### ❌ 代码重复

✅ 重构到共享包，使用导入代替复制

## 测试

### ❌ Bun test 与 Playwright 文件冲突

Bun 和 Playwright 都扫描 `.spec.ts` 和 `.test.ts`。

✅ 使用 `.e2e.ts` 后缀分离 Playwright 测试

```typescript
// playwright.config.ts
testMatch: "**/*.e2e.ts", // 只识别 .e2e.ts
```

### ❌ 缺少 setup.ts

✅ 创建 `tests/setup.ts` 注册 happy-dom

```typescript
import { GlobalRegistrator } from "@happy-dom/global-registrator";
GlobalRegistrator.register();
```

### ❌ 缺少超时配置

✅ 长时间运行的测试添加超时

```typescript
test("slow test", async () => {
  await someSlowOperation();
}, 30000);
```

## Monorepo

### ❌ 根目录包含业务依赖

✅ 根目录只放 devDependencies，业务依赖放各包

### ❌ 使用固定版本号引用内部包

```json
// ❌
"dependencies": {
  "my-lib": "1.0.0"
}
```

✅ 使用 workspace 协议

```json
// ✅
"dependencies": {
  "my-lib": "workspace:*"
}
```
