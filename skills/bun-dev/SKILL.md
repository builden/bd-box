---
name: bun-dev
description: Fast, modern JavaScript/TypeScript development with the Bun runtime, inspired by oven-sh/bun.
metadata:
  version: 1.1.0
---

# When to Use This Skill

Use this skill when:

- Starting new JS/TS projects with Bun
- Migrating from Node.js to Bun
- Optimizing development speed
- Using Bun's built-in tools (bundler, test runner)
- Configuring Bun workspaces monorepo

## Monorepo Configuration

Bun's package manager supports npm "workspaces". Configure in root `package.json`:

```json
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": ["packages/*"]
}
```

**Important:**

- Root package.json should NOT contain `dependencies` (business dependencies)
- Root package.json CAN contain `devDependencies` (development tools like eslint, prettier, husky)
- Each package should be self-contained and declare its own dependencies
- Use `workspace:*` syntax for inter-workspace dependencies

```json
// packages/stuff-b/package.json
{
  "name": "stuff-b",
  "dependencies": {
    "stuff-a": "workspace:*"
  }
}
```

**Install dependencies:**

```bash
bun install
```

**Add dependencies to specific workspace:**

```bash
cd packages/stuff-a
bun add zod
```

**Run scripts across all workspaces:**

```bash
bun run --parallel --workspaces test
```

## Bundle for Production

```bash
# Always bundle and minify for production
bun build ./src/index.ts --outdir ./dist --minify --target node

# Then run the bundle
bun run ./dist/index.js
```

# Resources

- [Bun Documentation](https://bun.sh/docs)
- [Bun GitHub](https://github.com/oven-sh/bun)
- [Elysia Framework](https://elysiajs.com)
- [Bun Discord](https://discord.gg/bun)
