# Jotai 生态库扩展

本文档包含 Jotai 的生态库扩展，需要时按需查阅。

## jotai-tanstack-query（React Query 集成）

**完整文档**: [jotai-tanstack-query.md](jotai-tanstack-query.md)

包含以下内容：

- `atomWithQuery` / `atomWithSuspenseQuery` - 查询 atoms
- `atomWithInfiniteQuery` / `atomWithSuspenseInfiniteQuery` - 无限滚动
- `atomWithMutation` / `atomWithMutationState` - 数据变更
- 4 层架构实践
- 常见问题与解决方案

### 快速参考

| Jotai 函数                      | 对应 React Query           | 用途              |
| ------------------------------- | -------------------------- | ----------------- |
| `atomWithQuery`                 | `useQuery`                 | 标准查询          |
| `atomWithInfiniteQuery`         | `useInfiniteQuery`         | 无限滚动          |
| `atomWithMutation`              | `useMutation`              | 数据变更          |
| `atomWithSuspenseQuery`         | `useSuspenseQuery`         | Suspense 查询     |
| `atomWithSuspenseInfiniteQuery` | `useSuspenseInfiniteQuery` | Suspense 无限滚动 |
| `atomWithMutationState`         | `useMutationState`         | Mutation 状态追踪 |

### 模式 1：使用 atomWithQuery

```typescript
import { atomWithQuery } from 'jotai-tanstack-query';

// ✅ 正确：使用 atomWithQuery 创建查询 atom
export const usersAtom = atomWithQuery((get) => ({
  queryKey: ['users'] as const,
  queryFn: fetchUsers,
}));

// ✅ 正确：带参数的查询 atom
export const userAtom = atomWithQuery((get) => {
  const userId = get(selectedUserIdAtom);
  return {
    queryKey: ['user', userId] as const,
    queryFn: () => fetchUser(userId),
    enabled: !!userId,
  };
});
```

### 模式 2：直接使用 React Query + Atoms

对于需要更细粒度控制的场景：

```typescript
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

export function useDictData() {
  const searchQuery = useAtomValue(searchQueryAtom);
  // ...

  const query = useQuery({
    queryKey: ['dict', searchQuery, ...],
    queryFn: async ({ signal }) => fetchDict(searchQuery, signal),
    placeholderData: keepPreviousData,
  });

  return { data: query.data || [], isLoading: query.isPending, ... };
}
```

### 两种模式对比

| 特性              | atomWithQuery | React Query + Atoms    |
| ----------------- | ------------- | ---------------------- |
| 学习曲线          | 较低          | 较高                   |
| 细粒度控制        | 有限          | 完全控制               |
| 与其他 atoms 集成 | 天然集成      | 需要 useAtomValue 桥接 |
| 返回值类型        | 自动推断      | 需手动定义             |
| 适用场景          | 简单查询      | 复杂状态、多数据源     |

### 4 层架构实践（推荐）

```

store/
├── primitives/ # Layer 1: 基础 atoms
│ └── search-atom.ts
├── domain/ # Layer 2: 派生 atoms
│ └── query-atoms.ts
├── operations/ # Layer 3: 纯函数操作
│ └── fetch-ops.ts
└── actions/ # Layer 4: 组合操作 hooks
└── use-data.ts

```

```typescript
// store/primitives/search-atom.ts
export const searchQueryAtom = atom('');
export const activeCategoryAtom = atom('all');
export const currentPageAtom = atom(1);
export const pageSizeAtom = atom(20);
export const searchTriggerAtom = atom(0);

// store/primitives/filter-atom.ts
export const categoryDimensionAtom = atom<'category' | 'sixScript'>('category');

// store/domain/query-atoms.ts
export const searchApiQueryAtom = atom((get) => {
  const query = get(searchQueryAtom);
  return query.replace(/[^\u4e00-\u9fa5]/g, ''); // 只保留中文
});

// store/operations/fetch-ops.ts
export async function fetchDictData(params: DictParams, signal: AbortSignal) {
  const response = await fetch('/api/dict?' + new URLSearchParams(params));
  return response.json();
}

// store/actions/use-dict-data.ts
export function useDictData() {
  const activeCategory = useAtomValue(activeCategoryAtom);
  const categoryDimension = useAtomValue(categoryDimensionAtom);
  // ... 其他 atoms

  const query = useQuery({
    queryKey: ['dict', activeCategory, categoryDimension, searchTrigger, currentPage, pageSize],
    queryFn: () => fetchDictData({ ... }, signal),
    placeholderData: keepPreviousData,
  });

  return { /* ... */ };
}
```

