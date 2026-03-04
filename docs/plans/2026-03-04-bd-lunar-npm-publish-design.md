# bd-lunar 发布到 npm 设计方案

## 概述

将 `@builden/bd-lunar` 包发布到 npm，支持 ESM 和 CJS 两种模块格式。

## 包概述

bd-lunar 是一个农历工具包，提供以下核心功能：

- `dayjsLunarPlugin`: dayjs 插件，支持农历格式化
- `getLunarInfo` / `solarToLunar` / `lunarToSolar`: 阳历阴历互转
- `getShichen`: 获取时辰信息

## 配置方案

### package.json

```json
{
  "name": "@builden/bd-lunar",
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
  },
  "scripts": {
    "build": "tsc",
    "test": "bun test"
  }
}
```

### .npmignore

```
*.test.ts
*.spec.ts
tsconfig.json
.bun/
coverage/
bun.lockb
.git/
```

### 构建方式

保持现有的 `tsc` 编译，直接输出到 `dist/` 目录。

## 交付物

1. **package.json**: 添加 files、exports、publishConfig 等字段
2. **.npmignore**: 过滤不需要发布的文件
3. **CLAUDE.md**: 开发指南（构建、发布、验证步骤）
4. **README.md**: 包使用文档

## 验证步骤

```bash
# 构建
bun run build

# 验证 dist
node -e "import('./dist/index.js').then(console.log)"

# 运行测试
bun test

# 发布
npm publish
```
