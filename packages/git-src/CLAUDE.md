# CLAUDE.md

This file provides guidance to Claude Code when working in this project.

## Project Overview

git-src is a CLI tool for managing local Git repositories for AI Agents.

## Commands

Run with `bun run src/index.ts <command>` or link globally with `bun link`.

## Development

```bash
# Development mode
bun run dev

# Build
bun run build

# Test
bun test
```

## Key Files

- `src/index.ts` - CLI entry point
- `src/commands/` - Command implementations
- `src/config.ts` - Configuration management

## Dependencies

- commander - CLI framework
- picocolors - Terminal colors
- cli-table3 - Table rendering
- execa - Shell command execution
- ora - Spinners