### 常见问题与解决方案

#### 问题 1: hydration 不匹配

**原因**: SSR 时无法读取 `window.location`，导致服务端和客户端渲染不一致

**解决**: 使用 `useState` 初始化默认值，`useEffect` 中才读取 URL

```typescript
function useUrlState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  // ✅ 正确：初始化使用默认值（SSR 和客户端首次渲染一致）
  const [value, setValue] = useState<T>(defaultValue);

  // ✅ 正确：组件挂载后从 URL 读取实际值
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlValue = params.get(key);
      if (urlValue !== null) {
        setValue(urlValue as unknown as T);
      }
    }
  }, [key]);

  return [value, setValue];
}
```

#### 问题 2: 查询键包含 atoms 但未正确触发更新

**原因**: `queryKey` 中的 atoms 未被正确追踪

**解决**: 在 `queryFn` 中使用 atoms 的当前值，而不是在 queryKey 中引用

```typescript
// ❌ 错误：queryKey 中的 atom 可能未触发更新
const badQuery = useQuery({
  queryKey: ['data', searchQueryAtom], // ❌ atom 引用不会追踪值变化
  queryFn: () => fetchData(searchQueryAtom),
});

// ✅ 正确：queryKey 使用值，queryFn 中用 signal
const goodQuery = useQuery({
  queryKey: ['data', searchQuery], // 使用实际值
  queryFn: async ({ signal }) => {
    const query = searchQueryAtom.get(); // 或通过 useAtomValue 获取
    return fetchData(query, signal);
  },
});
```

#### 问题 3: useAtom 无法直接读取 URL 参数

**原因**: `useAtom` 期望接收 atom，而 URL 参数不是 atom

**解决**: 使用 `useState` + `useEffect` 实现 URL 同步

```typescript
// ❌ 错误：useAtom 不能接收函数
function useUrlState<T>(key: string, defaultValue: T) {
  const [value, setValue] = useAtom(
    useCallback(
      (get) => {
        const params = new URLSearchParams(window.location.search);
        return params.get(key) || defaultValue;
      },
      [key, defaultValue]
    )
  );
  return [value, setValue];
}

// ✅ 正确：使用 useState + useEffect
function useUrlState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlValue = params.get(key);
      if (urlValue !== null) {
        setValue(urlValue as unknown as T);
      }
    }
  }, [key]);

  const updateUrl = useCallback(
    (newValue: T) => {
      setValue(newValue);
      const params = new URLSearchParams(window.location.search);
      params.set(key, String(newValue));
      window.history.replaceState({}, '', `?${params.toString()}`);
    },
    [key]
  );

  return [value, updateUrl];
}
```

#### 问题 4: React Query 与 Jotai atoms 数据不一致

**原因**: React Query 缓存和 atoms 不同步

**解决**: 使用 atoms 作为真理来源，React Query 只负责获取

```typescript
// ✅ 正确：atoms 是真理来源，React Query 只负责获取
export function useDictData() {
  const searchQuery = useAtomValue(searchQueryAtom);
  // ... 其他 atoms

  const query = useQuery({
    queryKey: ['dict', searchQuery, ...],
    queryFn: () => fetchDict(searchQuery),
  });

  // 返回 atom 值 + React Query 状态
  return {
    data: query.data || [],
    isLoading: query.isPending,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
```

#### 问题 5: useEffect 中同步 atoms 到 URL

**原因**: 需要将 atoms 状态同步到 URL query string

**解决**:

```typescript
function DictionaryPage() {
  const [searchQuery] = useUrlState('search', '');
  const [activeCategory] = useUrlState('category', 'all');

  // 同步 atoms 到 URL（用于 React Query）
  const setSearchQueryAtom = useSetAtom(searchQueryAtom);
  const setActiveCategoryAtom = useSetAtom(activeCategoryAtom);

  useEffect(() => {
    setSearchQueryAtom(searchQuery);
    setActiveCategoryAtom(activeCategory);
  }, [searchQuery, activeCategory, setSearchQueryAtom, setActiveCategoryAtom]);
}
```

