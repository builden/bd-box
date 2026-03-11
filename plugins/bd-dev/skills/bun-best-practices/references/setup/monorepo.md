# Bun Monorepo 配置

## Bun Workspaces

Bun 的包管理器支持 npm workspaces。

### 基础配置

在根目录 `package.json` 中配置：

```json
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": ["packages/*"]
}
```

### 重要规则

- **根 package.json 不应有 business dependencies**
- 根 package.json 可以有 devDependencies（eslint、prettier、husky 等开发工具）
- 每个包应该独立声明自己的依赖
- 使用 `workspace:*` 语法引用内部包

```json
// packages/stuff-b/package.json
{
  "name": "stuff-b",
  "dependencies": {
    "stuff-a": "workspace:*"
  }
}
```

## 常用命令

### 安装依赖

```bash
bun install
```

### 添加依赖到特定包

```bash
cd packages/stuff-a
bun add zod
```

### 跨包运行脚本

```bash
bun run --parallel --workspaces test
```

### Monorepo 测试脚本配置

```json
// 根 package.json
{
  "scripts": {
    "test": "bun run --parallel --workspaces test"
  }
}
```

## 包结构

```
packages/
  bd-utils/
    src/
      index.ts          # 主入口
      find-package.ts   # 工具函数
      detect-pm.ts      # 工具函数
      upgrade.ts        # 主功能
    scripts/
      build.ts          # 共享构建脚本
    build.ts           # 构建入口
    package.json       # 包配置
```
