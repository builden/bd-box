# Hooks 迁移到 Store 体系实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use builden-dev:executing-plans to implement this plan task-by-task.

**目标：** 将分散在 features/\*/hooks 中的 atom 定义和 localStorage 管理迁移到统一的 store/ 目录，遵循 bd-dev:data-design-patterns 规范。

**架构：** 遵循 4 层模式 - primitives/primitives(原始 atoms) → derived/(派生 atoms) → operations/(纯函数) → actions/(React hooks)

**技术栈：** Jotai, atomWithQuery, atomWithStorage

---

## 任务 1：迁移 Projects Query Hook

**文件：**

- 创建：`src/features/projects/store/primitives/projects-atoms.ts`
- 修改：`src/features/projects/hooks/useProjectsQuery.ts`
- 删除：`src/features/projects/primitives/` (如有)

**步骤 1：创建 Projects Atoms**

```typescript
// src/features/projects/store/primitives/projects-atoms.ts
import { atomWithQuery } from 'jotai-tanstack-query';
import { api } from '@/utils/api';
import { queryKeys } from '@/lib/query-keys';
import { ProjectListResponseSchema } from '@shared/api/projects';
import { SessionsListResponseSchema } from '@shared/api/sessions';
import { validateResponse } from '@shared/api/validation';
import { createLogger } from '@/lib/logger';

const logger = createLogger('projects-atoms');

// ============ Projects Query Atom ============
const createQueryFetcher =
  <T>(key: string, fetcher: () => Promise<T>) =>
  async (): Promise<T> => {
    logger.debug(`Fetching ${key} via TanStack Query`);
    const data = await fetcher();
    logger.debug(`${key} fetched`, { count: Array.isArray(data) ? data.length : 0 });
    return data;
  };

export const projectsAtom = atomWithQuery(() => ({
  queryKey: queryKeys.projects,
  queryFn: createQueryFetcher('projects', async () => {
    const response = await api.projects();
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const json = await response.json();
    const validated = validateResponse(ProjectListResponseSchema, json, {
      endpoint: '/api/projects',
      status: response.status,
      fallbackValue: { items: [] },
    });
    return validated?.items || [];
  }),
  staleTime: 1000 * 60 * 5, // 5 minutes
}));

// ============ Sessions Query Atoms (动态创建) ============
const sessionsAtomsCache = new Map<string, ReturnType<typeof atomWithQuery>>();

export function getSessionsAtom(projectName: string) {
  if (!sessionsAtomsCache.has(projectName)) {
    sessionsAtomsCache.set(
      projectName,
      atomWithQuery(() => ({
        queryKey: queryKeys.projectSessions(projectName),
        queryFn: createQueryFetcher(`sessions/${projectName}`, async () => {
          if (!projectName) return [];
          const response = await api.sessions(projectName);
          if (!response.ok) {
            throw new Error(`Failed to fetch sessions: ${response.statusText}`);
          }
          const json = await response.json();
          const result = validateResponse(SessionsListResponseSchema, json, {
            endpoint: `/api/projects/${projectName}/sessions`,
            status: response.status,
            fallbackValue: { items: [] },
          });
          return result?.items || [];
        }),
        staleTime: 1000 * 60 * 2, // 2 minutes
      }))
    );
  }
  return sessionsAtomsCache.get(projectName)!;
}
```

**步骤 2：创建 Actions Hook**

```typescript
// src/features/projects/store/actions/use-projects-query.ts
import { useAtom } from 'jotai';
import { projectsAtom, getSessionsAtom } from '../primitives/projects-atoms';

export function useProjectsQuery() {
  const [result] = useAtom(projectsAtom);
  return result;
}

export function useProjectSessionsQuery(projectName: string) {
  const [result] = useAtom(getSessionsAtom(projectName));
  return result;
}
```

**步骤 3：创建 Store 导出**

```typescript
// src/features/projects/store/index.ts
export { useProjectsQuery, useProjectSessionsQuery } from './actions/use-projects-query';
export { projectsAtom, getSessionsAtom } from './primitives/projects-atoms';
```

**步骤 4：更新 Hooks 导入**

```typescript
// src/features/projects/hooks/useProjectsQuery.ts
// 删除 atomWithQuery 相关代码，改为从 store 导入
export { useProjectsQuery, useProjectSessionsQuery } from '../store';
```

**步骤 5：验证**

运行：`cd packages/bd-cc && bun test --filter "*project*" 2>&1 | head -30`
预期：测试通过

---

## 任务 2：迁移 PRD Query Hook

**文件：**

- 创建：`src/features/prd-editor/store/primitives/prd-atoms.ts`
- 修改：`src/features/prd-editor/hooks/usePrdQuery.ts`

**步骤 1：创建 PRD Atoms**

```typescript
// src/features/prd-editor/store/primitives/prd-atoms.ts
import { atomWithQuery } from 'jotai-tanstack-query';
import { api } from '@/utils/api';
import { queryKeys } from '@/lib/query-keys';
import { createLogger } from '@/lib/logger';
import type { ExistingPrdFile } from '../../types/types';

const logger = createLogger('prd-atoms');

const createQueryFetcher =
  <T>(key: string, fetcher: () => Promise<T>) =>
  async (): Promise<T> => {
    logger.debug(`Fetching ${key}`);
    return fetcher();
  };

const prdRegistryAtomsCache = new Map<string, ReturnType<typeof atomWithQuery>>();

export function getPrdRegistryAtom(projectName: string) {
  if (!prdRegistryAtomsCache.has(projectName)) {
    prdRegistryAtomsCache.set(
      projectName,
      atomWithQuery(() => ({
        queryKey: queryKeys.prds(projectName),
        queryFn: createQueryFetcher(`prds/${projectName}`, async () => {
          const response = await api.get(`/taskmaster/prd/${encodeURIComponent(projectName)}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch PRDs: ${response.statusText}`);
          }
          const data = await response.json();
          return (data.prdFiles || data.prds || []) as ExistingPrdFile[];
        }),
        staleTime: 1000 * 60 * 5,
        enabled: !!projectName,
      }))
    );
  }
  return prdRegistryAtomsCache.get(projectName)!;
}
```