## jotai-history（撤销/重做）

```typescript
import { atom } from 'jotai';
import { atomWithHistory } from 'jotai-history';

// ✅ 正确：使用 atomWithHistory 添加历史记录
export const textAtom = atomWithHistory('');

function TextEditor() {
  const [text, setText] = useAtom(textAtom);
  const [undo, redo] = useAtom(historyUndoAtom(textAtom));

  return (
    <>
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={undo}>Undo</button>
      <button onClick={redo}>Redo</button>
    </>
  );
}

// ✅ 正确：限制历史记录数量
export const limitedHistoryAtom = atomWithHistory(initialValue, {
  maxHistory: 50,
});

// ✅ 正确：撤销/重做多个 atom
function MultiAtomHistory() {
  const [text] = useAtom(textAtom);
  const [count] = useAtom(countAtom);

  const undoAll = useAtom(historyUndoAtom([textAtom, countAtom]));
  const redoAll = useAtom(historyRedoAtom([textAtom, countAtom]));

  return <button onClick={undoAll}>Undo All</button>;
}
```

## jotai-scope（作用域控制）

### 核心概念

`jotai-scope` 提供了状态作用域隔离能力，允许你在组件树的特定部分创建独立的状态空间，防止状态泄漏或污染。

### 创建独立作用域

```typescript
import { createScope, Provider, useAtom } from 'jotai/react';

// ✅ 正确：创建独立作用域
const myScope = createScope<string>('initial-value');

// ✅ 正确：在 Provider 中使用作用域
function MyComponent() {
  return (
    <Provider scope={myScope}>
      <ChildComponent />
    </Provider>
  );
}
```

### 实际应用场景

#### 1. 模态框状态隔离

```typescript
import { atom } from 'jotai';
import { createScope, Provider, useAtom } from 'jotai/react';

// 创建模态框作用域
const modalScope = createScope(false);

// 模态框状态 atom（可在多个模态框间共享）
const modalContentAtom = atom<string | null>(null);
const modalOpenAtom = atom((get) => get(modalContentAtom) !== null);

// 模态框 Provider
function ModalProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider scope={modalScope}>
      {children}
      <GlobalModal />
    </Provider>
  );
}

// 模态框内部使用
function GlobalModal() {
  const [isOpen] = useAtom(modalOpenAtom, modalScope);
  const [content] = useAtom(modalContentAtom, modalScope);

  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">{content}</div>
    </div>
  );
}

// 打开模态框
function openModal(content: string) {
  store.set(modalContentAtom, content); // 通过 store 直接设置
}
```

#### 2. 多实例组件状态隔离

```typescript
import { atom, createScope, useAtom, Provider } from 'jotai/react';
import { useMemo } from 'react';

// 每个计数器实例有独立作用域
const createCounterScope = () => createScope(0);

const countAtom = atom((get) => get(baseAtom));
const incrementAtom = atom(null, (get, set) => {
  set(baseAtom, (c) => c + 1);
});

function CounterInstance() {
  // 每个实例创建独立作用域
  const scope = useMemo(() => createCounterScope(), []);
  const [count] = useAtom(countAtom, scope);
  const [, increment] = useAtom(incrementAtom, scope);

  return (
    <div className="counter">
      <span>{count}</span>
      <button onClick={increment}>+</button>
    </div>
  );
}

// 使用多个独立实例
function Dashboard() {
  return (
    <div className="dashboard">
      <CounterInstance />
      <CounterInstance />
      <CounterInstance />
    </div>
  );
}
```

#### 3. 组件库封装（状态黑盒）

```typescript
// library-internal.ts - 库内部实现
import { atom, createScope, useAtom, Provider } from 'jotai/react';

// 创建库内部作用域（外部无法访问）
const libraryScope = createScope(null);

// 内部状态 atom
const internalStateAtom = atom<LibraryState>(initialState);
const internalActionAtom = atom(null, (get, set, action: Action) => {
  // 内部逻辑
});

// 库组件
export function LibraryProvider({ children }: { children: React.ReactNode }) {
  return <Provider scope={libraryScope}>{children}</Provider>;
}

export function LibraryComponent() {
  const [state] = useAtom(internalStateAtom, libraryScope);
  const [, dispatch] = useAtom(internalActionAtom, libraryScope);
  // ...
}

// consumer-code.tsx - 使用库
import { LibraryProvider, LibraryComponent } from 'my-library';

// ❌ 错误：外部无法访问内部 atoms
// useAtom(internalStateAtom) // ReferenceError

// ✅ 正确：通过库提供的 API 使用
function App() {
  return (
    <LibraryProvider>
      <LibraryComponent />
    </LibraryProvider>
  );
}
```

