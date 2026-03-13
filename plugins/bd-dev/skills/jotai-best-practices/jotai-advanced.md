# Jotai 高级特性

本文档包含 Jotai 高级特性的详细参考：selectAtom、splitAtom、focusAtom、atomWithReducer、atomWithCallback 等。

## selectAtom（选择器派生）

**核心特点**：selectAtom 是**只读**的派生 atom，用于从源 atom 中提取/派生部分状态。

```typescript
import { atom } from 'jotai';
import { selectAtom } from 'jotai/utils';

// ✅ 正确：使用 selectAtom 派生部分状态
interface State {
  user: { name: string; age: number };
  settings: { theme: string };
  posts: { id: number; title: string }[];
}

const stateAtom = atom<State>(initialState);

// 只选择 user.name（只读，不能直接修改）
export const userNameAtom = selectAtom(stateAtom, (state) => state.user.name);

// ✅ 正确：带有依赖的选择器
export const adultUsersAtom = selectAtom(usersAtom, (users) => users.filter((user) => user.age >= 18));

// ✅ 正确：复杂条件选择
export const visibleTodosAtom = selectAtom(todosAtom, (todos) => todos.filter((todo) => !todo.hidden));

// ✅ 正确：使用 ref 避免不必要的重新渲染
const expensiveSelector = selectAtom(
  dataAtom,
  (data) => {
    return data.computedValue;
  },
  (prev, next) => prev === next
); // 引用比较

// ❌ 错误：选择器中执行副作用
const badAtom = selectAtom(stateAtom, (state) => {
  saveToServer(state.user.name); // ❌ 禁止！
  return state.user.name;
});

// ❌ 错误：选择器返回新对象
const objectSelectorAtom = selectAtom(stateAtom, (state) => ({
  name: state.user.name,
  theme: state.settings.theme, // ❌ 每次返回新对象
}));

// ✅ 正确：拆分选择器或使用派生 atom
const nameAtom = selectAtom(stateAtom, (state) => state.user.name);
const themeAtom = selectAtom(stateAtom, (state) => state.settings.theme);
```

### selectAtom vs focusAtom vs splitAtom 对比

| 特性         | selectAtom       | focusAtom     | splitAtom         |
| ------------ | ---------------- | ------------- | ----------------- |
| **读写性**   | 只读             | 可写          | 只读（元素可写）  |
| **作用目标** | 提取值           | 更新嵌套路径  | 拆分数组          |
| **返回值**   | 派生值           | 路径值        | atom 数组         |
| **修改方式** | 通过源 atom 修改 | 直接 set 路径 | 修改单个元素 atom |
| **适用场景** | 派生计算、过滤   | 深层嵌套更新  | 列表独立渲染      |

```typescript
// selectAtom：只读派生（提取 user.name）
const nameAtom = selectAtom(stateAtom, (state) => state.user.name);

// focusAtom：可读写（直接修改深层路径）
const userNameAtom = focusAtom(stateAtom, (optic) => optic.prop('user').prop('name'));
// 使用：set(userNameAtom, 'newName')

// splitAtom：拆分数组（每个元素独立更新）
const todoAtomsAtom = splitAtom(todosAtom, (todo) => todo.id);
// 使用：每个 todo 元素有独立的 atom，可单独修改
```

## splitAtom（数组拆分）

```typescript
import { atom } from 'jotai';
import { splitAtom } from 'jotai/utils';
import { atomFamily } from 'jotai-family';

// ✅ 正确：使用 splitAtom 拆分数组为独立 atoms
interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

const todosAtom = atom<Todo[]>([]);

// 拆分为每个 todo 的 atom family
export const todoAtomsAtom = splitAtom(todosAtom, (todo) => todo.id);

// ✅ 正确：在组件中独立渲染每个 todo
function TodoList() {
  const [todos] = useAtom(todosAtom);
  const [todoAtoms] = useAtom(todoAtomsAtom);

  return (
    <ul>
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}

function TodoItem({ todo }: { todo: Todo }) {
  // 每个 item 订阅自己的 atom
  const [completed, setCompleted] = useAtom(
    splitAtom(todosAtom, (t) => t.id).atom(todo.id)
  );

  return (
    <li>
      <input
        type="checkbox"
        checked={completed}
        onChange={(e) => setCompleted(e.target.checked)}
      />
      {todo.text}
    </li>
  );
}

// ✅ 正确：带有条件的拆分
export const activeTodoAtomsAtom = splitAtom(todosAtom, (todo) => todo.id, {
  filter: (todo) => !todo.completed, // 只包含未完成的
});

// ❌ 错误：在组件外使用 splitAtom 的结果
function BadComponent() {
  const [allAtoms] = useAtom(todoAtomsAtom);
  allAtoms.forEach((atom) => {
    useAtom(atom); // ❌ 这不是正确的用法
  });
}

// ✅ 正确：结合 atomFamily 使用
export const todoAtomFamily = atomFamily((id: string) =>
  atom<Todo | null>(null)
);

function TodoListOptimized() {
  const [todos] = useAtom(todosAtom);

  return (
    <ul>
      {todos.map((todo) => (
        <TodoItem key={todo.id} id={todo.id} />
      ))}
    </ul>
  );
}

function TodoItem({ id }: { id: string }) {
  const [todo] = useAtom(todoAtomFamily(id));
  // 只订阅需要的字段
  const [completed] = useAtom(
    selectAtom(todoAtomFamily(id), (t) => t?.completed ?? false)
  );

  return <li>{todo?.text}</li>;
}
```

