# Lint 规范

本文档定义 Bun 项目的代码检查（Lint）规范，包括 Prettier、ESLint、Husky、lint-staged 的配置和使用方式。

---

## 1. 概述

| 工具            | 作用               | 运行时机                |
| --------------- | ------------------ | ----------------------- |
| **Prettier**    | 代码格式化         | 手动 / lint-staged      |
| **ESLint**      | 代码质量检查       | 手动 / lint-staged / CI |
| **lint-staged** | 只检查 staged 文件 | pre-commit              |
| **Husky**       | Git hooks 管理     | commit 时触发           |
| **CI**          | 完整检查           | push / PR 时触发        |

---

## 2. Prettier 配置

### 2.1 基础配置

```json
// .prettierrc
{
  "printWidth": 120,
  "singleQuote": true,
  "trailingComma": "es5",
  "semi": true,
  "tabWidth": 2,
  "useTabs": false
}
```

### 2.2 .prettierignore

```gitignore
node_modules/
dist/
build/
*.min.js
*.css.map
*.map
coverage/
.turbo/
.output/
```

### 2.3 支持的文件类型

| 类型 | 扩展名                          |
| ---- | ------------------------------- |
| 代码 | `.ts`, `.tsx`, `.js`, `.jsx`    |
| 样式 | `.css`, `.scss`, `.less`        |
| 模板 | `.html`, `.vue`, `.svelte`      |
| 数据 | `.json`, `.jsonc`               |
| 其他 | `.md`, `.yaml`, `.yml`, `.toml` |

---

## 3. ESLint 配置

### 3.1 推荐：@antfu/eslint-config

```bash
bun add -D @antfu/eslint-config
```

```js
// eslint.config.js
import antfu from "@antfu/eslint-config";

export default antfu({
  stylistic: {
    printWidth: 120,
  },
});
```

### 3.2 备选：手动配置

```bash
bun add -D eslint prettier
bun add -D typescript-eslint
```

| 项目类型        | 需要添加的插件                                     |
| --------------- | -------------------------------------------------- |
| React           | `eslint-plugin-react`, `eslint-plugin-react-hooks` |
| Node.js         | `eslint-plugin-n`                                  |
| Tailwind CSS v4 | 不需要 eslint-plugin-tailwindcss                   |

### 3.3 常用脚本

```json
{
  "scripts": {
    "lint": "eslint . --fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md,css,scss,less,html,vue,yaml,toml}\""
  }
}
```

---

## 4. lint-staged 配置

### 4.1 作用

只检查 **staged（暂存）** 的文件，不检查整个项目。

### 4.2 配置

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css,scss,less,html,vue,yaml,toml}": ["prettier --write"]
  }
}
```

### 4.3 执行顺序

```
暂存文件 → eslint --fix → prettier --write → 提交
```

**注意**：eslint 必须在 prettier 之前执行。

---

## 5. Husky 配置

### 5.1 安装

```bash
bun add -D husky
bunx husky init
```

### 5.2 pre-commit 配置

**单项目**：

```bash
echo "bun lint" > .husky/pre-commit
```

**Monorepo**：

```bash
echo "bun x lint-staged" > .husky/pre-commit
```

> ⚠️ **重要**：pre-commit 只运行 lint-staged，不运行测试。测试交给 CI。

### 5.3 commit-msg（可选）

```bash
bun add -D @commitlint/cli @commitlint/config-conventional
```

```json
// commitlint.config.js
export default {
  extends: ["@commitlint/config-conventional"],
};
```

```bash
echo "bun commitlint --edit \$1" > .husky/commit-msg
```

---

## 6. 单项目 vs Monorepo

### 6.1 对比

| 配置项      | 单项目     | Monorepo                               |
| ----------- | ---------- | -------------------------------------- |
| pre-commit  | `bun lint` | `bun x lint-staged`                    |
| test 命令   | `bun test` | `bun run --parallel --workspaces test` |
| lint 命令   | `eslint .` | `eslint .` (根目录)                    |
| lint-staged | 需要       | 需要                                   |

### 6.2 Monorepo 根目录配置

```bash
# 安装依赖（只在根目录）
bun add -D eslint prettier husky lint-staged typescript-eslint
```

---

## 7. CI 配置

### 7.1 为什么 CI 是必须的

| 环节       | 检查范围    | 阻塞提交？   |
| ---------- | ----------- | ------------ |
| pre-commit | staged 文件 | 否（可跳过） |
| CI         | 全部文件    | 是           |

### 7.2 GitHub Actions 配置

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Test & Lint
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Run tests
        run: bun run test

      - name: Run lint
        run: bun run lint
```

---

## 8. 常见问题

### Q1: Prettier 与 ESLint 冲突

```bash
bun add -D eslint-config-prettier
```

```js
// eslint.config.js
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(prettier);
```

### Q2: Windows 环境 Husky 不工作

```bash
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

### Q3: 空接口报错

```typescript
// ❌ 错误
export interface EmptyOptions {}

// ✅ 正确
export type EmptyOptions = Record<string, never>;
```

### Q4: Tailwind CSS v4 需要 eslint 插件吗？

**不需要**。eslint-plugin-tailwindcss 不支持 v4，且 v4 不需要。

---

## 9. 一键初始化

### 9.1 单项目

```bash
# 1. 安装依赖
bun add -D eslint prettier husky lint-staged typescript-eslint

# 2. 初始化 husky
bunx husky init

# 3. 配置 pre-commit
echo "bun lint" > .husky/pre-commit

# 4. 创建 prettier 配置
echo '{"printWidth": 120, "singleQuote": true}' > .prettierrc

# 5. 创建 .prettierignore
cat > .prettierignore << 'EOF'
node_modules/
dist/
build/
coverage/
.turbo/
.output/
EOF
```

### 9.2 Monorepo

```bash
# 1. 安装依赖（根目录）
bun add -D eslint prettier husky lint-staged typescript-eslint

# 2. 初始化 husky
bunx husky init

# 3. 配置 pre-commit
echo "bun x lint-staged" > .husky/pre-commit

# 4. 配置 test 脚本
# package.json
{
  "scripts": {
    "test": "bun run --parallel --workspaces test"
  }
}

# 5. 创建 prettier 配置（同上）
# 6. 创建 .prettierignore（同上）

# 7. 添加 CI 配置
mkdir -p .github/workflows
cat > .github/workflows/ci.yml << 'EOF'
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run test
      - run: bun run lint
EOF
```

---

## 10. Gitignore 配置

```gitignore
# lint output
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 格式化缓存
.eslintcache
.prettiercache
```