#### 4. 测试环境隔离

```typescript
import { createScope, Provider, useAtom } from 'jotai/react';
import { renderHook, act } from '@testing-library/react';

// 每个测试使用独立作用域
function setup() {
  const testScope = createScope(initialState);

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider scope={testScope}>{children}</Provider>
  );

  return {
    result: renderHook(() => useAtom(atom, testScope), { wrapper }),
    scope: testScope,
  };
}

test('isolated state updates', () => {
  const { result } = setup();
  expect(result.current[0]).toBe(initialState);

  act(() => {
    result.current[1](newValue);
  });

  expect(result.current[0]).toBe(newValue);
  // 不影响其他测试
});
```

### 使用 useAtomScope

```typescript
import { useAtomScope } from 'jotai-scope';

// ✅ 正确：获取当前 Provider 作用域的值
function Component() {
  const theme = useAtomScope(themeAtom);
  return <div theme={theme}>{children}</div>;
}

// ✅ 正确：指定深度访问不同层级
function DeepChild() {
  // depth: 0 = 最近的 Provider
  const localValue = useAtomScope(dataAtom, { depth: 0 });
  // depth: 1 = 上一级 Provider
  const parentValue = useAtomScope(dataAtom, { depth: 1 });
}
```

### 注意事项

- **Provider 必须在使用前包裹**：作用域 atom 需要在 Provider 中才能正常使用
- **作用域隔离是显式的**：通过 `scope` 参数传递给 useAtom
- **store.sub 需指定 scope**：使用 `store.sub(atom, listener, scope)` 进行订阅

```typescript
// ❌ 错误：未在 Provider 中
function BadExample() {
  useAtom(myAtom, myScope); // 报错
}

// ✅ 正确：先包裹 Provider
function GoodExample() {
  return (
    <Provider scope={myScope}>
      <Child />
    </Provider>
  );
}
```

## jotai-utils（工具函数集合）

### useHydrateAtoms（SSR 水合）

用于在 SSR 场景中从服务端传递初始值到 atoms。

```typescript
import { atom, useAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';

const countAtom = atom(0);
const themeAtom = atom('dark');

// ✅ 正确：从服务端获取初始值
function CounterPage({ countFromServer, themeFromServer }) {
  useHydrateAtoms([
    [countAtom, countFromServer],
    [themeAtom, themeFromServer],
  ]);

  const [count] = useAtom(countAtom);
  const [theme] = useAtom(themeAtom);
  return <div>{count} - {theme}</div>;
}
```

**重要行为**：

```typescript
// ❌ 错误：每个 scope 只水合一次，重新渲染时修改初始值不会更新 atom
function BadComponent({ initialCount }) {
  useHydrateAtoms([[countAtom, initialCount]]);
  // initialCount 变化不会更新 countAtom！
}

// ✅ 正确：需要不同初始值时使用不同的组件或条件
function GoodComponent({ serverData }) {
  if (serverData) {
    useHydrateAtoms([[countAtom, serverData.count]]);
  }
  const [count] = useAtom(countAtom);
}
```

**带 Scope 的使用**：

```typescript
import { Provider, createScope } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';

const myScope = createScope('default');

function ScopedComponent() {
  useHydrateAtoms(
    [
      [countAtom, 42],
      [frameworkAtom, 'Next.js'],
    ],
    myScope // 指定 scope
  );
}
```

**典型场景**：

| 场景                 | 用法                                        |
| -------------------- | ------------------------------------------- |
| Next.js SSR 数据传递 | 父组件获取数据，子组件通过 props 接收并水合 |
| 外部数据源初始化     | 从 API/数据库获取数据后水合到 atoms         |
| 多语言配置           | 从服务端获取 locale 并水合到 i18n atoms     |

