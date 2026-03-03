# git-src

> Git source code manager for AI Agents - manage local Git repositories for easy reference

## Installation

```bash
# Clone and install
git clone https://github.com/your-repo/git-src.git
cd git-src
bun install

# Build
bun run build

# Link globally
npm link
# or
bun link
```

## Usage

```bash
# Add repository
git-src add react
git-src add facebook/react
git-src add https://github.com/vuejs/vue

# List repositories
git-src ls

# Search
git-src query react
git-src query --tag important

# Open in editor
git-src open vue
git-src open re*     # Wildcard with interactive selection
git-src open re* -a  # Open all matches

# Update
git-src update
git-src update react
git-src update react -f  # Force re-clone

# Check outdated
git-src outdated
git-src outdated react

# Tags
git-src tag react important
git-src tag react        # List tags
git-src tag react important --delete

# Remove
git-src rm react
```

## Features

- Clone with `--depth 1` to save space
- Auto-extract owner from GitHub URLs
- Interactive selection for multiple matches
- Wildcard support in search and open
- Tag-based organization
- Bun-style colorful output
