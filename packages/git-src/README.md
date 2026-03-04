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
git-src add react --tag important  # Add with tag

# List repositories
git-src ls
git-src ls --tag skills           # Filter by tag
git-src ls -s                     # Simple output (repo name only)

# Search
git-src query react
git-src query --tag important
git-src query "re*" --simple      # Wildcard search with simple output
git-src query "*react*" -s -t ui  # Combine options

# Check outdated
git-src outdated
git-src outdated react
git-src outdated --tag skills     # Filter by tag

# Open in editor
git-src open vue
git-src open re*     # Wildcard with interactive selection
git-src open re* -a  # Open all matches
git-src open re* -d  # Open directory instead of editor

# Update
git-src update
git-src update react
git-src update react -f  # Force re-clone

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
- Tag-based organization and filtering
- Bun-style colorful output
- Table display with repo URL links
- Version read from package.json