**与 atomWithStorage 对比**：

| 特性     | useHydrateAtoms | atomWithStorage |
| -------- | --------------- | --------------- |
| 数据来源 | 服务端/外部传入 | localStorage    |
| 时机     | 首次渲染        | 客户端挂载后    |
| SSR 兼容 | ✅ 原生支持     | ❌ 需要特殊处理 |
| 持久化   | ❌ 不持久化     | ✅ 自动持久化   |

```typescript
// ✅ 正确：结合使用
function App({ serverTheme }) {
  // 服务端数据水合
  useHydrateAtoms([[themeAtom, serverTheme]]);

  // 客户端持久化由 atomWithStorage 处理
  // themeAtom = atomWithStorage('theme', serverTheme)
}
```

### Next.js SSR 最佳实践

**核心原则**：

Jotai 不需要全局 Provider，这是与 Redux 等库的重要区别。每个组件树使用独立的 atom store。

#### Hydration 策略

**useHydrateAtoms（推荐）**：

```typescript
'use client';

import { atom, useAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';

const countAtom = atom(0);

// ✅ 正确：从 props 接收服务端数据并水合
export default function Page({ initialCount }: { initialCount: number }) {
  useHydrateAtoms([[countAtom, initialCount]]);

  const [count] = useAtom(countAtom);

  return <div>Count: {count}</div>;
}
```

**强制重新水合**：

```typescript
// ✅ 正确：需要强制重新水合时
useHydrateAtoms(
  [
    [countAtom, serverData.count],
    [themeAtom, serverData.theme],
  ],
  undefined, // scope
  { dangerouslyForceHydrate: true } // 强制水合
);
```

**多 Store 场景**：

```typescript
import { Provider, createScope } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';

const scopeA = createScope();
const scopeB = createScope();

function MultiStorePage({ dataA, dataB }) {
  return (
    <Provider scope={scopeA}>
      <Provider scope={scopeB}>
        <ComponentA data={dataA} />
        <ComponentB data={dataB} />
      </Provider>
    </Provider>
  );
}

function ComponentA({ data }) {
  useHydrateAtoms([[atomA, data]], scopeA);
}

function ComponentB({ data }) {
  useHydrateAtoms([[atomB, data]], scopeB);
}
```

#### TypeScript 类型注意事项

```typescript
// ✅ 正确：ES5 目标使用 as const 保留元组类型
useHydrateAtoms([[countAtom, serverData.count] as const, [themeAtom, serverData.theme] as const]);

// ✅ 正确：使用 Map 传递
useHydrateAtoms(
  new Map([
    [countAtom, serverData.count],
    [themeAtom, serverData.theme],
  ])
);
```

#### 数据预获取模式

**Server Component 中预获取**：

```typescript
// app/page.tsx (Server Component)
import { getData } from '@/lib/api';

export default async function Page() {
  const serverData = await getData();

  return (
    <ClientComponent initialData={serverData} />
  );
}

// app/_components/ClientComponent.tsx (Client Component)
'use client';

import { useHydrateAtoms } from 'jotai/utils';

export function ClientComponent({ initialData }) {
  useHydrateAtoms([[dataAtom, initialData]]);

  const [data] = useAtom(dataAtom);
  // data 已经包含了服务端预获取的数据
}
```

#### SSR 常见问题与解决方案

| 问题             | 原因                           | 解决方案                                  |
| ---------------- | ------------------------------ | ----------------------------------------- |
| Hydration 不匹配 | 服务端和客户端初始值不同       | 使用 `useHydrateAtoms` 传递相同初始值     |
| 闪烁（FOUC）     | 客户端先渲染默认值再更新       | 预获取数据或使用 Suspense                 |
| window 未定义    | SSR 时访问了 `window.location` | 使用 `typeof window !== 'undefined'` 检查 |
| Atom 多次水合    | 同一 atom 在多个组件中水合     | 确保每个 atom 只水合一次                  |

**与 React Query 集成**：

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { useHydrateAtoms } from 'jotai/utils';

export function DataProvider({ serverData, children }) {
  // ✅ 正确：使用 SSR 数据预热 React Query 缓存
  useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
    initialData: serverData, // React Query 会使用此初始数据
  });

  return children;
}
```

## jotai-effect（副作用）

```typescript
import { atom } from 'jotai';
import { atomEffect } from 'jotai-effect';

