# Aivis 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use bd-dev:executing-plans to implement this plan task-by-task.

**目标：** 创建 Aivis 包，实现标注问题、样式调整、第三方提取三大功能

**架构：** monorepo 分层架构（core/react/injection 三层），core 纯逻辑无 DOM 依赖，react/injection 分别对应内置/注入模式

**技术栈：** TypeScript + React 18 + Bun + CDP (Chrome DevTools Protocol)

---

## 阶段一：创建项目骨架

### 任务 1：初始化 aivis 包结构

**文件：**

- 创建：`packages/aivis/package.json`
- 创建：`packages/aivis/tsconfig.json`

**步骤 1：创建 package.json**

```json
{
  "name": "@builden/aivis",
  "version": "1.0.0",
  "type": "module",
  "files": ["dist"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./src/index.ts"
    },
    "./core": {
      "types": "./dist/core/index.d.ts",
      "import": "./src/core/index.ts"
    },
    "./react": {
      "types": "./dist/react/index.d.ts",
      "import": "./src/react/index.ts"
    }
  },
  "scripts": {
    "test": "bun test",
    "build": "bun build.ts",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@builden/bd-utils": "workspace:*",
    "@types/bun": "^1.0.0",
    "react": "^18.0.0",
    "typescript": "^5.0.0"
  },
  "peerDependencies": {
    "react": "^18.0.0"
  }
}
```

**步骤 2：创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "types": ["bun-types", "node"]
  },
  "include": ["src/**/*"]
}
```

**步骤 3：提交**

```bash
git add packages/aivis/package.json packages/aivis/tsconfig.json
git commit -m "chore(aivis): init package structure"
```

---

## 阶段二：实现 aivis-core

### 任务 2：创建 protocol 模块

**文件：**

- 创建：`packages/aivis/src/core/protocol.ts`
- 创建：`packages/aivis/src/core/protocol.test.ts`

**步骤 1：编写失败的测试**

```typescript
import { describe, it, expect } from 'bun:test';
import type { AivisMessage, AnnotationData, StyleChangeData, ExtractData } from './protocol';

describe('AivisMessage', () => {
  it('should validate annotation message', () => {
    const msg: AnnotationData = {
      type: 'annotation',
      selector: '.btn-primary',
      position: { x: 100, y: 200, width: 80, height: 40, top: 200, left: 100, right: 180, bottom: 240 },
      comment: '这个按钮太小了',
    };
    expect(msg.type).toBe('annotation');
    expect(msg.selector).toBe('.btn-primary');
  });

  it('should validate style-change message', () => {
    const msg: StyleChangeData = {
      type: 'style-change',
      selector: '.sidebar > .nav-item',
      changes: { padding: '8px → 16px', color: '#666 → #333' },
    };
    expect(msg.type).toBe('style-change');
  });

  it('should validate extract message', () => {
    const msg: ExtractData = {
      type: 'extract',
      selector: '.nav-item',
      computedStyles: { padding: '12px', color: '#333', 'font-size': '14px' },
      comment: '导航项的样式',
    };
    expect(msg.type).toBe('extract');
  });
});
```

**步骤 2：运行测试验证失败**

运行：`cd ~/Develop/my-proj/bd-box && bun test packages/aivis/src/core/protocol.test.ts`
预期：FAIL - protocol.ts 不存在

**步骤 3：编写实现**

```typescript
// packages/aivis/src/core/protocol.ts

export type AnnotationData = {
  type: 'annotation';
  selector: string;
  position: DOMRect;
  comment?: string;
};

export type StyleChangeData = {
  type: 'style-change';
  selector: string;
  changes: Record<string, string>;
};

export type ExtractData = {
  type: 'extract';
  selector: string;
  computedStyles: Record<string, string>;
  comment?: string;
};

export type AivisMessage = AnnotationData | StyleChangeData | ExtractData;