**步骤 2：创建 Actions Hook**

```typescript
// src/features/prd-editor/store/actions/use-prd-query.ts
import { useAtom } from 'jotai';
import { getPrdRegistryAtom } from '../primitives/prd-atoms';

export function usePrdRegistryQuery(projectName: string) {
  const [result] = useAtom(getPrdRegistryAtom(projectName));
  return result;
}
```

**步骤 3：创建 Store 导出**

```typescript
// src/features/prd-editor/store/index.ts
export { usePrdRegistryQuery } from './actions/use-prd-query';
export { getPrdRegistryAtom } from './primitives/prd-atoms';
```

**步骤 4：更新 Hooks 导入**

```typescript
// src/features/prd-editor/hooks/usePrdQuery.ts
export { usePrdRegistryQuery } from '../store';
```

**步骤 5：验证**

运行：`cd packages/bd-cc && bun test --filter "*prd*" 2>&1 | head -30`
预期：测试通过

---

## 任务 3：迁移 Code Editor Settings

**文件：**

- 创建：`src/features/code-editor/store/primitives/settings-atoms.ts`
- 修改：`src/features/code-editor/hooks/useCodeEditorSettings.ts`

**步骤 1：创建 Settings Atoms**

```typescript
// src/features/code-editor/store/primitives/settings-atoms.ts
import { atomWithStorage } from 'jotai/utils';
import { CODE_EDITOR_DEFAULTS, CODE_EDITOR_STORAGE_KEYS } from '../../biz/settings';

export const editorThemeAtom = atomWithStorage(
  CODE_EDITOR_STORAGE_KEYS.theme,
  CODE_EDITOR_DEFAULTS.isDarkMode ? 'dark' : 'light'
);

export const editorWordWrapAtom = atomWithStorage(CODE_EDITOR_STORAGE_KEYS.wordWrap, CODE_EDITOR_DEFAULTS.wordWrap);

export const editorMinimapAtom = atomWithStorage(
  CODE_EDITOR_STORAGE_KEYS.showMinimap,
  CODE_EDITOR_DEFAULTS.minimapEnabled
);

export const editorLineNumbersAtom = atomWithStorage(
  CODE_EDITOR_STORAGE_KEYS.lineNumbers,
  CODE_EDITOR_DEFAULTS.showLineNumbers
);

export const editorFontSizeAtom = atomWithStorage(CODE_EDITOR_STORAGE_KEYS.fontSize, CODE_EDITOR_DEFAULTS.fontSize);
```

**步骤 2：创建 Actions Hook**

```typescript
// src/features/code-editor/store/actions/use-code-editor-settings.ts
import { useAtom } from 'jotai';
import {
  editorThemeAtom,
  editorWordWrapAtom,
  editorMinimapAtom,
  editorLineNumbersAtom,
  editorFontSizeAtom,
} from '../primitives/settings-atoms';

export function useCodeEditorSettings() {
  const [isDarkMode] = useAtom(editorThemeAtom);
  const [wordWrap] = useAtom(editorWordWrapAtom);
  const [minimapEnabled] = useAtom(editorMinimapAtom);
  const [showLineNumbers] = useAtom(editorLineNumbersAtom);
  const [fontSize] = useAtom(editorFontSizeAtom);

  return {
    isDarkMode: isDarkMode === 'dark',
    setIsDarkMode: (value: boolean) => editorThemeAtom.onMount?.(undefined, () => {}),
    wordWrap,
    minimapEnabled,
    showLineNumbers,
    fontSize,
  };
}
```

**注意：** `atomWithStorage` 返回的 atom 有特殊的 set 方法，需要调整使用方式。

**步骤 3：验证**

运行：`cd packages/bd-cc && bun test --filter "*code-editor*" 2>&1 | head -30`
预期：测试通过

---

## 任务 4：迁移 Quick Settings Drag

**文件：**

- 创建：`src/features/quick-settings/store/primitives/drag-atoms.ts`
- 修改：`src/features/quick-settings/hooks/useQuickSettingsDrag.ts`

**步骤 1：创建 Drag Atoms**

```typescript
// src/features/quick-settings/store/primitives/drag-atoms.ts
import { atomWithStorage } from 'jotai/utils';
import { DEFAULT_HANDLE_POSITION, HANDLE_POSITION_STORAGE_KEY } from '../../biz/constants';

export const handlePositionAtom = atomWithStorage(HANDLE_POSITION_STORAGE_KEY, DEFAULT_HANDLE_POSITION);
```

**步骤 2：创建 Actions Hook**

```typescript
// src/features/quick-settings/store/actions/use-quick-settings-drag.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { handlePositionAtom } from '../primitives/drag-atoms';
import type { QuickSettingsHandleStyle } from '../../types/types';
// ... 保留现有的拖拽逻辑，只是把 localStorage 替换为 atom
```

**步骤 3：验证**

运行：`cd packages/bd-cc && bun test --filter "*quick-settings*" 2>&1 | head -30`
预期：测试通过

---

## 任务 5：清理和验证

**步骤 1：运行完整测试**

运行：`cd packages/bd-cc && bun test 2>&1 | tail -20`
预期：所有测试通过

**步骤 2：检查 TypeScript 类型**

运行：`cd packages/bd-cc && bun run typecheck 2>&1 | head -30`
预期：无类型错误