## focusAtom + optics-ts（嵌套路径更新）

```typescript
import { atom } from 'jotai';
import { focusAtom } from 'jotai/utils';
import { optic } from 'optics-ts';

// ✅ 正确：使用 focusAtom 更新嵌套路径
const stateAtom = atom({
  user: { profile: { name: '', age: 0 } },
  settings: { theme: 'dark' },
});

const userNameAtom = focusAtom(
  stateAtom,
  (optic) => optic.prop('user').prop('profile').prop('name')
);

function UserNameInput() {
  const [name, setName] = useAtom(userNameAtom);
  return <input value={name} onChange={(e) => setName(e.target.value)} />;
}

// ✅ 正确：更新嵌套数组元素
const todoAtom = focusAtom(
  todosAtom,
  (optic) => optic.index(todoId).prop('completed')
);

// ✅ 正确：使用 onChange 回调
const updateNameAtom = focusAtom(
  stateAtom,
  (optic) => optic.prop('user').prop('name'),
  (optic) => (state, value) => state.user.name = value
);
```

## atomWithReducer（Redux 风格）

```typescript
import { atom } from 'jotai';
import { atomWithReducer } from 'jotai/utils';

// ✅ 正确：使用 atomWithReducer 处理复杂状态更新
type Action =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'SET'; value: number }
  | { type: 'RESET' };

const counterReducer = (state: number, action: Action): number => {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1;
    case 'DECREMENT':
      return state - 1;
    case 'SET':
      return action.value;
    case 'RESET':
      return 0;
    default:
      return state;
  }
};

export const counterAtom = atomWithReducer(0, counterReducer);

function Counter() {
  const [count, dispatch] = useAtom(counterAtom);

  return (
    <div>
      <span>{count}</span>
      <button onClick={() => dispatch({ type: 'INCREMENT' })}>+</button>
      <button onClick={() => dispatch({ type: 'DECREMENT' })}>-</button>
      <button onClick={() => dispatch({ type: 'SET', value: 0 })}>Reset</button>
    </div>
  );
}

// ✅ 正确：复杂对象的 reducer
interface TodoState {
  items: { id: string; text: string; completed: boolean }[];
  filter: 'all' | 'active' | 'completed';
}

type TodoAction =
  | { type: 'ADD_TODO'; text: string }
  | { type: 'TOGGLE_TODO'; id: string }
  | { type: 'SET_FILTER'; filter: TodoState['filter'] };

const todoReducer = (state: TodoState, action: TodoAction): TodoState => {
  switch (action.type) {
    case 'ADD_TODO':
      return {
        ...state,
        items: [
          ...state.items,
          { id: crypto.randomUUID(), text: action.text, completed: false },
        ],
      };
    case 'TOGGLE_TODO':
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.id ? { ...item, completed: !item.completed } : item
        ),
      };
    case 'SET_FILTER':
      return { ...state, filter: action.filter };
    default:
      return state;
  }
};

export const todoStateAtom = atomWithReducer<TodoState>(
  { items: [], filter: 'all' },
  todoReducer
);
```

## atomWithCallback（回调模式）

```typescript
import { atomWithCallback } from 'jotai/utils';

// ✅ 正确：使用 atomWithCallback 在状态变化时触发回调
const countAtom = atomWithCallback(0, (get, set, newValue: number) => {
  // 状态更新前的逻辑
  console.log('About to update count to:', newValue);
  set(newValue);
});

// ✅ 正确：自动保存到 localStorage
const persistedAtom = atomWithCallback(
  (get) => get(countAtom),
  (get, set, value: number) => {
    localStorage.setItem('count', String(value));
    set(value);
  }
);

// ✅ 正确：表单验证回调
const formAtom = atomWithCallback(
  { name: '', email: '' },
  (get, set, updates: Partial<{ name: string; email: string }>) => {
    const current = get(formAtom);
    const merged = { ...current, ...updates };

    // 验证逻辑
    if (updates.email && !updates.email.includes('@')) {
      console.warn('Invalid email');
      return;
    }

    set(merged);

    // 回调：表单变化时保存
    if (updates.name) {
      console.log('Name changed to:', updates.name);
    }
  }
);

// ✅ 正确：异步回调
const asyncCallbackAtom = atomWithCallback(0, async (get, set, newValue: number) => {
  // 异步操作
  await saveToServer(newValue);
  set(newValue);
});
```