export function isAivisMessage(value: unknown): value is AivisMessage {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (obj.type === 'annotation') {
    return typeof obj.selector === 'string' && obj.position !== undefined;
  }
  if (obj.type === 'style-change') {
    return typeof obj.selector === 'string' && typeof obj.changes === 'object';
  }
  if (obj.type === 'extract') {
    return typeof obj.selector === 'string' && typeof obj.computedStyles === 'object';
  }
  return false;
}
```

**步骤 4：运行测试验证通过**

运行：`bun test packages/aivis/src/core/protocol.test.ts`
预期：PASS

**步骤 5：提交**

```bash
git add packages/aivis/src/core/protocol.ts packages/aivis/src/core/protocol.test.ts
git commit -m "feat(aivis-core): add protocol module for message types"
```

---

### 任务 3：创建 selector 模块

**文件：**

- 创建：`packages/aivis/src/core/selector.ts`
- 创建：`packages/aivis/src/core/selector.test.ts`

**步骤 1：编写失败的测试**

```typescript
import { describe, it, expect } from 'bun:test';
import { generateSelector, getElementPath } from './selector';

describe('generateSelector', () => {
  it('should generate selector with data-aivis-id', () => {
    const element = {
      getAttribute: (name: string) => (name === 'data-aivis-id' ? 'abc123' : null),
      tagName: 'DIV',
      className: '',
      id: '',
    } as unknown as Element;
    expect(generateSelector(element)).toBe('[data-aivis-id="abc123"]');
  });

  it('should generate selector with id', () => {
    const element = {
      getAttribute: () => null,
      tagName: 'DIV',
      className: '',
      id: 'main-content',
    } as unknown as Element;
    expect(generateSelector(element)).toBe('div#main-content');
  });

  it('should generate selector with class', () => {
    const element = {
      getAttribute: () => null,
      tagName: 'BUTTON',
      className: 'btn primary',
      id: '',
    } as unknown as Element;
    expect(generateSelector(element)).toBe('button.btn.primary');
  });
});
```

**步骤 2：运行测试验证失败**

运行：`bun test packages/aivis/src/core/selector.test.ts`
预期：FAIL - selector.ts 不存在

**步骤 3：编写实现**

```typescript
// packages/aivis/src/core/selector.ts

export function generateSelector(element: Element): string {
  // 优先使用 data-aivis-id
  const aivisId = element.getAttribute('data-aivis-id');
  if (aivisId) {
    return `[data-aivis-id="${aivisId}"]`;
  }

  // 其次使用 id
  const id = element.id;
  if (id) {
    return `${element.tagName.toLowerCase()}#${id}`;
  }

  // 最后使用 class
  const classes = element.className.trim().split(/\s+/).filter(Boolean);
  if (classes.length > 0) {
    const classSelector = classes.map((c) => `.${c}`).join('');
    return `${element.tagName.toLowerCase()}${classSelector}`;
  }

  // 兜底：tag name only
  return element.tagName.toLowerCase();
}

export function getElementPath(element: Element): string {
  const path: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body) {
    const selector = generateSelector(current);
    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
}
```

**步骤 4：运行测试验证通过**

运行：`bun test packages/aivis/src/core/selector.test.ts`
预期：PASS

**步骤 5：提交**

```bash
git add packages/aivis/src/core/selector.ts packages/aivis/src/core/selector.test.ts
git commit -m "feat(aivis-core): add selector module for CSS selector generation"
```

---

### 任务 4：创建 extractor 模块

**文件：**

- 创建：`packages/aivis/src/core/extractor.ts`
- 创建：`packages/aivis/src/core/extractor.test.ts`

**步骤 1：编写失败的测试**

```typescript
import { describe, it, expect } from 'bun:test';
import { extractComputedStyles } from './extractor';

describe('extractComputedStyles', () => {
  it('should extract padding and color', () => {
    const mockElement = {
      tagName: 'DIV',
      className: 'test',
      id: '',
      getAttribute: () => null,
    } as unknown as Element;

    const mockComputedStyle = {
      padding: '16px',
      color: '#333333',
      fontSize: '14px',
    };

    const result = extractComputedStyles(mockElement, mockComputedStyle as unknown as CSSStyleDeclaration);
    expect(result.padding).toBe('16px');
    expect(result.color).toBe('#333333');
  });

  it('should return empty object for null element', () => {
    const result = extractComputedStyles(null as unknown as Element, {} as CSSStyleDeclaration);
    expect(Object.keys(result)).toHaveLength(0);
  });
});
```

**步骤 2：运行测试验证失败**

运行：`bun test packages/aivis/src/core/extractor.test.ts`
预期：FAIL

**步骤 3：编写实现**

```typescript
// packages/aivis/src/core/extractor.ts

