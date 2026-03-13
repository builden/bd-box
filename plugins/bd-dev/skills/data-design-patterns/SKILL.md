---
name: data-design-patterns
description: Use when designing state management architecture for new features, refactoring existing data layers, or deciding between atom, atomFamily, and atomWithStorage patterns.
---

# 数据设计规范

## Overview

基于 Jotai 的状态管理架构设计规范，遵循 4 层架构模式：Primitives（基础）→ Domain（派生）→ Operations（操作）→ Actions（组合）。

## 数据分类决策树

```
数据来源
    │
    ├─ 是否需要跨组件共享？
    │       │
    │       ├─ 是 → 是否需要响应式更新？
    │       │       │
    │       │       ├─ 是 → atom（read-only 或 read-write）
    │       │       │       │
    │       │       │       ├─ 需要持久化 → atomWithStorage
    │       │       │       └─ 临时状态 → atom
    │       │       │
    │       │       └─ 否 → 基础类型 + Context / 传参
    │       │
    │       └─ 否 → 是否需要响应式更新？
    │               │
    │               ├─ 是 → atom（write-only）
    │               └─ 否 → 基础类型 + useState
    │
    └─ 是否需要持久化？
            │
            ├─ 是 → localStorage
            │       │
            │       ├─ 小数据（<100KB） → atomWithStorage 单 key
            │       ├─ 大数据（>100KB） → IndexedDB
            │       └─ 高频更新 → 内存缓存 + 节流同步
            │
            └─ 否 → 内存 atom
```

## 存储策略

| 数据类型 | 存储方案                      | 适用场景                                     |
| -------- | ----------------------------- | -------------------------------------------- |
| 索引列表 | `atomWithStorage`             | 需要持久化的列表元数据（ID、排序、置顶状态） |
| 单条记录 | `atomFamily(atomWithStorage)` | 按 ID 独立存储的完整数据，支持懒加载         |
| UI 状态  | `atom`                        | 临时状态（展开/折叠、编辑中）                |
| 配置项   | `atomWithStorage`             | 用户偏好设置                                 |

**禁止**：混合使用 sessionStorage 和 localStorage，保持存储方案一致。

## 4 层架构模式

```
features/{feature}/
├── store/
│   ├── index.ts              # 统一导出
│   ├── constants.ts          # 存储 KEY、前缀、限制常量
│   ├── types.ts              # 类型导出
│   ├── primitives/           # Layer 1: 基础 atoms
│   │   ├── idx-list-atom.ts  # 索引列表 atom
│   │   └── record-atom.ts    # 记录 atomFamily
│   ├── domain/               # Layer 2: 派生 atoms
│   │   └── active-atoms.ts   # 活跃记录、派生数据
│   ├── operations/           # Layer 3: 纯函数操作
│   │   └── idx-list-ops.ts   # CRUD 操作（无 React 依赖）
│   └── actions/              # Layer 4: 组合操作
│       └── use-history.ts    # 业务操作函数（含 React hooks）
```

### Operations vs Actions 区分原则

| 特性           | operations（操作层）             | actions（组合层）                |
| -------------- | -------------------------------- | -------------------------------- |
| **React 依赖** | ❌ 无（纯 JS 函数）              | ✅ 有（使用 hooks）              |
| **副作用**     | ❌ 无                            | ✅ 有                            |
| **典型函数**   | `calcTogglePin()`, `fetchData()` | `useUrlState()`, `useDictData()` |
| **可测试性**   | ✅ 可直接单元测试                | ❌ 需要 React 环境               |

**示例对比**：

```typescript
// ✅ operations/ - 纯函数，可测试
export function extractChineseChars(text: string): string {
  return text.replace(/[^\u4e00-\u9fa5]/g, '');
}

export function buildQueryParams(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}

// ✅ actions/ - 依赖 React hooks，必须在组件内使用
export function useUrlState<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState(defaultValue); // React 依赖
  // ...
}

export function useDictData() {
  const query = useQuery({
    /* React Query */
  }); // React 依赖
  return query;
}
```

**常见错误**：

```typescript
// ❌ 错误：useUrlState 是 React hook，不应放在 operations 层
store / operations / url - sync.ts; // 不符合职责

// ✅ 正确：useUrlState 是组合操作，应放在 actions 层
store / actions / use - url - state.ts; // 符合职责
```

## 类型设计原则

### 1. 统一使用类型别名

```typescript
// ❌ BAD: 混用数组和类型
interface HistoryIdxList extends Array<HistoryIdx> {}

// ✅ GOOD: 使用类型别名
type HistoryIdxList = HistoryIdx[];

// 统一导出
export type { HistoryIdxList };
export type { HistoryIdx };
```

### 2. 避免冗余字段

```typescript
// ❌ BAD: hasCustomData 需要额外维护
interface HistoryIdx {
  id: string;
  hasCustomData: boolean; // 需要实时查询
  // ...
}

// ✅ GOOD: 只存储必要元数据
interface HistoryIdx {
  id: string;
  timestamp: number;
  isPinned: boolean;
  title?: string;
  textPreview: string;
}
```

### 3. 派生数据不在索引中存储

复杂派生数据通过 derived atom 实时计算，不存储在索引列表中。

## 命名规范

### 文件命名

| 类型       | 模式           | 示例                 |
| ---------- | -------------- | -------------------- |
| 基础 atom  | `*-atom.ts`    | `idx-list-atom.ts`   |
| 派生 atoms | `*-atoms.ts`   | `active-atoms.ts`    |
| 操作函数   | `*-ops.ts`     | `idx-list-ops.ts`    |
| 组合操作   | `use-*.ts`     | `use-history.ts`     |
| 常量       | `constants.ts` | `store/constants.ts` |

