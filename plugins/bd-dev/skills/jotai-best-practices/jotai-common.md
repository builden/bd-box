# Jotai 常用模式

本文档包含 Jotai 的常用模式，包括 Store API、Immer 不可变更新、工厂模式、实用工具 atoms。

## Store API 最佳实践

```typescript
import { atom, createStore, getDefaultStore, useStore } from 'jotai';

// ✅ 正确：使用 getDefaultStore 获取默认 store
const store = getDefaultStore();

// ✅ 正确：创建独立的 store 实例
const customStore = createStore();

// ✅ 正确：在组件外读取 atom 值
export function getGlobalCount(): number {
  return store.get(countAtom);
}

// ✅ 正确：在组件外设置 atom 值
export function incrementGlobalCount(): void {
  store.set(countAtom, (c) => c + 1);
}

// ✅ 正确：订阅 atom 变化
store.sub(countAtom, () => {
  console.log('Count changed:', store.get(countAtom));
});

// ✅ 正确：atom onMount 清理
const cleanupAtom = atom(0);
cleanupAtom.onMount = (setAtom) => {
  const timer = setInterval(() => {
    setAtom((c) => c + 1);
  }, 1000);
  return () => clearInterval(timer);
};

// ✅ 正确：在组件中使用 useStore 或 useAtom
function GoodComponent() {
  const store = useStore();
  const [count] = useAtom(countAtom);

  useEffect(() => {
    const unsub = store.sub(countAtom, () => {
      console.log('Changed');
    });
    return unsub;
  }, [store]);
}
```

## 自定义 Store（createStore）

**核心区别**：

- `getDefaultStore()`：返回全局默认 store，整个应用共享
- `createStore()`：创建独立的 store 实例，状态隔离

### 何时使用自定义 store

```typescript
import { atom, createStore, useAtom, Provider } from 'jotai';

// ✅ 正确：多实例组件状态隔离
const countAtom = atom(0);

function CounterInstance() {
  const [count] = useAtom(countAtom);
  return <span>{count}</span>;
}

function MultiCounterApp() {
  // 每个 Provider 有独立的 atom 状态
  return (
    <div>
      <Provider key="counter1">
        <CounterInstance />
        <CounterInstance />
      </Provider>
      <Provider key="counter2">
        <CounterInstance />
        <CounterInstance />
      </Provider>
    </div>
  );
}

// ✅ 正确：测试环境隔离
function createTestStore(initialValues?: Record<string, unknown>) {
  const store = createStore();
  if (initialValues) {
    for (const [key, value] of Object.entries(initialValues)) {
      store.set(atom(key), value);
    }
  }
  return store;
}

// ✅ 正确：微前端/插件隔离
function createPluginStore() {
  return createStore(); // 插件内部状态与主应用隔离
}
```

### 自定义 store 注意事项

```typescript
// ❌ 错误：atom 在模块间共享
// my-atoms.ts
export const sharedAtom = atom(0);

// component1.tsx - 使用默认 store
const [count] = useAtom(sharedAtom);

// component2.tsx - 也使用默认 store（共享状态）
const [count2] = useAtom(sharedAtom);

// ✅ 正确：自定义 store 不与默认 store 共享
const localStore = createStore();
localStore.set(sharedAtom, 42); // 只影响 localStore

// ❌ 错误：useAtom 默认绑定到全局 Provider
function Component() {
  const [count] = useAtom(sharedAtom); // 使用默认 store
  const localCount = localStore.get(sharedAtom); // 需要用 store.get()
}

// ✅ 正确：组件中使用自定义 store
function IsolatedComponent() {
  return (
    <Provider store={localStore}>
      <Child />
    </Provider>
  );
}

function Child() {
  const [count] = useAtom(sharedAtom); // 使用 localStore
}
```

### Store API 方法

```typescript
const store = createStore();

// 读取值
store.get(myAtom); // 同步获取当前值

// 设置值
store.set(myAtom, newValue);
store.set(myAtom, (prev) => prev + 1); // 函数式更新

// 订阅变更
const unsub = store.sub(myAtom, () => {
  console.log('Changed:', store.get(myAtom));
});
unsub(); // 取消订阅

// 组合多个订阅
const unsub1 = store.sub(atomA, listenerA);
const unsub2 = store.sub(atomB, listenerB);

// 清理所有订阅
store.teardown(); // 销毁 store
```

### 与 useAtom 配合使用

```typescript
import { atom, createStore, useAtom, Provider } from 'jotai';

// ✅ 正确：Provider 包裹使用自定义 store
const myStore = createStore();

function MyComponent() {
  return (
    <Provider store={myStore}>
      <InnerComponent />
    </Provider>
  );
}

function InnerComponent() {
  // 所有 useAtom 都使用 myStore
  const [value] = useAtom(myAtom);
  const [value2] = useAtom(myAtom2);
}

// ✅ 正确：useStore 获取当前 store
function Child() {
  const store = useStore();
  // store 就是 Provider 传入的 store
}
```

## 与 Immer 结合