export type ExtractedStyles = {
  padding?: string;
  margin?: string;
  color?: string;
  backgroundColor?: string;
  fontSize?: string;
  width?: string;
  height?: string;
  display?: string;
  flexDirection?: string;
  gap?: string;
};

const STYLE_KEYS = [
  'padding',
  'margin',
  'color',
  'backgroundColor',
  'fontSize',
  'width',
  'height',
  'display',
  'flexDirection',
  'gap',
] as const;

export function extractComputedStyles(element: Element | null, computedStyle: CSSStyleDeclaration): ExtractedStyles {
  if (!element) return {};

  const result: ExtractedStyles = {};

  for (const key of STYLE_KEYS) {
    const value = computedStyle.getPropertyValue(key.replace(/([A-Z])/g, '-$1').toLowerCase());
    if (value) {
      (result as Record<string, string>)[key] = value;
    }
  }

  return result;
}

export function stylesToCSSRule(selector: string, styles: ExtractedStyles): string {
  const props = Object.entries(styles)
    .map(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `  ${cssKey}: ${value};`;
    })
    .join('\n');

  return `${selector} {\n${props}\n}`;
}
```

**步骤 4：运行测试验证通过**

运行：`bun test packages/aivis/src/core/extractor.test.ts`
预期：PASS

**步骤 5：提交**

```bash
git add packages/aivis/src/core/extractor.ts packages/aivis/src/core/extractor.test.ts
git commit -m "feat(aivis-core): add extractor module for CSS style extraction"
```

---

### 任务 5：创建 annotation 模块

**文件：**

- 创建：`packages/aivis/src/core/annotation.ts`
- 创建：`packages/aivis/src/core/annotation.test.ts`

**步骤 1：编写失败的测试**

```typescript
import { describe, it, expect } from 'bun:test';
import { AnnotationState, createAnnotationMachine } from './annotation';

describe('AnnotationState', () => {
  it('should start in idle state', () => {
    const state = new AnnotationState();
    expect(state.mode).toBe('idle');
    expect(state.selectedElement).toBeNull();
  });

  it('should transition to selecting mode', () => {
    const state = new AnnotationState();
    state.startSelecting();
    expect(state.mode).toBe('selecting');
  });

  it('should add annotation', () => {
    const state = new AnnotationState();
    state.addAnnotation({
      id: '1',
      selector: '.btn',
      position: { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 },
      comment: 'test',
    });
    expect(state.annotations).toHaveLength(1);
  });
});
```

**步骤 2：运行测试验证失败**

运行：`bun test packages/aivis/src/core/annotation.test.ts`
预期：FAIL

**步骤 3：编写实现**

```typescript
// packages/aivis/src/core/annotation.ts

import type { DOMRect } from './protocol';

export type AnnotationMode = 'idle' | 'selecting' | 'editing' | 'extracting';

export type Annotation = {
  id: string;
  selector: string;
  position: DOMRect;
  comment?: string;
  timestamp: number;
};

export class AnnotationState {
  mode: AnnotationMode = 'idle';
  selectedElement: Element | null = null;
  annotations: Annotation[] = [];
  pendingComment: string = '';

  startSelecting(): void {
    this.mode = 'selecting';
    this.selectedElement = null;
  }

  startEditing(element: Element): void {
    this.mode = 'editing';
    this.selectedElement = element;
  }

  startExtracting(): void {
    this.mode = 'extracting';
    this.selectedElement = null;
  }

  reset(): void {
    this.mode = 'idle';
    this.selectedElement = null;
    this.pendingComment = '';
  }

