# 项目搭建

本节涵盖新项目初始化和配置，包括 monorepo、lint、release 等。

## 目录

| 文件                                 | 说明                             |
| ------------------------------------ | -------------------------------- |
| [monorepo.md](./monorepo.md)         | Bun workspaces 配置              |
| [lint.md](./lint.md)                 | ESLint + Prettier + Husky 配置   |
| [release.md](./release.md)           | 发布配置（release-it、版本管理） |
| [gitignore.md](./gitignore.md)       | 测试输出忽略配置                 |
| [concurrently.md](./concurrently.md) | 多进程并行管理                   |

---

## 搭建顺序

```
1. bun init                    # 初始化项目
2. 配置 monorepo (可选)        # 多包管理
3. 配置 lint                   # 代码检查
4. 配置 release                # 发布脚本
5. 配置 gitignore              # 忽略规则
```

---

## 快速命令

```bash
bun init                       # 初始化
bun install                    # 安装依赖
bun run <script>              # 运行脚本
```

---

## Monorepo 结构

```json
{
  "workspaces": ["packages/*"]
}
```

详见 [monorepo.md](./monorepo.md)