```typescript
import { produce } from 'immer';
import { atom } from 'jotai';

// ✅ 正确：使用 immer produce 简化不可变更新
export const formDataAtom = atom<FormState>(initialState);

export const updateFormFieldAtom = atom(null, (get, set, { field, value }: { field: string; value: unknown }) => {
  set(
    formDataAtom,
    produce((draft) => {
      setNested(draft, field, value);
    })
  );
});
```

**详细用法请参考 [jotai-immer.md](jotai-immer.md)**，包括：

- `atomWithImmer` 和 `useImmerAtom` 的详细用法
- 与 `atomWithStorage`、`atomWithQuery` 的集成模式
- 自定义 "with" 模式设计（atomWithValidator、atomWithUndoRedo、atomWithAnalytics）

## 常见错误与修复

### 循环依赖

```typescript
// ❌ 错误：互相依赖
const aAtom = atom((get) => get(bAtom) * 2);
const bAtom = atom((get) => get(aAtom) + 1);

// ✅ 正确：扁平结构
const baseAtom = atom(10);
const aAtom = atom((get) => get(baseAtom) * 2);
const bAtom = atom((get) => get(baseAtom) + 1);
```

### 对象引用不稳定

```typescript
// ❌ 错误：每次返回新对象
const configAtom = atom((get) => ({
  user: get(userAtom),
  theme: get(themeAtom),
}));

// ✅ 正确：使用 atom 存储对象
const configAtom = atom({
  user: defaultUser,
  theme: defaultTheme,
});
```

### 直接修改状态

```typescript
// ❌ 错误：直接修改
function updateItem(item: Item) {
  item.completed = true;
  setItemsAtom([...items]);
}

// ✅ 正确：不可变更新
function updateItem(id: string, updates: Partial<Item>) {
  setItemsAtom((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
}
```

## 工厂模式

```typescript
import { atom } from 'jotai';

// ✅ 正确：创建可复用的 atom 组工厂
const createCounterAtoms = (initialValue: number = 0) => {
  const baseAtom = atom(initialValue);
  const valueAtom = atom((get) => get(baseAtom));
  const incAtom = atom(null, (get, set) => {
    set(baseAtom, (c) => c + 1);
  });
  const resetAtom = atom(null, (get, set) => {
    set(baseAtom, initialValue);
  });

  return { baseAtom, valueAtom, incAtom, resetAtom };
};

// ✅ 正确：每次调用创建新 atoms
const goodFactory = (initialValue: number) => {
  const baseAtom = atom(initialValue);
  return {
    valueAtom: atom((get) => get(baseAtom)),
    incAtom: atom(null, (get, set) => set(baseAtom, (c) => c + 1)),
  };
};
```

## Utility Atoms（实用工具）

### atomWithToggle（开关 atom）

```typescript
import { atomWithToggle } from 'jotai/utils';

// ✅ 正确：创建可切换的布尔值 atom
export const isModalOpenAtom = atomWithToggle(false);

// ✅ 正确：无参数调用时自动切换
function ToggleButton() {
  const [isOpen, toggle] = useAtom(isModalOpenAtom);
  return <button onClick={toggle}>{isOpen ? '关闭' : '打开'}</button>;
}
```

### atomWithDebounce（防抖 atom）

> 注意：`jotai/utils` 中没有 `atomWithDebounce`，请使用 `@builden/bd-utils` 提供的实现。

**详细文档**: [jotai-extensions.md](jotai-extensions.md) - 见 `@builden/bd-utils 自定义扩展` 章节

```typescript
import { atomWithDebounce } from '@builden/bd-utils/jotai';

// ✅ 正确：创建带防抖的搜索 atom
const searchAtoms = atomWithDebounce('', 300);

// ✅ 正确：在组件中使用防抖 atoms
function SearchInput() {
  const [currentValue, setCurrentValue] = useAtom(searchAtoms.currentValueAtom);
  const [debouncedValue] = useAtom(searchAtoms.debouncedValueAtom);

  useEffect(() => {
    if (debouncedValue) {
      performSearch(debouncedValue);
    }
  }, [debouncedValue]);

  return (
    <input
      value={currentValue}
      onChange={(e) => setCurrentValue(e.target.value)}
      placeholder="搜索..."
    />
  );
}
```

### atomWithToggleAndStorage（持久化开关）

```typescript
import { atomWithToggleAndStorage } from 'jotai/utils';

// ✅ 正确：创建带持久化的开关 atom
export const themeToggleAtom = atomWithToggleAndStorage('app-dark-mode', false);
```

## 相关章节

- [jotai-core.md](jotai-core.md) - 核心必读（基础 atom、loadable、atomWithStorage、atomFamily）
- [jotai-immer.md](jotai-immer.md) - Immer 不可变更新（atomWithImmer、useImmerAtom、自定义 "with" 模式）
- [jotai-advanced.md](jotai-advanced.md) - 高级特性（selectAtom、splitAtom、focusAtom、atomWithReducer 等）
- [jotai-extensions.md](jotai-extensions.md) - 生态库扩展（tanstack-query、history、scope 等）
