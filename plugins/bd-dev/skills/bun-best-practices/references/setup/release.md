# Release 配置

使用 release-it 管理版本发布。

## 安装

```bash
bun add -D release-it
```

## 配置 .release-it.json

```json
{
  "git": {
    "commitMessage": "chore(release): v${version}",
    "tagName": "v${version}"
  },
  "npm": {
    "publish": false
  },
  "github": {
    "release": true,
    "releaseName": "${name} v${version}"
  },
  "hooks": {
    "before:init": ["bun run build"]
  },
  "plugins": {
    "@release-it/conventional-changelog": {
      "infile": "CHANGELOG.md"
    }
  }
}
```

## 配置说明

| 字段                | 说明                                               |
| ------------------- | -------------------------------------------------- |
| `git.commitMessage` | 提交信息模板                                       |
| `git.tagName`       | Git tag 格式                                       |
| `npm.publish`       | 是否发布到 npm（设为 false 仅生成 GitHub Release） |
| `github.release`    | 是否创建 GitHub Release                            |
| `hooks.before:init` | 发布前执行的命令（如构建）                         |
| `plugins`           | CHANGELOG 生成插件                                 |

## package.json 脚本

```json
{
  "scripts": {
    "release": "bunx release-it",
    "release:patch": "bunx release-it patch",
    "release:minor": "bunx release-it minor",
    "release:major": "bunx release-it major"
  }
}
```

## 使用

```bash
# 交互式选择版本
bun run release

# 直接发布补丁版本
bun run release:patch

# 发布次版本
bun run release:minor

# 发布主版本
bun run release:major
```

## 常见问题

### 不需要发布到 npm

设置 `"npm.publish": false`，只生成 GitHub Release。

### 不需要 CHANGELOG

移除 `plugins` 配置。

### 不需要 GitHub Release

设置 `"github.release": false`。

### Windows 环境

release-it 跨平台，但如果遇到问题，确保使用 Git Bash 或 WSL。
