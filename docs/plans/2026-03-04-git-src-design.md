# git-src 设计文档

> 创建日期: 2026-03-04
> 状态: 已确认

## 1. 项目概述

开发一个名为 `git-src` 的 Git 源码管理 CLI 工具，用于 AI Agent 方便参考实际源码。

## 2. 核心需求

| 项目     | 选择                                          |
| -------- | --------------------------------------------- |
| 发布形式 | 独立 npm 包                                   |
| 目录结构 | `~/.git-src/{owner}/{repo}`（自动提取 owner） |
| 编号规则 | 按字母顺序（owner → repo）                    |
| 更新策略 | git pull + `-f` 强制重新克隆                  |
| Tag 用途 | 标签查询                                      |
| 输出风格 | 完整 bun 风格（彩色、表格、进度条）           |

## 3. 命令设计

### 3.1 add

```bash
git-src add <repo-name-or-url>
```

- 支持直接输入 `react`（自动补全为 `facebook/react`）
- 支持完整格式 `owner/repo`
- 支持完整 URL `https://github.com/owner/repo`
- 自动提取 owner 创建分组目录
- 使用 `git clone --depth 1` 节省空间

### 3.2 ls

```bash
git-src ls
```

表格输出：

```
╭────┬─────────────────┬──────────┬─────────┬────────────┬───────────╮
│ #   │ REPO            │ SIZE    │ VERSION │ UPDATED   │ TAGS       │
├────┼─────────────────┼──────────┼─────────┼────────────┼───────────┤
│ 001 │ vuejs/vue      │ 89.4 MB │ v3.4.0  │ 1 week ago│ important │
│ 002 │ facebook/react │ 23.2 MB │ v18.2.0 │ 2 hours   │ -         │
│ 003 │ microsoft/vscode│345.1 MB│ 1.85.0  │ 3 days    │ tool      │
╰────┴─────────────────┴──────────┴─────────┴────────────┴───────────╯
[3 repos]
```

- 按 owner/repo 字母顺序排序
- 显示编号 #001-999
- 版本获取优先级：git tag → package.json version → commit hash

### 3.3 open

```bash
git-src open <repo>          # 交互式选择
git-src open <repo> -a       # 打开所有匹配的仓库
```

交互式选择（上下键）：

```
$ git-src open re*
┌─────────────────────────────────────┐
│ > facebook/react                     │  ← 当前选中（高亮）
│   facebook/react-dom                 │
│   redis/node-redis                   │
└─────────────────────────────────────┘
[↑/↓] 选择  [Enter] 打开  [a] 打开全部  [q] 退出
```

- 支持通配符：`re*`, `react?`, `*act`
- 多个匹配时进入交互模式
- 单个匹配直接打开

### 3.4 rm

```bash
git-src rm <repo>
```

- 删除仓库目录
- 同时从配置文件中移除记录

### 3.5 query

```bash
git-src query <str>           # 模糊搜索仓库名
git-src query --tag <tag>     # 通过标签搜索
git-src query "re*"           # 支持通配符
```

### 3.6 outdated

```bash
git-src outdated              # 检查所有仓库
git-src outdated <repo>      # 检查指定仓库
```

- 使用 `git fetch --dry-run` 检查远程是否有更新
- 输出格式类似 bun 的更新提示

### 3.7 update

```bash
git-src update                # 更新所有仓库（git pull）
git-src update <repo>        # 更新指定仓库
git-src update <repo> -f     # 强制重新克隆
```

- 默认使用 `git pull` 增量更新
- `-f` 参数强制删除后重新克隆

### 3.8 tag

```bash
git-src tag <repo> <tag>      # 打标签
git-src tag <repo>            # 查看仓库的标签
git-src tag -d <repo> <tag>   # 删除标签
```

## 4. 数据存储

### 4.1 配置文件

路径：`~/.git-src/config.json`

```json
{
  "version": "1.0.0",
  "repos": [
    {
      "id": "001",
      "name": "react",
      "owner": "facebook",
      "fullName": "facebook/react",
      "path": "/Users/builden/.git-src/facebook/react",
      "url": "https://github.com/facebook/react",
      "tags": ["important"],
      "addedAt": "2026-03-04T10:00:00Z",
      "updatedAt": "2026-03-04T12:00:00Z",
      "version": "v18.2.0",
      "size": "23.2 MB"
    }
  ]
}
```

### 4.2 目录结构

```
~/.git-src/
├── config.json
├── facebook/
│   └── react/
├── microsoft/
│   └── vscode/
└── vuejs/
    └── vue/
```

## 5. 依赖库

- `bun` - 运行时和打包
- `commander` - CLI 参数解析
- `ora` - 进度条
- `chalk` / `picocolors` - 彩色输出
- `enquirer` / `prompts` - 交互式选择
- `execa` - 执行 shell 命令
- `git-clone` - git 克隆

## 6. AI Skill

使用 `writing-skill` skill 生成，放在 npm 包的 `skill/` 目录下：

```yaml
name: git-src
description: 管理本地 Git 仓库源码，供 AI Agent 参考实际源码

setup:
  storage_path: "~/.git-src/{owner}/{repo}"
  config_file: "~/.git-src/config.json"

commands:
  list: git-src ls
  search: git-src query <keyword>
  open: git-src open <repo>
  add: git-src add <repo>
  update: git-src update [repo]
  tag: git-src tag <repo> <tag>

usage: |
  # 使用示例
  git-src ls                           # 查看已安装的仓库
  git-src query react                  # 搜索包含 react 的仓库
  git-src open vue                     # 打开 vuejs/vue（交互选择）
```