  addAnnotation(data: Omit<Annotation, 'id' | 'timestamp'>): Annotation {
    const annotation: Annotation = {
      ...data,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    this.annotations.push(annotation);
    return annotation;
  }

  removeAnnotation(id: string): void {
    this.annotations = this.annotations.filter((a) => a.id !== id);
  }

  clearAnnotations(): void {
    this.annotations = [];
  }
}

export function createAnnotationMachine() {
  return new AnnotationState();
}
```

**步骤 4：运行测试验证通过**

运行：`bun test packages/aivis/src/core/annotation.test.ts`
预期：PASS

**步骤 5：提交**

```bash
git add packages/aivis/src/core/annotation.ts packages/aivis/src/core/annotation.test.ts
git commit -m "feat(aivis-core): add annotation state machine"
```

---

### 任务 6：创建 core 导出入口

**文件：**

- 创建：`packages/aivis/src/core/index.ts`

**步骤 1：创建 index.ts**

```typescript
// packages/aivis/src/core/index.ts

export { generateSelector, getElementPath } from './selector';
export { extractComputedStyles, stylesToCSSRule } from './extractor';
export type { ExtractedStyles } from './extractor';
export { createAnnotationMachine, type AnnotationState, type AnnotationMode, type Annotation } from './annotation';
export type { AivisMessage, AnnotationData, StyleChangeData, ExtractData } from './protocol';
```

**步骤 2：运行 typecheck**

运行：`cd ~/Develop/my-proj/bd-box && bun run typecheck`
预期：PASS

**步骤 3：提交**

```bash
git add packages/aivis/src/core/index.ts
git commit -m "feat(aivis-core): export core modules"
```

---

## 阶段三：实现 aivis-react

### 任务 7：创建 React 基础组件

**文件：**

- 创建：`packages/aivis/src/react/AivisPanel.tsx`
- 创建：`packages/aivis/src/react/AivisPanel.test.tsx`

**步骤 1：编写失败的测试**

```tsx
import { describe, it, expect } from 'bun:test';
import { render } from 'bun:test';
import { AivisPanel } from './AivisPanel';

describe('AivisPanel', () => {
  it('should render panel', () => {
    const { container } = render(<AivisPanel />);
    expect(container.textContent).toContain('Aivis');
  });
});
```

**步骤 2：运行测试验证失败**

运行：`bun test packages/aivis/src/react/AivisPanel.test.tsx`
预期：FAIL - 文件不存在

**步骤 3：创建组件实现**

```tsx
// packages/aivis/src/react/AivisPanel.tsx

import React from 'react';
import { Toolbar } from './Toolbar';
import { AnnotationLayer } from './AnnotationLayer';
import { useAnnotation } from './hooks';

export type AivisPanelProps = {
  mode?: 'embedded' | 'injection';
};

export function AivisPanel({ mode = 'embedded' }: AivisPanelProps) {
  const { state, actions } = useAnnotation();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 2147483647,
        fontFamily: 'system-ui, sans-serif',
        fontSize: 14,
      }}
    >
      {state.mode !== 'idle' && <AnnotationLayer state={state} />}
      <Toolbar state={state} actions={actions} />
    </div>
  );
}
```

**步骤 4：创建 Toolbar 组件**

```tsx
// packages/aivis/src/react/Toolbar.tsx

import React from 'react';
import type { AnnotationMode } from '../core/annotation';

type ToolbarProps = {
  state: { mode: AnnotationMode };
  actions: {
    startSelecting: () => void;
    startEditing: () => void;
    startExtracting: () => void;
    reset: () => void;
    copyFeedback: () => void;
  };
};

export function Toolbar({ state, actions }: ToolbarProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        padding: '8px 12px',
        background: '#1a1a1a',
        borderRadius: 8,
        color: 'white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      <button onClick={actions.startSelecting} title="标注">
        📍
      </button>
      <button onClick={actions.startEditing} title="编辑样式">
        ✏️
      </button>
      <button onClick={actions.startExtracting} title="提取样式">
        📋
      </button>
      <button onClick={actions.copyFeedback} title="复制反馈">
        📤
      </button>
      <button onClick={actions.reset} title="重置">
        ✕
      </button>
    </div>
  );
}
```

**步骤 5：创建 AnnotationLayer 组件**

```tsx
// packages/aivis/src/react/AnnotationLayer.tsx

import React from 'react';
import type { AnnotationState } from '../core/annotation';

type AnnotationLayerProps = {
  state: AnnotationState;
};

