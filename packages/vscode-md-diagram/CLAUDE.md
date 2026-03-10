# CLAUDE.md

This file provides guidance for Claude Code when working with the vscode-md-diagram project.

## Project Overview

VS Code 扩展，为 Markdown 预览添加 Mermaid 和 DOT 图表支持。

## Key Commands

```bash
# Build extension and webview
bun run build

# Run tests
bun test

# Run E2E tests
bun run test:e2e

# Release (build, package, install)
bun run release
```

## Architecture

```
src/
├── vscode-extension/      # VS Code extension entry point
├── preview/              # Webview entry point
├── renderers/            # Diagram renderers (mermaid, dot, shared)
│   ├── mermaid/          # Mermaid rendering
│   ├── dot/              # DOT/Graphviz rendering
│   └── shared/           # Shared controls, resize, navigation
├── config/               # Configuration management
├── core/                 # Core types, utilities, diagram manager
└── markdown/             # Markdown parsing with mermaid/dot support
```

## Debugging

### Enable Debug Logging

Add console.log statements in source files. Logs appear in VS Code Developer Tools Console.

```typescript
console.log("[DOT] some debug message");
```

### Check Developer Tools

1. Open VS Code Command Palette (Cmd+Shift+P)
2. Run "Toggle Developer Tools"
3. Check Console tab for errors and debug logs

## Testing

### Unit Tests

Place tests alongside source files: `src/**/*.test.ts`

```bash
bun test
```

### Integration Tests

Place in `tests/` directory.

### Smoke Tests

Use Playwright. Files in `tests/smoke/*.e2e.ts`. Core user flow tests, no console errors.

```bash
bun run test:smoke
```

### E2E Tests

Use Playwright. Files in `tests/e2e/*.e2e.ts`

```bash
bun run test:e2e
```

### Test Configuration

- Bun test and Playwright coexist: Playwright uses `.e2e.ts` suffix
- Test config: `playwright.config.ts`

## VS Code Extension Development

### CSS Loading

CSS must be loaded via `markdown.previewStyles` in `package.json`:

```json
"contributes": {
  "markdown.previewStyles": [
    "./dist/preview/index.css"
  ],
  "markdown.previewScripts": [
    "./dist/preview/index.bundle.js"
  ]
}
```

**Important**: Don't inject CSS via JavaScript (`document.createElement('style')`) - it won't work reliably. Use `markdown.previewStyles` instead.

### Adding New Diagram Types

Use the `DiagramRenderer` interface from `core/types.ts`:

```typescript
import type { DiagramRenderer } from "./core/types";

export const myRenderer: DiagramRenderer = {
  id: "my-diagram",
  languages: ["mydiagram"],
  className: "mydiagram",

  renderElement(container, usedIds, writeOut, signal) {
    // Render single diagram
  },

  renderInElement(root, writeOut, signal) {
    // Render all diagrams in root
  },
};
```

Then register it in `preview/index.ts`:

```typescript
import { rendererRegistry } from "./core/renderer";
import { myRenderer } from "./renderers/mydiagram";

rendererRegistry.register(myRenderer);
```

### Key Files

| File               | Purpose                              |
| ------------------ | ------------------------------------ |
| `core/types.ts`    | DiagramRenderer interface            |
| `core/renderer.ts` | Renderer registry                    |
| `renderers/`       | Diagram renderers (mermaid, dot)     |
| `preview/index.ts` | Webview entry, initializes renderers |
