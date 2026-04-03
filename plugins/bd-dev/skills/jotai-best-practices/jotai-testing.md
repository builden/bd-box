# Jotai 测试专题

本文档涵盖 Jotai atoms 的两类测试策略：React 组件行为测试和 Node 环境纯 atom 测试。

## 测试分层

| 层级   | 测试对象       | 工具                  | 特点                 |
| ------ | -------------- | --------------------- | -------------------- |
| **L1** | React 组件行为 | React Testing Library | 用户视角，集成测试   |
| **L2** | Pure atom 逻辑 | `createStore`         | 开发者视角，单元测试 |

**原则**：优先 L1 测试（用户行为），L2 用于复杂 atom 逻辑验证。

---

## L1: React 组件测试

### 核心原则

> Jotai 测试应模拟用户使用方式，而非测试内部实现。

### TestProvider 封装

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider, atom, useAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';

// === 待测组件 ===
const countAtom = atom(0);

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  return (
    <div>
      <span data-testid="count">{count}</span>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
    </div>
  );
}

// === TestProvider 封装 ===
function HydrateAtoms({ initialValues, children }) {
  useHydrateAtoms(initialValues);
  return children;
}

function TestProvider({ initialValues, children }) {
  return (
    <Provider>
      <HydrateAtoms initialValues={initialValues}>{children}</HydrateAtoms>
    </Provider>
  );
}
```

### 基础测试

```tsx
test('counter increments', async () => {
  render(<Counter />);

  expect(screen.getByTestId('count')).toHaveTextContent('0');

  await userEvent.click(screen.getByText('Increment'));

  expect(screen.getByTestId('count')).toHaveTextContent('1');
});
```

### 带初始值的测试

```tsx
test('counter with initial value', async () => {
  render(
    <TestProvider initialValues={[[countAtom, 100]]}>
      <Counter />
    </TestProvider>
  );

  expect(screen.getByTestId('count')).toHaveTextContent('100');
});
```

### 防抖/节流场景测试

```tsx
const debouncedSearchAtom = atomWithDebounce('', 300);

function SearchInput() {
  const [currentValue, setCurrentValue] = useAtom(debouncedSearchAtom.currentValueAtom);
  const [debouncedValue] = useAtom(debouncedSearchAtom.debouncedValueAtom);

  return (
    <div>
      <input data-testid="search-input" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} />
      <span data-testid="debounced-value">{debouncedValue}</span>
    </div>
  );
}

test('debounced search waits before updating', async () => {
  render(<SearchInput />);

  const input = screen.getByTestId('search-input');

  await userEvent.type(input, 'hello');

  // 立即显示当前值
  expect(screen.getByTestId('debounced-value')).toHaveTextContent('');

  // 等待防抖
  await waitFor(() => {
    expect(screen.getByTestId('debounced-value')).toHaveTextContent('hello');
  });
});
```

---

## L2: Node 环境 atom 测试

使用 `createStore` 在 Node 环境中测试 pure atom 逻辑，无需 React。

### createStore API

| 方法                             | 说明                   |
| -------------------------------- | ---------------------- |
| `store.get(atom)`                | 读取当前值             |
| `store.set(atom, value)`         | 设置值                 |
| `store.set(atom, (prev) => ...)` | 函数式更新             |
| `store.sub(atom, callback)`      | 订阅变化，返回取消函数 |

### 基础用法

```typescript
import { createStore, atom } from 'jotai';

const store = createStore();

const countAtom = atom(0);
const doubledAtom = atom((get) => get(countAtom) * 2);

// 设置初始值
store.set(countAtom, 10);

// 读取派生值
console.log(store.get(countAtom)); // 10
console.log(store.get(doubledAtom)); // 20
```

### 订阅与取消订阅

```typescript
const unsubscribe = store.sub(countAtom, () => {
  console.log('count changed:', store.get(countAtom));
});