### 函数命名

```typescript
// 纯计算函数（calc 前缀）
export function calcTogglePin(list: HistoryIdxList, id: string): HistoryIdxList;
export function calcRemove(list: HistoryIdxList, id: string): IdxListResult;

// 存储操作
export function saveRecordToStorage(id: string, record: HistoryRecordItem): void;
export function loadRecordFromStorage(id: string): HistoryRecordItem | null;

// 组合操作（无前缀动词）
export function togglePin(id: string): void;
export function removeRecord(id: string): void;
export function removeAll(): void;
```

### 禁用命名

| 禁用              | 使用                 | 原因                |
| ----------------- | -------------------- | ------------------- |
| `deleteRecord`    | `removeRecord`       | delete 是 JS 关键字 |
| `createNewRecord` | `createRecord`       | 冗余                |
| `historyIdxList`  | `historyIdxListAtom` | 区分 atom 和数据    |
| `getStore`        | 直接使用 store       | 全局单例            |

## 纯函数操作模式

### 1. 计算型函数（calc 前缀）

```typescript
/** 切换置顶状态 - 返回新列表 */
export function calcTogglePin(list: HistoryIdxList, id: string): HistoryIdxList {
  return list.map((item) => (item.id === id ? { ...item, isPinned: !item.isPinned } : item));
}

/** 移除索引项 - 返回结果对象 */
export function calcRemove(list: HistoryIdxList, id: string): IdxListResult {
  const idxList = list.filter((item) => item.id !== id);
  const removed = list.find((item) => item.id === id);
  const removedActive = list[0]?.id === id;

  return {
    list: idxList,
    removedId: removed?.id,
    removedActive,
  };
}
```

### 2. 存储操作函数

```typescript
import { getRecordStorageKey } from '../constants';

/** 从 localStorage 加载记录 */
export function loadRecordFromStorage(id: string): HistoryRecordItem | null {
  if (typeof window === 'undefined') return null;
  const key = getRecordStorageKey(id);
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : null;
}

/** 保存记录到 localStorage */
export function saveRecordToStorage(id: string, record: HistoryRecordItem): void {
  const key = getRecordStorageKey(id);
  localStorage.setItem(key, JSON.stringify(record));
}
```

## 导出模式

### 1. 扁平化导出

```typescript
// index.ts
export { idxListAtom as historyIdxListAtom } from './primitives/idx-list-atom';
export { removeRecord, removeAll, togglePin } from './actions/use-history';
```

### 2. 避免中间重导出

```typescript
// ❌ BAD: 多层间接导出
export * from './primitives/idx-list-atom'; // 导出 pinnedCountAtom
export { pinnedCountAtom } from './primitives/idx-list-atom'; // 重复

// ✅ GOOD: 直接在 index.ts 中导出
export { idxListAtom, pinnedCountAtom, unpinnedCountAtom } from './primitives/idx-list-atom';
```

## 常量集中管理

```typescript
// store/constants.ts

// 存储 KEY
export const IDX_LIST_STORAGE_KEY = 'feature:idx-list';
export const RECORD_STORAGE_PREFIX = 'feature:';

// 限制常量
export const MAX_RECORDS = 200;
export const PREVIEW_MAX_LENGTH = 100;

// 生成函数
export function getRecordStorageKey(id: string): string {
  return `${RECORD_STORAGE_PREFIX}${id}`;
}

export function isRecordStorageKey(key: string): boolean {
  return key.startsWith(RECORD_STORAGE_PREFIX);
}
```

## 常见问题

### 1. atomFamily 存储位置

**问题**：每条记录单独存储还是集中存储？

**方案**：索引列表 + 独立存储

```typescript
// 索引列表存储元数据
const idxListAtom = atomWithStorage<HistoryIdxList>(IDX_LIST_STORAGE_KEY, []);

// 每条记录独立存储（懒加载）
const recordAtomFamily = atomFamily((id: string) => atomWithStorage(getRecordStorageKey(id), null));
```

### 2. 派生数据重复计算

**问题**：多个组件依赖相同派生数据

**方案**：使用 derived atom 缓存

```typescript
// ❌ BAD: 每个组件单独计算
const textAtom = atom((get) => {
  const record = get(activeRecordAtom);
  return record?.simplified?.text || '';
});

// ✅ GOOD: 派生 atom 自动缓存
export const activeTextAtom = atom((get) => {
  const record = get(activeRecordAtom);
  return record?.[get(displayModeAtom)]?.text || '';
});
```

### 3. 操作函数副作用

**问题**：操作函数混合业务逻辑和副作用

**方案**：纯函数 + 组合操作分离

```typescript
// operations/ - 纯函数，无副作用
export function calcRemove(list: HistoryIdxList, id: string): IdxListResult;

// actions/ - 组合操作，处理副作用
export function removeRecord(id: string): void {
  const list = store.get(idxListAtom);
  const { list: newList, removedActive } = calcRemove(list, id);
  removeRecordFromStorage(id);
  store.set(idxListAtom, newList);
}
```

## 快速参考

### 存储 KEY 命名

```
{feature}:{data-type}
例：ancient-trans:idx-list
    ancient-trans:{id}
```

### 目录对应关系

| 目录          | 职责       | 导出       |
| ------------- | ---------- | ---------- |
| `primitives/` | 基础 atoms | 直接导出   |
| `domain/`     | 派生 atoms | `export *` |
| `operations/` | 纯函数     | `export *` |
| `actions/`    | 组合操作   | 按需导出   |

### 类型导出

```typescript
// store/types.ts 或同级 types/ 目录
export type { HistoryIdx };
export type { HistoryIdxList };
export type { HistoryRecordItem };
```
