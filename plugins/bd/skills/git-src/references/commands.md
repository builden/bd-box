# 命令参考

本文档包含 git-src 所有命令的详细用法。

## 安装

```bash
# 使用 bun（推荐）
bun add -g git-src

# 使用 npm
npm install -g git-src

# 使用 yarn
yarn global add git-src

# 使用 pnpm
pnpm add -g git-src
```

## 核心命令

### 添加仓库

```bash
# 简单名称（默认 owner 为 facebook）
git-src add react

# Owner/repo 格式
git-src add facebook/react

# 完整 GitHub URL
git-src add https://github.com/vuejs/vue
git-src add git@github.com:microsoft/vscode.git

# 带标签
git-src add react --tag frontend
git-src add vue --tag frontend --tag popular
```

### 列出仓库

```bash
# 列出所有
git-src ls

# 按标签筛选
git-src ls --tag frontend
git-src ls -t important

# 简单模式（仅显示名称）
git-src ls --simple
git-src ls -s
```

### 搜索仓库

```bash
# 按名称搜索
git-src query react

# 通配符搜索
git-src query "re*"

# 按标签筛选
git-src query --tag important
git-src query react --tag frontend
```

### 打开仓库

```bash
# 按名称打开
git-src open vue

# 通配符（交互式选择）
git-src open re*

# 打开所有匹配的
git-src open re* --all
```

### 更新仓库

```bash
# 更新所有
git-src update

# 更新指定仓库
git-src update react

# 强制重新克隆
git-src update react --force
```

### 检查更新

```bash
# 检查所有
git-src outdated

# 检查指定仓库
git-src outdated react

# 按标签筛选
git-src outdated --tag frontend
```

### 标签管理

```bash
# 添加标签
git-src tag react important

# 列出标签
git-src tag react

# 删除标签
git-src tag react important --delete
```

### 自更新

```bash
# 升级到最新版本
git-src upgrade
```

## 存储位置

- 仓库存储：`~/.git-src/{owner}/{repo}`
- 配置文件：`~/.git-src/config.json`

## 自动行为

- 使用 `--depth 1` 克隆以节省空间
- 从 GitHub URL 提取 owner 用于目录组织
- 跟踪版本信息和标签
- 自动检测包管理器（bun/npm/yarn/pnpm）用于自升级
