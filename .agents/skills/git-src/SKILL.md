---
name: git-src
description: Manage local Git repositories for AI Agents to reference source code
---

# git-src

> AI Skill for managing Git repositories locally

## Setup

git-src 工具将仓库存储在 `~/.git-src/{owner}/{repo}` 目录
配置文件位于 `~/.git-src/config.json`

## Installation

```bash
npm install -g git-src
# or
bun install -g git-src
```

## Commands

| Command                    | Description               |
| -------------------------- | ------------------------- |
| `git-src add <repo>`       | Add a repository          |
| `git-src ls`               | List all repositories     |
| `git-src rm <repo>`        | Remove a repository       |
| `git-src query [pattern]`  | Search repositories       |
| `git-src open <repo>`      | Open repository in editor |
| `git-src update [repo]`    | Update repositories       |
| `git-src outdated [repo]`  | Check for updates         |
| `git-src tag <repo> [tag]` | Manage tags               |

## Usage Examples

### List all repositories

```bash
git-src ls
```

### Search repositories

```bash
# Search by name
git-src query react

# Search with wildcards
git-src query "re*"

# Filter by tag
git-src query --tag important
```

### Add repositories

```bash
# Simple name (assumes facebook)
git-src add react

# Owner/repo format
git-src add facebook/react

# Full GitHub URL
git-src add https://github.com/vuejs/vue
git-src add git@github.com:microsoft/vscode.git
```

### Open repositories

```bash
# Open by name
git-src open vue

# Open with wildcard (interactive selection)
git-src open re*

# Open all matching
git-src open re* --all
```

### Update repositories

```bash
# Update all
git-src update

# Update specific repo
git-src update react

# Force re-clone
git-src update react --force
```

### Tag management

```bash
# Add tag
git-src tag react important

# List tags
git-src tag react

# Delete tag
git-src tag react important --delete
```

## AI Agent Usage

When you need to reference actual source code:

1. **Search for a repository**: Use `git-src query <keyword>` to find relevant repositories
2. **List known repos**: Use `git-src ls` to see all available repositories
3. **Open in editor**: Use `git-src open <repo>` to open the repository in your editor
4. **Check for updates**: Use `git-src outdated` to see which repos have updates

The tool automatically:

- Clones with `--depth 1` to save space
- Extracts owner from GitHub URLs for directory organization
- Tracks version info and tags