// ✅ 正确：使用 atomEffect 处理副作用
export const themeAtom = atom('dark');

export const themeEffectAtom = atomEffect((get) => {
  const theme = get(themeAtom);
  document.body.className = theme;
});

// ✅ 正确：清理副作用
const loggingEffectAtom = atomEffect((get) => {
  const count = get(countAtom);
  const unsubscribe = logToServer(count);
  return () => unsubscribe();
});

// ✅ 正确：同步多个 atom 变化
const syncEffectAtom = atomEffect((get) => {
  const a = get(atomA);
  const b = get(atomB);
  // 当 a 或 b 变化时执行
  saveState({ a, b });
});

// ✅ 正确：使用 useAtom 触发 effect
function EffectComponent() {
  useAtom(themeEffectAtom); // effect 会自动执行
  return null;
}
```

## jotai-location（URL 状态管理）

### 核心 API

| API                                       | 用途                                 |
| ----------------------------------------- | ------------------------------------ |
| `atomWithLocation()`                      | 创建与 `window.location` 同步的 atom |
| `atomWithHash(key, initialValue)`         | 创建与 URL hash 双向绑定的 atom      |
| `atomWithSearchParams(key, initialValue)` | 创建与 URL search 双向绑定的 atom    |

### atomWithLocation（URL 路径同步）

```typescript
import { atomWithLocation } from 'jotai-location';

// ✅ 正确：全局单例，整个应用只创建一个
export const locationAtom = atomWithLocation();

// ✅ 正确：在组件中使用
function App() {
  const [location, setLocation] = useAtom(locationAtom);

  // 导航到新页面
  const navigate = (path: string) => {
    setLocation(prev => ({ ...prev, pathname: path }));
  };

  return <button onClick={() => navigate('/about')}>About</button>;
}
```

### atomWithHash（URL Hash 同步）

```typescript
import { atomWithHash } from 'jotai-location';

// ✅ 正确：与 URL hash 双向绑定
export const countAtom = atomWithHash('count', 1);
export const categoryAtom = atomWithHash('category', 'all');

function FilterPage() {
  const [count, setCount] = useAtom(countAtom);
  const [category, setCategory] = useAtom(categoryAtom);

  return (
    <>
      <span>Count: {count}</span>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="all">All</option>
        <option value="active">Active</option>
      </select>
    </>
  );
}
```

### atomWithSearchParams（URL Query 参数同步）

```typescript
import { atomWithSearchParams } from 'jotai-location';

// ✅ 正确：与 URL search 参数双向绑定
export const pageAtom = atomWithSearchParams('page', '1');
export const categoryAtom = atomWithSearchParams('category', 'all');

function Pagination() {
  const [page, setPage] = useAtom(pageAtom);
  const [category, setCategory] = useAtom(categoryAtom);

  return (
    <>
      <span>Page: {page}</span>
      <button onClick={() => setPage('1')}>1</button>
      <button onClick={() => setPage('2')}>2</button>
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="all">All</option>
        <option value="active">Active</option>
      </select>
    </>
  );
}
```

**API 签名**：

```typescript
atomWithSearchParams<Key extends string>(
  key: Key,
  initialValue: string | null,
  options?: {
    replace?: boolean;           // 使用 replaceState 而非 pushState
    delayInit?: boolean;          // 延迟到 onMount 初始化
    serialize?: (value: string | null) => string;
    deserialize?: (search: string) => string | null;
  }
): PrimitiveAtom<string | null>
```

**选项说明**：

| 选项          | 类型                         | 默认值       | 说明                         |
| ------------- | ---------------------------- | ------------ | ---------------------------- |
| `replace`     | `boolean`                    | `false`      | `true` 使用 `replaceState`   |
| `delayInit`   | `boolean`                    | `false`      | `true` 延迟到 onMount 初始化 |
| `serialize`   | `(v) => string`              | 直接转字符串 | 自定义序列化                 |
| `deserialize` | `(search) => string \| null` | 解析参数     | 自定义反序列化               |

**SSR 注意事项**：

```typescript
// ❌ 错误：SSR 时 window 未定义会报错
export const searchAtom = atomWithSearchParams('q', '');

