# CLAUDE.md

This file provides guidance for Claude Code when working with the vscode-md-mermaid project.

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
├── shared-mermaid/        # Mermaid rendering logic & diagram manager
├── shared-dot/            # DOT/Graphviz rendering (uses viz.js)
├── shared-md-mermaid/     # Markdown parsing with mermaid/dot support
└── markdownPreview/       # Webview entry point
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

1. Create `src/shared-{type}/` directory
2. Implement renderer with `renderXxxBlocksInElement()` function
3. Add language parsing in `src/shared-md-mermaid/index.ts`
4. Initialize in `src/markdownPreview/index.ts`
5. Ensure CSS has `.xxx` selectors (reuse `.mermaid` styles)

### Key Files

| File                         | Purpose                              |
| ---------------------------- | ------------------------------------ |
| `diagramManager.ts`          | Controls (zoom, pan, fullscreen)     |
| `diagramStyles.css`          | All diagram styles including `.dot`  |
| `shared-md-mermaid/index.ts` | Parse `mermaid and `dot blocks       |
| `markdownPreview/index.ts`   | Webview entry, initializes renderers |
