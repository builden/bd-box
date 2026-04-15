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

# 添加并链接到当前目录
git-src add facebook/react --link
```

### 链接仓库

将已安装的仓库链接到当前项目目录：

```bash
# 链接仓库到当前目录
git-src link facebook/react

# 链接后会在当前目录创建 .git-src/facebook/react -> ~/.git-src/facebook/react
```

### 打开仓库

```bash
# 在编辑器中打开
git-src open vue

# 通配符（交互式选择）
git-src open re*
```

### 删除仓库

```bash
# 删除仓库（同时清理所有 symlink）
git-src rm facebook/react
```

### 打印路径

```bash
# 打印 git-src 配置目录
git-src cd

# 打印仓库路径
git-src cd react

# 通配符（交互式选择）
git-src cd re*
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

## 何时使用

当遇到以下情况时，**必须**使用 git-src 查看源码：

- 使用第三方库时遇到问题或想了解其实现
- 需要理解某个框架的内部机制
- 想要参考知名项目的代码模式
- 不确定某个 API 的正确用法

**触发关键词**：第三方库、框架、源码、实现、原理、内部机制

## 常见错误

| 错误行为              | 理性化                             | 正确做法                            |
| --------------------- | ---------------------------------- | ----------------------------------- |
| 直接 npm install 使用 | "时间紧迫"、"专业的事交给专业的人" | 先 git-src query 搜索，再 open 源码 |
| 猜测 API 用法         | "应该就是这样"                     | git-src open 查看官方实现           |
| 跳过源码直接写代码    | "这个很简单不需要看"               | 至少打开关键文件确认                |

## 红线标志 - 停止并重新开始

**以下情况意味着你要绕过源码查看：**

- "时间紧迫，先用起来再说"
- "这个库很简单，不需要看源码"
- "等专业的人处理"
- "先写代码，有问题再查"
- "应该就是这个用法"

**所有这些意味着：先 git-src query 搜索相关仓库。**

## 快速参考

```
git-src query <关键词>  # 搜索仓库
git-src open <名称>     # 在编辑器中打开
git-src add <repo>      # 添加新仓库
git-src add <repo> -l   # 添加并链接到当前目录
git-src link <repo>     # 链接仓库到当前目录
git-src rm <repo>       # 删除仓库
git-src cd [repo]       # 打印配置目录或仓库路径
```

## 存储位置

- 仓库存储：`~/.git-src/{owner}/{repo}`
- 配置文件：`~/.git-src/config.json`
- 链接存储：`<cwd>/.git-src/{owner}/{repo}` (symlink)
