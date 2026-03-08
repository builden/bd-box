---
name: git-src
description: 管理本地 Git 仓库供 Agent 参考源代码。当需要查阅开源项目源码、搜索特定库的实现、或分析知名框架代码时使用。
---

# git-src

管理本地 Git 仓库的工具，供 Agent 参考源代码。

## 快速开始

### 列出仓库

```bash
# 列出所有仓库
git-src ls

# 按标签筛选
git-src ls --tag frontend
```

### 搜索仓库

```bash
# 按名称搜索
git-src query react

# 通配符搜索
git-src query "re*"
```

### 添加仓库

```bash
# 添加仓库
git-src add react

# 使用 Owner/repo 格式
git-src add facebook/react

# 带标签
git-src add vue --tag frontend
```

### 打开仓库

```bash
# 在编辑器中打开
git-src open vue

# 通配符（交互式选择）
git-src open re*
```

## 检查更新

```bash
# 检查哪些仓库有更新
git-src outdated

# 更新所有仓库
git-src upgrade
```

## 详细命令

完整命令文档见 [references/commands.md](references/commands.md)。

## 使用场景

1. **需要参考源码时**：先 `git-src query <关键词>` 搜索相关仓库
2. **查看知名框架实现**：用 `git-src add` 添加后用 `git-src open` 打开
3. **检查更新**：`git-src outdated` 查看哪些仓库有更新

## 存储位置

- 仓库存储：`~/.git-src/{owner}/{repo}`
- 配置文件：`~/.git-src/config.json`