// ✅ 正确：使用 delayInit 延迟初始化
export const searchAtom = atomWithSearchParams('q', '', { delayInit: true });

// ✅ 正确：结合 useHydrateAtoms 做 SSR 水合
function SearchPage({ initialQuery }) {
  useHydrateAtoms([[searchAtom, initialQuery]]);
  const [query] = useAtom(searchAtom);
  // ...
}
```

### 与自定义 useUrlState 对比

| 特性         | jotai-location   | 自定义 useUrlState   |
| ------------ | ---------------- | -------------------- |
| **实例数量** | 全局单例（推荐） | 可多个 hook 实例     |
| **同步方式** | atom 直接同步    | useState + useEffect |
| **SSR 兼容** | 需要特殊处理     | 原生支持             |
| **复杂度**   | 较低             | 较高                 |
| **适用场景** | 简单 URL 状态    | 复杂参数验证/转换    |

### 重要限制

```typescript
// 其他文件导入使用
import { locationAtom } from '@/store/location-atom';

// ❌ 错误：多个实例导致不可预测行为
const location1 = atomWithLocation();
const location2 = atomWithLocation(); // 不推荐！

// ✅ 正确：全局单例
// store/location-atom.ts
export const locationAtom = atomWithLocation();
```

### 自定义 useUrlState 场景

当需要更细粒度控制时，使用自定义 hook：

```typescript
// ✅ 正确：需要参数验证/转换
function useUrlState<T>(key: string, defaultValue: T, validator: (v: unknown) => T) {
  const [value, setValue] = useState(defaultValue);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get(key);
    setValue(raw ? validator(raw) : defaultValue);
  }, [key]);
  // ...
}
```

### 场景选择指南

| 需求                            | 推荐方案               |
| ------------------------------- | ---------------------- |
| 简单 URL 参数（count, page）    | `atomWithHash`         |
| Query 参数（q, page, category） | `atomWithSearchParams` |
| 需要全局 URL 状态               | `atomWithLocation`     |
| SSR 兼容 + 参数验证             | 自定义 `useUrlState`   |
| 复杂 URL 参数结构               | 自定义 `useUrlState`   |

## jotai-optics（透镜/路径访问）

```typescript
import { atom } from 'jotai';
import { optics, focusAtom } from 'jotai-optics';
import { optic } from 'optics-ts';

// ✅ 正确：使用 optics 创建路径 atom
const stateAtom = atom({
  user: { profile: { name: 'John', age: 30 } },
  settings: { theme: 'dark' },
});

export const userNameAtom = optics(stateAtom).prop('user').prop('profile').prop('name').atom();

// ✅ 正确：使用 focusAtom 更新嵌套路径
function UserNameInput() {
  const [name, setName] = useAtom(
    focusAtom(
      stateAtom,
      optic<typeof stateAtom>().prop('user').prop('profile').prop('name')
    )
  );
  return <input value={name} onChange={(e) => setName(e.target.value)} />;
}

// ✅ 正确：数组透镜
const todosAtom = atom<Todo[]>([]);
const firstTodoTitleAtom = optics(todosAtom).index(0).prop('title').atom();

// ✅ 正确：多个路径的透镜
const userEmailAtom = optics(stateAtom)
  .prop('user')
  .prop('profile')
  .prop('email')
  .atom();
```

## @builden/bd-utils 自定义扩展

### atomWithDebounce（防抖 atom）

**来源**: `@builden/bd-utils/jotai`

**作用**: 创建带防抖功能的 atom，延迟更新目标值，适用于搜索输入等场景。

### 安装

```bash
# peerDependencies（消费项目需要安装）
bun add jotai

# bd-utils 内部使用，无需额外配置
```

### 基本用法

```typescript
import { atomWithDebounce } from '@builden/bd-utils/jotai';

// ✅ 正确：创建防抖 atom
export const searchAtoms = atomWithDebounce('', 300); // 默认延迟 500ms

