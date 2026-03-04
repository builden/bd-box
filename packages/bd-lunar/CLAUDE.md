# bd-lunar 开发指南

## 构建

```bash
bun run build
```

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
