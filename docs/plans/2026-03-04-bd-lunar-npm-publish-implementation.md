# bd-lunar 发布到 npm 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 @builden/bd-lunar 包发布到 npm，支持 ESM 和 CJS 两种模块格式。

**Architecture:** 参考 bd-color 的发布配置，添加 package.json 字段、.npmignore、CLAUDE.md 和 README.md。

**Tech Stack:** npm, TypeScript (tsc)

---

### Task 1: 更新 package.json 配置

**Files:**

- Modify: `packages/bd-lunar/package.json`

**Step 1: 添加必要字段**

```json
{
  "type": "module",
  "files": ["dist", "src"],
  "module": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./src/index.ts",
      "require": "./dist/index.js"
    }
  },
  "publishConfig": {
    "access": "public"
  }
}
```

**Step 2: 验证 package.json 格式正确**

Run: `cat packages/bd-lunar/package.json | head -30`
Expected: 包含上述新增字段

---

### Task 2: 创建 .npmignore 文件

**Files:**

- Create: `packages/bd-lunar/.npmignore`

**Step 1: 写入过滤规则**

```
*.test.ts
*.spec.ts
tsconfig.json
.bun/
coverage/
bun.lockb
.git/
```

**Step 2: 验证文件创建**

Run: `ls -la packages/bd-lunar/.npmignore`
Expected: 文件存在

---

### Task 3: 创建 CLAUDE.md 开发指南

**Files:**

- Create: `packages/bd-lunar/CLAUDE.md`

**Step 1: 写入开发指南**

````markdown
# bd-lunar 开发指南

## 构建

```bash
bun run build
```
````

构建使用 `tsc` 编译 TypeScript 到 `dist/` 目录。

## 发布到 npm

### 首次发布

```bash
npm publish
```

### 配置要点

| 字段                   | 值                    | 说明             |
| ---------------------- | --------------------- | ---------------- |
| `type`                 | `"module"`            | 使用 ESM         |
| `files`                | `["dist", "src"]`     | 发布 dist 和源码 |
| `module`               | `"./src/index.ts"`    | bundler 入口     |
| `exports.import`       | `"./src/index.ts"`    | ESM 入口         |
| `exports.types`        | `"./dist/index.d.ts"` | 类型声明         |
| `exports.require`      | `"./dist/index.js"`   | CJS 入口         |
| `publishConfig.access` | `"public"`            | 公开 scope 包    |

## 验证

发布前验证：

```bash
# 构建
bun run build

# Node.js 测试 dist
node -e "import('./dist/index.js').then(console.log)"

# Bun 测试
bun -e "import('./dist/index.js').then(console.log)"

# 运行测试
bun test
```

````

---

### Task 4: 创建 README.md 文档

**Files:**

- Create: `packages/bd-lunar/README.md`

**Step 1: 写入 README 内容**

```markdown
# @builden/bd-lunar

农历工具包，提供阳历阴历转换、时辰计算等功能。

## 安装

```bash
npm install @builden/bd-lunar
````

## 功能

### dayjs 插件

```typescript
import dayjs from "dayjs";
import lunarPlugin from "@builden/bd-lunar";

dayjs.extend(lunarPlugin);

dayjs().format("YYYY年M月D日");
// => "2026年3月4日"
```

### 农历转换

```typescript
import { solarToLunar, lunarToSolar, getLunarInfo } from "@builden/bd-lunar";

// 阳历转阴历
const lunar = solarToLunar(2026, 3, 4);
console.log(lunar);
// => { year: 2026, month: 1, day: 16, isLeap: false, ... }

// 阴历转阳历
const solar = lunarToSolar(2026, 1, 16);
console.log(solar);
// => { year: 2026, month: 3, day: 4 }

// 获取农历信息
const info = getLunarInfo(new Date());
```

### 时辰计算

```typescript
import { getShichen, SHICHEN_LIST } from "@builden/bd-lunar";

// 获取当前时辰
const shichen = getShichen(new Date());
console.log(shichen);
// => "寅时"

// 十二时辰列表
console.log(SHICHEN_LIST);
// => ["子时", "丑时", "寅时", ...]
```

## 类型

详见 `dist/index.d.ts`

```

---

### Task 5: 构建并验证

**Files:**

- Modify: `packages/bd-lunar/package.json`

**Step 1: 安装依赖**

Run: `cd packages/bd-lunar && bun install`
Expected: 依赖安装完成

**Step 2: 构建**

Run: `cd packages/bd-lunar && bun run build`
Expected: 构建成功，dist/ 目录生成文件

**Step 3: 验证 dist 可用**

Run: `cd packages/bd-lunar && node -e "import('./dist/index.js').then(m => console.log(Object.keys(m)))"`
Expected: 输出导出模块列表

**Step 4: 运行测试**

Run: `cd packages/bd-lunar && bun test`
Expected: 所有测试通过

---

### Task 6: 提交代码

**Step 1: 查看变更**

Run: `git status`
Expected: 显示新增和修改的文件

**Step 2: 提交**

Run: `git add packages/bd-lunar/package.json packages/bd-lunar/.npmignore packages/bd-lunar/CLAUDE.md packages/bd-lunar/README.md && git commit -m "feat(bd-lunar): 配置 npm 发布相关文件"`
Expected: 提交成功

---

### Task 7: 发布到 npm

**Step 1: 发布**

Run: `cd packages/bd-lunar && npm publish`
Expected: 发布成功，输出包地址

**Step 2: 验证**

Run: `npm view @builden/bd-lunar`
Expected: 显示包信息

---
```