export function AnnotationLayer({ state }: AnnotationLayerProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 2147483646,
      }}
    >
      {state.annotations.map((annotation) => (
        <div
          key={annotation.id}
          style={{
            position: 'absolute',
            left: annotation.position.left,
            top: annotation.position.top,
            width: annotation.position.width,
            height: annotation.position.height,
            border: '2px solid #ff6b6b',
            background: 'rgba(255,107,107,0.1)',
            borderRadius: 4,
            pointerEvents: 'auto',
            cursor: 'pointer',
          }}
          title={annotation.comment}
        />
      ))}
    </div>
  );
}
```

**步骤 6：创建 hooks**

```tsx
// packages/aivis/src/react/hooks.ts

import { useState, useCallback } from 'react';
import { createAnnotationMachine, generateSelector } from '../core';
import type { AnnotationState, AnnotationMode } from '../core/annotation';

export function useAnnotation() {
  const [state, setState] = useState<AnnotationState>(() => createAnnotationMachine());

  const updateState = useCallback((updater: (s: AnnotationState) => void) => {
    setState((prev) => {
      const next = createAnnotationMachine();
      Object.assign(next, prev);
      updater(next);
      return next;
    });
  }, []);

  const startSelecting = useCallback(() => {
    updateState((s) => s.startSelecting());
  }, [updateState]);

  const startEditing = useCallback(() => {
    updateState((s) => s.startEditing(document.body));
  }, [updateState]);

  const startExtracting = useCallback(() => {
    updateState((s) => s.startExtracting());
  }, [updateState]);

  const reset = useCallback(() => {
    updateState((s) => s.reset());
  }, [updateState]);

  const addAnnotation = useCallback(
    (element: Element, comment: string) => {
      updateState((s) => {
        s.addAnnotation({
          selector: generateSelector(element),
          position: element.getBoundingClientRect(),
          comment,
        });
      });
    },
    [updateState]
  );

  const copyFeedback = useCallback(() => {
    const lines = state.annotations.map((a) => {
      let line = `- Selector: ${a.selector}`;
      if (a.comment) line += `\n  Comment: ${a.comment}`;
      return line;
    });
    const text = `## Feedback\n${lines.join('\n')}`;
    navigator.clipboard.writeText(text);
  }, [state.annotations]);

  return {
    state,
    actions: {
      startSelecting,
      startEditing,
      startExtracting,
      reset,
      addAnnotation,
      copyFeedback,
    },
  };
}
```

**步骤 7：运行测试验证通过**

运行：`bun test packages/aivis/src/react/AivisPanel.test.tsx`
预期：PASS

**步骤 8：提交**

```bash
git add packages/aivis/src/react/
git commit -m "feat(aivis-react): add AivisPanel and Toolbar components"
```

---

## 阶段四：实现 aivis-injection

### 任务 8：创建注入模式 bundle

**文件：**

- 创建：`packages/aivis/src/injection/index.ts`
- 创建：`packages/aivis/build-injection.ts`

**步骤 1：创建注入脚本**

```typescript
// packages/aivis/src/injection/index.ts

import type { AivisMessage } from '../core/protocol';

declare global {
  interface Window {
    __aivisOverlay?: HTMLDivElement;
    __aivisState?: {
      mode: 'idle' | 'selecting' | 'editing' | 'extracting';
    };
  }
}

const STYLES = `
  .aivis-overlay {
    position: fixed;
    inset: 0;
    z-index: 2147483646;
    pointer-events: none;
  }
  .aivis-marker {
    position: absolute;
    border: 2px solid #ff6b6b;
    background: rgba(255,107,107,0.1);
    border-radius: 4px;
    pointer-events: auto;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .aivis-marker:hover {
    background: rgba(255,107,107,0.3);
  }
`;

export function initInjection(): void {
  // 注入样式
  const style = document.createElement('style');
  style.textContent = STYLES;
  document.head.appendChild(style);

  // 创建 overlay
  const overlay = document.createElement('div');
  overlay.className = 'aivis-overlay';
  document.body.appendChild(overlay);
  window.__aivisOverlay = overlay;

  window.__aivisState = { mode: 'idle' };

  // 点击监听
  document.addEventListener('click', handleClick, true);
}