store.set(countAtom, 20); // 触发订阅回调，输出 "count changed: 20"

unsubscribe(); // 取消订阅

store.set(countAtom, 30); // 不再触发回调
```

### 函数式更新

```typescript
store.set(countAtom, (prev) => prev + 1);
console.log(store.get(countAtom)); // 21
```

### 异步 atom 测试

```typescript
import { createStore, atom } from 'jotai';
import { loadable } from 'jotai/utils';

const asyncAtom = atom(async (get) => {
  const id = get(idAtom);
  return fetchUser(id);
});

const idAtom = atom('user-1');

test('async atom loads data', async () => {
  const store = createStore();
  const loadableAsyncAtom = loadable(asyncAtom);

  store.set(idAtom, 'user-1');

  const result = store.get(loadableAsyncAtom);

  // loadable 返回加载状态
  expect(result.state).toBe('loading');

  // 等待 resolve
  await waitFor(() => {
    const resolved = store.get(loadableAsyncAtom);
    expect(resolved.state).toBe('hasData');
    expect(resolved.data).toEqual({ id: 'user-1', name: 'Alice' });
  });
});
```

### 测试 store 隔离

```typescript
test('isolated stores do not share state', () => {
  const storeA = createStore();
  const storeB = createStore();

  const countAtom = atom(0);

  storeA.set(countAtom, 100);
  storeB.set(countAtom, 200);

  expect(storeA.get(countAtom)).toBe(100);
  expect(storeB.get(countAtom)).toBe(200);
});
```

---

## 常见问题

### Q: 如何测试 atomFamily？

```typescript
import { atomFamily } from 'jotai-family';

const todoAtomFamily = atomFamily((id: string) => atom({ id, text: '', completed: false }));

test('todo atom family creates isolated atoms', () => {
  const store = createStore();

  store.set(todoAtomFamily('1'), { id: '1', text: 'Task 1', completed: false });
  store.set(todoAtomFamily('2'), { id: '2', text: 'Task 2', completed: true });

  expect(store.get(todoAtomFamily('1'))).toEqual({ id: '1', text: 'Task 1', completed: false });
  expect(store.get(todoAtomFamily('2'))).toEqual({ id: '2', text: 'Task 2', completed: true });

  // 清理
  todoAtomFamily.remove('1');
  todoAtomFamily.remove('2');
});
```

### Q: 如何测试派生 atom 的依赖追踪？

```typescript
const baseAtom = atom(10);
const multiplierAtom = atom(2);
const derivedAtom = atom((get) => get(baseAtom) * get(multiplierAtom));

test('derived atom tracks dependencies', () => {
  const store = createStore();

  expect(store.get(derivedAtom)).toBe(20);

  store.set(multiplierAtom, 3);
  expect(store.get(derivedAtom)).toBe(30);

  store.set(baseAtom, 5);
  expect(store.get(derivedAtom)).toBe(15);
});
```

### Q: 如何测试 atomWithStorage？

```typescript
// Mock localStorage
const mockStorage = new Map();

const storageAtom = atomWithStorage('test-key', 'default', {
  getItem: (key) => mockStorage.get(key) ?? null,
  setItem: (key, value) => mockStorage.set(key, value),
  removeItem: (key) => mockStorage.delete(key),
});

test('atomWithStorage persists value', () => {
  const store = createStore();

  store.set(storageAtom, 'hello');
  expect(store.get(storageAtom)).toBe('hello');
  expect(mockStorage.get('test-key')).toBe('hello');
});
```

---

## 相关章节

- [jotai-core.md](jotai-core.md) - atom 创建、loadable、atomFamily
- [jotai-common.md](jotai-common.md) - Store API 详细用法
- [jotai-advanced.md](jotai-advanced.md) - selectAtom、splitAtom 等高级特性
- [pressure-scenarios.ts](pressure-scenarios.ts) - 压力场景测试（错误模式识别）
