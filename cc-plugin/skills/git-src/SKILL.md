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
# Using npm
npm install -g git-src

# Using bun (recommended)
bun add -g git-src

# Using yarn
yarn global add git-src

# Using pnpm
pnpm add -g git-src
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
| `git-src upgrade`          | Self-update               |
| `git-src --version`        | Show version              |

## Options

| Option            | Description                   |
| ----------------- | ----------------------------- |
| `--tag, -t <tag>` | Filter by tag                 |
| `--simple, -s`    | Show repo name instead of URL |

## Usage Examples

### List all repositories

```bash
git-src ls
```

### List with tag filter

```bash
git-src ls --tag frontend
git-src ls -t important
```

### Simple mode (show repo name only)

```bash
git-src ls --simple
git-src ls -s
```

### Search repositories

```bash
# Search by name
git-src query react

# Search with wildcards
git-src query "re*"

# Filter by tag
git-src query --tag important
git-src query react --tag frontend
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

# With tag
git-src add react --tag frontend
git-src add vue --tag frontend --tag popular
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

### Check outdated

```bash
# Check all
git-src outdated

# Check specific repo
git-src outdated react

# Filter by tag
git-src outdated --tag frontend
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

### Self-update

```bash
# Upgrade to latest version
git-src upgrade
```

### Version

```bash
# Show version
git-src --version
```

## AI Agent Usage

When you need to reference actual source code:

1. **Search for a repository**: Use `git-src query <keyword>` to find relevant repositories
2. **List known repos**: Use `git-src ls` to see all available repositories
3. **Filter by tag**: Use `git-src ls --tag <tag>` to filter repositories
4. **Open in editor**: Use `git-src open <repo>` to open the repository in your editor
5. **Check for updates**: Use `git-src outdated` to see which repos have updates
6. **Keep tool updated**: Use `git-src upgrade` to update the tool itself

The tool automatically:

- Clones with `--depth 1` to save space
- Extracts owner from GitHub URLs for directory organization
- Tracks version info and tags
- Detects package manager (bun/npm/yarn/pnpm) for self-upgrade
