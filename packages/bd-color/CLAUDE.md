# bd-color 开发指南

## 构建

```bash
bun run build
```

构建脚本 `build.ts` 会：
1. 使用 `tsc` 生成 TypeScript 类型声明（`.d.ts`）
2. 使用 `bun build` 编译 JavaScript 到 `dist/` 目录
3. 排除测试文件（`*.test.d.ts`）

## 发布到 npm

### 首次发布

```bash
npm publish
```

### 配置要点

| 字段 | 值 | 说明 |
|------|-----|------|
| `type` | `"module"` | 使用 ESM |
| `files` | `["dist", "src"]` | 发布 dist 和源码 |
| `module` | `"./src/index.ts"` | bundler 入口（支持 tree-shaking） |
| `exports.import` | `"./src/index.ts"` | ESM 入口指向源码 |
| `exports.types` | `"./dist/index.d.ts"` | 类型声明 |
| `exports.require` | `"./dist/index.js"` | CJS 入口 |
| `publishConfig.access` | `"public"` | 公开 scope 包 |

### package.json 示例

```json
{
  "name": "@builden/bd-color",
  "version": "1.0.0",
  "type": "module",
  "files": ["dist", "src"],
  "main": "./dist/index.js",
  "module": "./src/index.ts",
  "types": "./dist/index.d.ts",
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

### .npmignore 示例

```
*.test.ts
*.spec.ts
tests/
tsconfig.json
.bun/
coverage/
bun.lockb
.git/
```

## 验证

发布前验证：

```bash
# Node.js 测试 dist
node -e "import('./dist/index.js').then(console.log)"

# Bun 测试 dist 和 src
bun -e "import('./dist/index.js').then(console.log)"
bun -e "import('./src/index.ts').then(console.log)"

# 运行测试
bun test
```
