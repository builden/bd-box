# Lint 规范

本文档定义项目的代码检查（Lint）规范，包括 eslint、prettier、husky、lint-staged 的配置和使用方式。

---

## 1. Prettier 配置

### 基础配置

项目统一使用以下 prettier 配置：

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

### .prettierignore

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

---

## 2. ESLint 配置

### 推荐：@antfu/eslint-config

**推荐使用 @antfu/eslint-config**，它包含：

- TypeScript 支持
- React/React Hooks 规则
- Import 排序
- Unocss/Tailwind 支持
- 自动与 prettier 集成

```bash
bun add -D @antfu/eslint-config
```

```js
// eslint.config.js
import antfu from "@antfu/eslint-config";

export default antfu({
  // 可选配置
  stylistic: {
    printWidth: 120,
  },
});
```

### 备选：手动配置

**优先使用工具初始化，再增量修改：**

```bash
# 初始化基础配置
bunx eslint init

# 根据项目类型追加插件和规则
```

| 项目类型       | 需要添加的插件/配置                                |
| -------------- | -------------------------------------------------- |
| **React**      | `eslint-plugin-react`, `eslint-plugin-react-hooks` |
| **Node.js**    | `eslint-plugin-n` (Node 最佳实践)                  |
| **TypeScript** | `typescript-eslint` (必须)                         |

### 常用脚本

```json
{
  "scripts": {
    "lint": "eslint . --fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md,css,scss,less,html,vue,yaml,toml}\""
  }
}
```

### Prettier 支持的文件类型

Prettier 支持以下文件类型（按项目需求启用）：

| 类型 | 扩展名                          | 说明                  |
| ---- | ------------------------------- | --------------------- |
| 代码 | `.ts`, `.tsx`, `.js`, `.jsx`    | JavaScript/TypeScript |
| 样式 | `.css`, `.scss`, `.less`        | CSS 预处理            |
| 模板 | `.html`, `.vue`, `.svelte`      | HTML 框架             |
| 数据 | `.json`, `.jsonc`               | JSON 配置             |
| 其他 | `.md`, `.yaml`, `.yml`, `.toml` | 文档和配置            |

---

## 3. Husky 配置

### 安装与初始化

```bash
bun add -D husky
bunx husky init
```

### 触发时机

| Hook           | 作用         | 命令                       |
| -------------- | ------------ | -------------------------- |
| **pre-commit** | 代码检查     | `bun lint && bun test`     |
| **commit-msg** | 提交信息规范 | `bun commitlint --edit $1` |

### 启用 commitlint（可选）

```bash
bun add -D @commitlint/cli @commitlint/config-conventional
```

```json
// commitlint.config.js
export default {
  extends: ["@commitlint/config-conventional"],
};
```

---

## 4. lint-staged 配置

### 基础配置

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["bun eslint --fix", "bun prettier --write"],
    "*.{json,md,css,scss,less,html,vue,yaml,toml}": ["bun prettier --write"]
  }
}
```

### 执行顺序

```
暂存文件 → eslint --fix → prettier --write → 提交
```

**注意**：eslint 必须在 prettier 之前执行，因为 prettier 可能格式化掉 eslint 能修复的问题。

---

## 5. Monorepo 配置

### 根目录配置

根目录安装所有 lint 依赖：

```bash
bun add -D eslint prettier husky lint-staged
bun add -D @commitlint/cli @commitlint/config-conventional
bun add -D typescript-eslint
```

### package 独立配置

各 package 可根据需要覆盖规则：

```json
// packages/my-package/package.json
{
  "eslintConfig": {
    "extends": ["../../.eslintrc.json"],
    "rules": {
      // 特定规则覆盖
    }
  }
}
```

---

## 6. 常见问题

### Prettier 与 ESLint 冲突

如果 eslint 和 prettier 规则冲突，使用 `eslint-config-prettier` 解决：

```bash
bun add -D eslint-config-prettier
```

```js
// eslint.config.js
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(prettier);
```

### Windows 环境 Husky 不工作

确保 husky 目录有执行权限：

```bash
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

### 空接口报错

使用 `@typescript-eslint/no-empty-object-type` 规则时，空接口会报错。解决方案：

```typescript
// ❌ 错误：空接口
export interface EmptyOptions {}

// ✅ 正确 1：使用 type 替代
export type EmptyOptions = Record<string, never>;

// ✅ 正确 2：使用类型别名
export type QueryOptions = BaseOptions;
```

### lint-staged 执行顺序

确保 eslint 在 prettier 之前执行：

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["bun eslint --fix", "bun prettier --write"]
  }
}
```

### Monorepo 中 pre-commit 配置

在 monorepo 中，建议 pre-commit 同时运行 lint-staged 和测试：

```bash
# .husky/pre-commit
bun x lint-staged && bun run test
```

**注意**：使用 `bun run test` 而不是 `bun test`，因为后者会运行根目录的测试而非各 workspace 的测试。

### Monorepo test 脚本配置

如果部分包没有测试文件，需要显式指定要运行测试的包：

```json
// package.json
{
  "scripts": {
    "test": "bun run --parallel -F pkg1 -F pkg2 -F pkg3 test"
  }
}
```

其中 `-F` 指定包名（package.json 中的 name 字段）。

---

## 7. 初始化脚本

新项目一键配置：

```bash
# 1. 安装依赖
bun add -D eslint prettier husky lint-staged
bun add -D typescript-eslint

# 2. 初始化 husky
bunx husky init

# 3. 配置 pre-commit（单项目）
echo "bun lint && bun test" > .husky/pre-commit

# 4. 配置 pre-commit（monorepo）
echo "bun x lint-staged && bun run test" > .husky/pre-commit

# 5. 配置 monorepo test 脚本（如果有子包没有测试）
# 假设有 pkg1, pkg2, pkg3 有测试
# 注意：bd-skills 没有测试，需要排除
echo 'test": "bun run --parallel -F bd-color -F bd-lunar -F bd-utils -F git-src test"' >> package.json

# 5. 创建 prettier 配置
echo '{"printWidth": 120, "singleQuote": true}' > .prettierrc

# 6. 创建 .prettierignore
cat > .prettierignore << 'EOF'
node_modules/
dist/
build/
*.min.js
*.css.map
*.map
coverage/
.turbo/
.output/
EOF
```

---

## 8. Gitignore 配置

确保忽略 lint 输出：

```gitignore
# lint output
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 格式化输出（如果有）
.eslintcache
.prettiercache
```