## atomWithReset（重置值）

```typescript
import { atom } from 'jotai';
import { atomWithReset, useResetAtom } from 'jotai/utils';

// ✅ 正确：使用 atomWithReset 创建可重置的 atom
const formDataAtom = atomWithReset({
  name: '',
  email: '',
  message: '',
});

function ContactForm() {
  const [formData, setFormData] = useAtom(formDataAtom);
  const resetForm = useResetAtom(formDataAtom);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <input value={formData.name} onChange={(e) => handleChange('name', e.target.value)} />
      <input value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
      <button onClick={resetForm}>重置</button>
    </>
  );
}
```

## atomWithDefault（默认值派生）

```typescript
import { atom } from 'jotai';
import { atomWithDefault } from 'jotai/utils';

// ✅ 正确：使用 atomWithDefault 动态计算默认值
const searchQueryAtom = atomWithDefault((get) => {
  const user = get(userAtom);
  return user?.defaultSearch ?? '';
});

// ✅ 正确：结合 localStorage 实现持久化默认值
const themeAtom = atomWithDefault((get) => {
  if (typeof window === 'undefined') return 'light';
  return localStorage.getItem('theme') ?? 'light';
});

// ✅ 正确：基于其他 atom 派生默认值
const filteredListAtom = atomWithDefault((get) => {
  const items = get(itemsAtom);
  const filter = get(filterAtom);
  return items.filter((item) => item.category === filter);
});

// ❌ 错误：在 atomWithDefault 中使用副作用
const badAtom = atomWithDefault((get) => {
  const user = get(userAtom);
  saveToAnalytics(user.preferences); // ❌ 禁止！
  return user.preferences.theme;
});

// ✅ 正确：复杂表单默认值
const initialFormData = { name: '', email: '', phone: '' };
const formDataAtom = atomWithDefault(() => ({ ...initialFormData }));

function EditForm({ userData }: { userData: UserData }) {
  const [formData, setFormData] = useAtom(formDataAtom);

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
      });
    }
  }, [userData, setFormData]);

  return <Form />;
}
```

## atomWithCache（缓存异步结果）

```typescript
import { atom } from 'jotai';
import { atomWithCache } from 'jotai-cache';

// ✅ 正确：使用 atomWithCache 缓存异步数据
export const userDataAtom = atomWithCache(async (get) => {
  const userId = get(selectedUserIdAtom);
  if (!userId) return null;
  return fetchUser(userId);
});

// ✅ 正确：缓存带有依赖的查询
export const cachedProductsAtom = atomWithCache(async (get) => {
  const category = get(selectedCategoryAtom);
  return fetchProducts(category);
});

// ✅ 正确：手动失效缓存
const clearUserCacheAtom = atom(null, (get, set) => {
  set(userDataAtom, undefined); // 失效缓存
});

// ✅ 正确：结合 refetch 选项
export const freshDataAtom = atomWithCache(
  async (get) => {
    const id = get(itemIdAtom);
    return fetchItem(id);
  },
  {
    refetch: (prev, next) => prev !== next,
  }
);

// ❌ 错误：在 atomWithCache 中使用 set
const badAtom = atomWithCache(async (get, set) => {
  const data = await fetchData();
  set(otherAtom, data); // ❌ atomWithCache 只读
});

// ❌ 错误：atomWithCache 依赖不稳定的值
const unstableAtom = atomWithCache(async (get) => {
  const random = Math.random(); // ❌ 每次都是新值，无法缓存
  return fetchData(random);
});
```

## 快速参考表

| 场景     | 模式                             | 关键点            |
| -------- | -------------------------------- | ----------------- |
| 部分选择 | `selectAtom(source, selector)`   | 避免返回新对象    |
| 数组拆分 | `splitAtom(array, keySelector)`  | key 必须唯一      |
| 焦点更新 | `focusAtom(source, optic)`       | 更新嵌套路径      |
| 重置值   | `atomWithReset(initial)`         | 配合 useResetAtom |
| 默认值   | `atomWithDefault(getter)`        | 动态派生          |
| 缓存     | `atomWithCache(fn, options)`     | 只读，依赖稳定    |
| Redux    | `atomWithReducer(init, reducer)` | 复杂状态逻辑      |
| 回调     | `atomWithCallback(init, cb)`     | 状态变化通知      |

## 相关章节

- [SKILL.md](SKILL.md) - 基础场景选择
- [jotai-core.md](jotai-core.md) - 核心概念
- [jotai-common.md](jotai-common.md) - 常用模式
- [jotai-immer.md](jotai-immer.md) - Immer 不可变更新
- pressure-scenarios.ts - 压力场景测试
