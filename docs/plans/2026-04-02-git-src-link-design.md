# git-src link 功能设计

## 概述

为 git-src 增加 symlink 功能，支持将已安装的仓库链接到当前项目目录。

## 背景

当前 git-src 将仓库存储在 `~/.git-src/{owner}/{repo}`，用户需要在不同项目中访问这些仓库。通过 symlink 可以在项目目录下建立引用，方便 AI Agent 查找源码。

## 设计

### 1. Repo 配置新增字段

```typescript
// src/lib/config.ts
interface Repo {
  // ... 现有字段
  linkedPaths: string[]; // 所有 link 到本仓库的目录
}
```

### 2. 新增 `link` 命令

```bash
git-src link <repo>
```

**逻辑：**

1. 从配置找到对应仓库，不存在则报错退出
2. 在 cwd 创建 `.git-src/{owner}/{repo}` 目录（如不存在则递归创建）
3. 创建 symlink：`.git-src/{owner}/{repo}` → `~/.git-src/{owner}/{repo}`
4. 将路径写入仓库的 `linkedPaths`（去重）
5. 如果路径已存在于 `linkedPaths`，报错 `"Already linked at {path}"`

**错误处理：**
| 情况 | 处理 |
|------|------|
| 仓库不存在 | `"Repository {repo} not found"` 并 exit 1 |
| symlink 已存在 | `"Already linked at {path}"` 并 exit 1 |

### 3. `add` 命令增加 `-l, --link` 选项

```bash
git-src add owner/repo -l
git-src add owner/repo --link
```

**逻辑：**

- clone 成功后，如果指定了 `--link` 选项，调用 link 逻辑
- link 失败只显示 warning，不影响 add 成功

### 4. `rm` 命令增强

**逻辑：**

1. 遍历 `linkedPaths`，删除所有 symlink
2. 尝试删除 symlink 的父目录（如 `.git-src/{owner}` 为空则删除）
3. 删除仓库本身
4. 从配置移除

### 5. 目录结构

```
cwd/.git-src/
└── {owner}/
    └── {repo}/      → symlink → ~/.git-src/{owner}/{repo}
```

## 文件变更

| 文件                   | 变更                                    |
| ---------------------- | --------------------------------------- |
| `src/lib/config.ts`    | `Repo` 接口增加 `linkedPaths: string[]` |
| `src/commands/link.ts` | 新增 link 命令实现                      |
| `src/commands/add.ts`  | 增加 `--link` 选项                      |
| `src/commands/rm.ts`   | 增强：删除时清理 symlink                |
| `src/index.ts`         | 注册 link 命令                          |

## 后续工作

- 编写 `link.ts` 实现
- 修改 `add.ts` 增加选项
- 修改 `rm.ts` 增加清理逻辑
- 修改 `config.ts` 更新接口
- 更新 `index.ts` 注册命令
- 添加单元测试