// ✅ 正确：自定义延迟
export const sidebarSearchAtoms = atomWithDebounce('', 400);
export const fileTreeSearchAtoms = atomWithDebounce('', 300);
```

### 返回对象结构

| 属性                 | 类型                 | 用途                   |
| -------------------- | -------------------- | ---------------------- |
| `currentValueAtom`   | `Atom<T>`            | 当前值（立即更新）     |
| `debouncedValueAtom` | `WritableAtom<T>`    | 防抖后的值（延迟更新） |
| `isDebouncingAtom`   | `Atom<boolean>`      | 是否正在防抖           |
| `clearTimeoutAtom`   | `WritableAtom<void>` | 手动清除定时器         |

### 在组件中使用

```typescript
import { useAtom } from 'jotai';
import { searchAtoms } from '@/store/search-atom';

function SearchInput() {
  // currentValueAtom：用户输入的当前值（立即响应）
  const [currentValue, setCurrentValue] = useAtom(searchAtoms.currentValueAtom);
  // debouncedValueAtom：防抖后的值（用于触发搜索）
  const [debouncedValue] = useAtom(searchAtoms.debouncedValueAtom);
  // isDebouncingAtom：防抖状态（可用于显示加载指示器）
  const [isDebouncing] = useAtom(searchAtoms.isDebouncingAtom);

  return (
    <div>
      <input
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        placeholder="搜索..."
      />
      {isDebouncing && <span>正在搜索...</span>}
      {/* 使用 debouncedValue 触发实际搜索 */}
      <SearchResults query={debouncedValue} />
    </div>
  );
}
```

### 完整示例：侧边栏搜索

```typescript
// store/search/primitives/search-atom.ts
import { atomWithDebounce } from '@builden/bd-utils/jotai';

/**
 * 侧边栏搜索防抖 atom (400ms 延迟)
 */
export const sidebarSearchAtoms = atomWithDebounce('', 400);

/**
 * 文件树搜索防抖 atom (300ms 延迟)
 */
export const fileTreeSearchAtoms = atomWithDebounce('', 300);
```

```typescript
// store/search/actions/use-search.ts
import { useAtom } from 'jotai';
import { sidebarSearchAtoms, fileTreeSearchAtoms } from '../primitives/search-atom';

/**
 * 侧边栏搜索 Hook - 使用 atomWithDebounce 自动防抖
 */
export function useSidebarSearch() {
  const [currentValue, setCurrentValue] = useAtom(sidebarSearchAtoms.currentValueAtom);
  const [debouncedValue] = useAtom(sidebarSearchAtoms.debouncedValueAtom);

  return {
    searchQuery: currentValue,
    setSearchQuery: setCurrentValue,
    debouncedSearchQuery: debouncedValue,
  };
}

/**
 * 文件树搜索 Hook - 使用 atomWithDebounce 自动防抖
 */
export function useFileTreeSearch() {
  const [currentValue, setCurrentValue] = useAtom(fileTreeSearchAtoms.currentValueAtom);
  const [debouncedValue] = useAtom(fileTreeSearchAtoms.debouncedValueAtom);

  return {
    searchQuery: currentValue,
    setSearchQuery: setCurrentValue,
    debouncedSearchQuery: debouncedValue,
  };
}
```

### API 参考

```typescript
atomWithDebounce<T>(
  initialValue: T,           // 初始值
  delayMilliseconds?: number, // 防抖延迟（默认 500ms）
  shouldDebounceOnReset?: boolean // 重置时是否防抖（默认 false）
): AtomWithDebounceResult<T>
```

### 与 lodash.debounce 对比

| 特性     | atomWithDebounce   | lodash.debounce |
| -------- | ------------------ | --------------- |
| 状态管理 | 原生集成 Jotai     | 独立函数        |
| 响应式   | 原子级别响应       | 需要手动绑定    |
| 取消方式 | `clearTimeoutAtom` | 返回的取消函数  |
| 适用场景 | React 状态防抖     | 通用防抖        |

### 注意事项

- 防抖 atom 返回的是 4 个独立的 atom，需要分别使用 `useAtom` 订阅
- `currentValueAtom` 会立即更新，`debouncedValueAtom` 会延迟更新
- 适合用于搜索输入、实时过滤等需要避免频繁请求的场景

## 相关章节

- [SKILL.md](SKILL.md) - 场景选择指南
- [jotai-core.md](jotai-core.md) - 核心概念
- [jotai-common.md](jotai-common.md) - 常用模式
- [jotai-advanced.md](jotai-advanced.md) - 高级特性（selectAtom、splitAtom、focusAtom、atomWithReducer 等）