function handleClick(e: MouseEvent): void {
  if (window.__aivisState?.mode === 'idle') return;

  const target = e.target as Element;
  if (!target || target === document.body) return;

  const rect = target.getBoundingClientRect();
  console.log('[Aivis] Clicked:', {
    selector: getSelector(target),
    rect,
  });
}

function getSelector(element: Element): string {
  const aivisId = element.getAttribute('data-aivis-id');
  if (aivisId) return `[data-aivis-id="${aivisId}"]`;

  const id = element.id;
  if (id) return `${element.tagName.toLowerCase()}#${id}`;

  const classes = element.className.trim().split(/\s+/).filter(Boolean);
  if (classes.length > 0) {
    return `${element.tagName.toLowerCase()}.${classes.join('.')}`;
  }

  return element.tagName.toLowerCase();
}

export function destroyInjection(): void {
  document.removeEventListener('click', handleClick, true);
  window.__aivisOverlay?.remove();
  window.__aivisState = undefined;
}

// IIFE 入口
if (typeof window !== 'undefined') {
  initInjection();
}
```

**步骤 2：创建构建配置**

```typescript
// packages/aivis/build-injection.ts

import { build } from 'bun';

await build({
  entrypoints: ['src/injection/index.ts'],
  outdir: 'dist/injection',
  format: 'iife',
  minify: true,
  target: 'browser',
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});
```

**步骤 3：更新 package.json scripts**

```json
{
  "scripts": {
    "build": "bun build.ts",
    "build:injection": "bun build-injection.ts",
    "test": "bun test"
  }
}
```

**步骤 4：提交**

```bash
git add packages/aivis/src/injection/ packages/aivis/build-injection.ts
git commit -m "feat(aivis-injection): add injection bundle for CDP"
```

---

## 阶段五：聚合导出

### 任务 9：创建主包入口

**文件：**

- 创建：`packages/aivis/src/index.ts`

**步骤 1：创建 index.ts**

```typescript
// packages/aivis/src/index.ts

// Core
export { generateSelector, getElementPath } from './core/selector';
export { extractComputedStyles, stylesToCSSRule } from './core/extractor';
export type { ExtractedStyles } from './core/extractor';
export { createAnnotationMachine } from './core/annotation';
export type { AnnotationState, AnnotationMode, Annotation } from './core/annotation';
export type { AivisMessage, AnnotationData, StyleChangeData, ExtractData } from './core/protocol';

// React
export { AivisPanel } from './react/AivisPanel';
export type { AivisPanelProps } from './react/AivisPanel';
export { Toolbar } from './react/Toolbar';
export { AnnotationLayer } from './react/AnnotationLayer';
export { useAnnotation } from './react/hooks';

// Injection
export { initInjection, destroyInjection } from './injection/index';
```

**步骤 2：运行 typecheck**

运行：`bun run typecheck`
预期：PASS

**步骤 3：提交**

```bash
git add packages/aivis/src/index.ts
git commit -m "feat(aivis): aggregate exports from core/react/injection"
```

---

## 验证阶段

### 任务 10：运行完整测试

**步骤 1：运行所有测试**

```bash
cd ~/Develop/my-proj/bd-box
bun test packages/aivis
```

**步骤 2：运行 typecheck**

```bash
bun run typecheck
```

**步骤 3：构建**

```bash
cd packages/aivis && bun run build
```

---

## 交付清单

- [ ] `packages/aivis/src/core/` - 核心逻辑（protocol, selector, extractor, annotation）
- [ ] `packages/aivis/src/react/` - React 组件（AivisPanel, Toolbar, AnnotationLayer, hooks）
- [ ] `packages/aivis/src/injection/` - 注入模式脚本
- [ ] 所有模块通过 typecheck
- [ ] 所有测试通过

---

**计划完成并保存到 `docs/plans/2026-04-02-aivis-implementation.md`**。

**两种执行选项：**

**1. 子代理驱动（此会话）** - 我为每个任务调度新的子代理，任务之间审查，快速迭代

**2. 并行会话（单独）** - 在工作树中打开新会话使用 executing-plans，带检查点的批量执行

**哪种方法？**
