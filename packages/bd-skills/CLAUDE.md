# CLAUDE.md

This file provides guidance to Claude Code when working in this project.

## Project Overview

bd-skills is a CLI tool that wraps vercel-labs/skills for managing AI Agent skills.

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
- `src/lib/config.ts` - Configuration management

## Dependencies

- commander - CLI framework
- picocolors - Terminal colors
- execa - Shell command execution
