/**
 * Jotai 最佳实践 - 压力场景测试
 *
 * 这些场景用于测试在没有 skill 指导时，Agent 容易犯的 jotai 错误。
 * 运行此测试后，记录基线行为，然后创建 skill 来解决这些问题。
 */

// ============================================================================
// 场景 1: atom 循环依赖
// ============================================================================
// 问题场景：两个派生 atom 互相依赖，导致无限循环

const _circularDependencyProblem = `
// ❌ 错误示例：循环依赖
const countAtom = atom(0);
const doubleCountAtom = atom((get) => get(countAtom) * 2);
const tripleCountAtom = atom((get) => get(doubleCountAtom) + get(countAtom));
// 看似没问题，但如果添加反向依赖就会出问题
const countPlusDoubleAtom = atom((get) => {
  const count = get(countAtom);
  const double = get(doubleCountAtom);
  return count + double;
});

// ❌ 真正的问题：隐式循环
const derived1Atom = atom((get) => {
  const d2 = get(derived2Atom);
  return d2 * 2;
});
const derived2Atom = atom((get) => {
  const d1 = get(derived1Atom); // 循环！
  return d1 + 1;
});
`;

// ============================================================================
// 场景 2: useEffect 依赖项不完整
// ============================================================================
// 问题场景：atom 变化触发 useEffect，但依赖项列表示不全

const _useEffectDependencyProblem = `
import { useAtom } from 'jotai';
import { useEffect } from 'react';

function Component() {
  const [count, setCount] = useAtom(countAtom);

  useEffect(() => {
    // ❌ 错误：count 在依赖中但 setCount 不在
    // 可能导致状态不一致
    console.log('Count changed:', count);
  }, [count]); // 应该包含所有使用的 atom

  // ❌ 另一个常见错误：过度依赖
  useEffect(() => {
    // 每次渲染都会执行，因为没有依赖
    saveToStorage(count);
  }); // 缺少依赖数组

  return <button onClick={() => setCount(c => c + 1)}>+</button>;
}
`;

// ============================================================================
// 场景 3: atomWithStorage 初始化时机问题
// ============================================================================
// 问题场景：在组件渲染完成前读取 atomWithStorage 值

const _atomWithStorageTimingProblem = `
import { atomWithStorage } from 'jotai/utils';

// ❌ 问题：可能在 hydration 期间读取到不一致的值
const themeAtom = atomWithStorage('theme', 'dark');

function ThemeButton() {
  const [theme, setTheme] = useAtom(themeAtom);

  // ❌ 问题：服务端渲染时 localStorage 不可用
  // 可能导致 hydration mismatch
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    }
  }, [theme]);

  return <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
    Current: {theme}
  </button>;
}
`;

// ============================================================================
// 场景 4: store 外部直接修改 atom
// ============================================================================
// 问题场景：绕过 atom 直接修改状态

const _storeMutationProblem = `
import { getDefaultStore } from 'jotai';

const store = getDefaultStore();

// ❌ 错误：不应该直接修改 atom 的值
const countAtom = atom(0);

// ❌ 这些都是错误做法
store.set(countAtom, 5); // 正确：使用 set
// 错误做法：
// countAtom.write = 10; // ❌
// store.atoms.get(countAtom).value = 10; // ❌

// ❌ 在 atom 的 write 函数中修改其他 atom
const asyncAtom = atom(
  (get) => get(countAtom),
  async (get, set, update) => {
    // ❌ 错误：在 async atom 中使用 get 可能导致问题
    const current = get(countAtom);
    await fetch('/api/count');
    set(countAtom, current + 1);
  }
);
`;

// ============================================================================
// 场景 5: atom family 内存泄漏
// ============================================================================
// 问题场景：创建大量 atom 但没有清理机制

const atomFamilyLeakProblem = `
import { atomFamily } from 'jotai/utils';

// ❌ 问题：无限制创建 atom
const todoAtomFamily = atomFamily((id: string) => atom({ id, text: '' }));

// 在组件中
function TodoItem({ id }: { id: string }) {
  const [todo, setTodo] = useAtom(todoAtomFamily(id));
  // ❌ 当 id 变化时，旧 atom 不会被清理
  return <div>{todo.text}</div>;
}

// ❌ 问题：atomFamily 默认永不清理
// 大量不同的 id 会导致内存泄漏
`;

// ============================================================================
// 场景 6: 派生 atom 性能问题
// ============================================================================
// 问题场景：派生 atom 没有 memoization，导致不必要的重新计算

const derivedPerformanceProblem = `
const expensiveDerivedAtom = atom((get) => {
  const items = get(itemsAtom);

  // ❌ 问题：每次访问都会重新计算
  // 即使 items 没有变化
  return items.filter(item => item.active)
    .map(item => item.name)
    .sort()
    .join(',');
});

// ❌ 问题：在组件中直接使用派生 atom
function Component() {
  const [items] = useAtom(itemsAtom);
  const derived = useAtomValue(expensiveDerivedAtom);

  // ❌ 每次 itemsAtom 变化都会重新计算
  // 即使 filtered 结果相同
  return <div>{derived}</div>;
}
`;

// ============================================================================
// 场景 7: Provider 嵌套问题
// ============================================================================
// 问题场景：多个 Provider 导致状态隔离，行为不符合预期

const providerNestingProblem = `
import { Provider } from 'jotai';

// ❌ 问题：嵌套 Provider 隔离状态
function App() {
  return (
    <Provider>
      <ParentComponent />
      <Provider> {/* ❌ 新 Provider 隔离所有子组件状态 */}
        <ChildComponent />
      </Provider>
    </Provider>
  );
}

// ❌ 问题：在不同 Provider 中使用相同的 atom key
// 导致意外的状态隔离
function Parent() {
  return (
    <Provider>
      <Counter />
    </Provider>
  );
}

function Child() {
  return (
    <Provider>
      <Counter /> {/* ❌ 这是另一个独立的 Counter */}
    </Provider>
  );
}
`;

// ============================================================================
// 场景 8: atom 中使用不稳定的引用
// ============================================================================
// 问题场景：atom 返回的对象引用每次都不同

const unstableReferenceProblem = `
const configAtom = atom((get) => {
  const user = get(userAtom);
  const settings = get(settingsAtom);

  // ❌ 问题：每次都返回新对象
  return {
    userName: user.name,
    theme: settings.theme,
    // ❌ 新对象！
  };
});

function Component() {
  const [config] = useAtom(configAtom);

  useEffect(() => {
    // ❌ 每次渲染都会触发，因为 config 是新对象
    console.log('Config changed:', config);
  }, [config]); // 永远不会是同一个引用
}
`;

// ============================================================================
// 场景 9: 异步 atom 错误处理不完整
// ============================================================================
// 问题场景：异步 atom 没有正确的错误处理

const asyncErrorHandlingProblem = `
const userDataAtom = atom(async (get) => {
  const userId = get(selectedUserIdAtom);

  // ❌ 问题：没有错误处理
  const response = await fetch(\`/api/users/\${userId}\`);
  return response.json();
});

function UserProfile() {
  const [userData] = useAtom(userDataAtom);

  if (userData.state === 'loading') return 'Loading...';
  if (userData.state === 'hasError') return 'Error!'; // ❌ 不完整
  return <div>{userData.data.name}</div>;
}
`;

// ============================================================================
// 场景 10: 混合使用 jotai 和其他状态管理
// ============================================================================
// 问题场景：在复杂应用中混合使用多个状态管理方案

const mixedStateManagementProblem = `
import { atom } from 'jotai';
import { useState } use 'react';

// ❌ 问题：同时使用 useState 和 jotai atom
// 导致状态来源不明确
function ComplexComponent() {
  const [localState, setLocalState] = useState(0);
  const [globalState, setGlobalState] = useAtom(complexAtom);

  // ❌ 哪个优先？如何同步？
  const handleClick = () => {
    setLocalState(l => l + 1);
    setGlobalState(g => g + 1);
    // 状态不一致！
  };

  return <button onClick={handleClick}>{localState + globalState}</button>;
}
`;

// ============================================================================
// 场景 11: atom 中直接修改传入的参数
// ============================================================================
// 问题场景：在 write 函数中修改参数对象

const mutationInAtomProblem = `
const updateItemAtom = atom(
  null,
  (get, set, item: Item) => {
    const items = get(itemsAtom);

    // ❌ 问题：直接修改传入的参数
    item.updatedAt = new Date();

    // ❌ 问题：修改 items 数组
    const index = items.findIndex(i => i.id === item.id);
    items[index] = item; // ❌ 直接修改，不是不可变更新

    set(itemsAtom, items);
  }
);
`;

// ============================================================================
// 场景 12: 使用 getDefaultStore 的时机问题
// ============================================================================
// 问题场景：在模块加载时初始化 store

const storeInitTimingProblem = `
import { getDefaultStore, atom } from 'jotai';

// ❌ 问题：模块加载时就获取 store
const store = getDefaultStore(); // 可能太早！

const countAtom = atom(0);

// ❌ 问题：在 React 组件外使用 store
function initCount() {
  store.set(countAtom, 10); // 可能时机不对
}

// ❌ 更好的做法：使用 Provider 或延迟初始化
let storeInstance: Store | null = null;

export function getStore() {
  if (!storeInstance) {
    storeInstance = createStore();
  }
  return storeInstance;
}
`;

// ============================================================================
// 场景 13: 与 Immer 结合的问题
// ============================================================================
// 问题场景：误用 immer 导致状态更新不生效或产生副作用

const immerProblem = `
import { atom } from 'jotai';
import { produce } from 'immer';

// ❌ 问题：忘记使用 produce
const updateUserAtom = atom(null, (get, set, updates: UserUpdates) => {
  const user = get(userAtom);
  set(userAtom, { ...user, ...updates }); // ❌ 没有用 immer
});

// ❌ 问题：在 atom getter 中使用 produce
const derivedUserAtom = atom((get) => {
  const user = get(userAtom);
  return produce(user, (draft) => {
    draft.fullName = draft.firstName + ' ' + draft.lastName;
  });
});

// ❌ 问题：produce 回调中直接修改外部状态
const badAtom = atom(null, (get, set, item: Item) => {
  const items = get(itemsAtom);
  produce(items, (draft) => {
    draft.push(item);
    externalArray.push(item); // ❌ 副作用！
  });
});
`;

// ============================================================================
// 场景 14: jotai-tanstack-query 集成问题
// ============================================================================
// 问题场景：误用 atomWithQuery 导致缓存失效或请求重复

const tanstackQueryProblem = `
import { atomWithQuery } from 'jotai-tanstack-query';

// ❌ 问题：queryFn 中使用 get
const badAtom = atomWithQuery((get) => {
  const config = get(configAtom); // ❌ queryFn 不能用 get
  return { queryKey: ['data'], queryFn: () => fetchWith(config) };
});

// ❌ 问题：queryKey 不包含依赖
const staleAtom = atomWithQuery((get) => {
  const userId = get(selectedUserIdAtom);
  return {
    queryKey: ['user'], // ❌ 缺少 userId
    queryFn: () => fetchUser(userId),
  };
});

// ❌ 问题：没有处理 enabled
const disabledAtom = atomWithQuery((get) => {
  const userId = get(selectedUserIdAtom);
  return {
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    // ❌ 没有 enabled，可能请求 undefined
  };
});

// ❌ 问题：mutation 后不刷新查询
const createUserAtom = atom(
  null,
  async (get, set, userData: UserData) => {
    await createUser(userData);
    // ❌ 没有刷新 users 查询
  }
);
`;

// ============================================================================
// 场景 15: jotai-history 使用问题
// ============================================================================
// 问题场景：撤销重做历史记录管理不当

const historyProblem = `
import { atomWithHistory } from 'jotai-history';

// ❌ 问题：没有限制历史记录数量
const unlimitedAtom = atomWithHistory(initialValue); // 无限增长！

// ❌ 问题：在不适当的时候初始化
const manualAtom = atomWithHistory(initialValue, {
  skipInitialize: false, // ❌ 应该在需要时初始化
});

// ❌ 问题：混合使用普通 atom 和历史 atom
const mixedAtom = atomWithHistory('');
function Editor() {
  const [text, setText] = useAtom(plainTextAtom); // ❌ 混用
  const [history] = useAtom(historyAtom);
}

// ❌ 问题：深色模式下历史记录不兼容
const themeSensitiveAtom = atomWithHistory(
  produce((draft) => {
    draft.theme = localStorage.getItem('theme'); // ❌ 序列化问题
  })
);
`;

// ============================================================================
// 场景 16: jotai-scope 作用域问题
// ============================================================================
// 问题场景：作用域控制不当导致状态泄露或隔离

const scopeProblem = `
import { useAtomScope } from 'jotai-scope';

// ❌ 问题：使用 useAtomScope 读取不存在的 atom
function BadComponent() {
  const value = useAtomScope(nonExistentAtom); // ❌ 错误处理
}

// ❌ 问题：depth 参数使用不当
function DeepComponent() {
  const local = useAtomScope(countAtom, { depth: 100 }); // ❌ 超出层级
}

// ❌ 问题：scope atom 没有正确限定范围
const scopedAtom = atom(0);
function Parent() {
  return (
    <Provider>
      <Child /> {/* ❌ Child 也能访问 scopedAtom */}
    </Provider>
  );
}

// ❌ 问题：在多个 Provider 中共享同一 atom
function App() {
  return (
    <Provider>
      <Component1 />
      <Provider>
        <Component2 /> {/* ❌ 不同作用域 */}
      </Provider>
    </Provider>
  );
}
`;

// ============================================================================
// 场景 17: jotai-effect 副作用问题
// ============================================================================
// 问题场景：副作用未正确清理或重复执行

const effectProblem = `
import { atomEffect } from 'jotai-effect';

// ❌ 问题：副作用未清理
const leakAtom = atomEffect((get) => {
  const count = get(countAtom);
  const unsubscribe = subscribeToCount(count);
  // ❌ 没有返回清理函数
});

// ❌ 问题：副作用中触发自身更新导致循环
const circularAtom = atomEffect((get) => {
  const value = get(circularAtom); // ❌ 循环依赖
  document.body.classList.add(value);
});

// ❌ 问题：在 effect 中执行异步操作没有错误处理
const asyncEffectAtom = atomEffect(async (get) => {
  const userId = get(userIdAtom);
  const data = await fetchUser(userId);
  // ❌ 没有错误处理
});

// ❌ 问题：过度使用 atomEffect
function HeavyComponent() {
  const [data] = useAtom(dataAtom);
  useAtom(atomEffect((get) => {
    // ❌ 每个 atom 都有 effect
    logData(get(dataAtom));
  }));
  useAtom(atomEffect((get) => {
    logData(get(dataAtom));
  }));
}
`;

// ============================================================================
// 场景 18: jotai-optics 透镜问题
// ============================================================================
// 问题场景：透镜路径错误或类型安全问题

const opticsProblem = `
import { optics } from 'jotai-optics';

// ❌ 问题：透镜路径错误
const badAtom = optics(stateAtom)
  .prop('user') // ❌ 应该是 'data'
  .prop('profile')
  .atom();

// ❌ 问题：更新时没有使用正确的值
const wrongUpdateAtom = atom(
  null,
  (get, set, newName: string) => {
    set(
      nameAtom,
      optics(stateAtom).prop('user').prop('name'),
      newName // ❌ 应该是 { name: newName }
    );
  }
);

// ❌ 问题：数组索引越界
const outOfBoundsAtom = optics(todosAtom)
  .index(100) // ❌ 数组只有 10 个元素
  .prop('title')
  .atom();

// ❌ 问题：透镜与 immer 混用不当
const mixedAtom = atom(null, (get, set) => {
  set(
    stateAtom,
    optics(stateAtom)
      .prop('user')
      .atom(), // ❌ 不能这样用
    updateValue
  );
});
`;

// ============================================================================
// 场景 19: loadable 使用问题
// ============================================================================
// 问题场景：误用 loadable 或直接访问 async atom

const loadableProblem = `
import { loadable } from 'jotai/utils';

// ❌ 问题：直接访问 async atom 的值
function BadComponent() {
  const [user] = useAtom(userAtom); // ❌ async atom 返回 Promise
  return <div>{user.name}</div>; // 运行时错误！
}

// ❌ 问题：loadable 返回的对象没有正确解构
function WrongUsage() {
  const user = useAtom(loadableUserAtom); // ❌ 需要解构 state
  console.log(user.name); // user 是 Loadable 对象
}

// ❌ 问题：在 loadable 回调中执行副作用
const badLoadable = loadable(asyncAtom);
const effectAtom = atom((get) => {
  const data = get(badLoadable);
  saveToServer(data); // ❌ 副作用！
});
`;

// ============================================================================
// 场景 20: atomWithReset/atomWithDefault 问题
// ============================================================================
// 问题场景：误用重置和默认值 atoms

const resetDefaultProblem = `
import { atomWithReset, atomWithDefault } from 'jotai/utils';

// ❌ 问题：atomWithReset 和 atomWithDefault 混用
const mixedAtom = atomWithReset('');
mixedAtom = atomWithDefault(() => 'default'); // ❌ 类型冲突

// ❌ 问题：在 atomWithDefault 中使用 set
const badDefaultAtom = atomWithDefault((get, set) => {
  const user = get(userAtom);
  set(otherAtom, user.preferences); // ❌ atomWithDefault 只读
  return user.preferences.theme;
});

// ❌ 问题：atomWithReset 初始值不完整
const incompleteResetAtom = atomWithReset({
  required: '',
  // ❌ 缺少某些字段
});

// ❌ 问题：atomWithDefault 依赖不稳定的值
const unstableDefaultAtom = atomWithDefault((get) => {
  const timestamp = Date.now(); // ❌ 每次都是新值
  return timestamp;
});
`;

// ============================================================================
// 场景 21: selectAtom 问题
// ============================================================================
// 问题场景：选择器返回新对象或执行副作用

const selectAtomProblem = `
import { selectAtom } from 'jotai/utils';

// ❌ 问题：选择器返回新对象
const objectSelectorAtom = selectAtom(stateAtom, (state) => ({
  name: state.user.name,
  theme: state.settings.theme, // ❌ 每次新对象
}));

// ❌ 问题：选择器中执行副作用
const sideEffectAtom = selectAtom(stateAtom, (state) => {
  logToAnalytics(state.user.name); // ❌ 副作用
  return state.user.name;
});

// ❌ 问题：没有使用引用比较
const expensiveAtom = selectAtom(
  dataAtom,
  (data) => computedValue, // ❌ 没有 compare 函数
);

// ❌ 问题：选择器过于复杂
const complexSelector = selectAtom(stateAtom, (state) => {
  return state.users
    .filter(u => u.active)
    .map(u => u.name)
    .sort()
    .join(',');
});
`;

// ============================================================================
// 场景 22: splitAtom 问题
// ============================================================================
// 问题场景：误用数组拆分

const splitAtomProblem = `
import { splitAtom } from 'jotai/utils';

// ❌ 问题：keySelector 返回重复的值
const badKeySelector = splitAtom(todosAtom, (todo) => {
  return todo.status; // ❌ 多个 todo 相同 status
});

// ❌ 问题：在组件外遍历拆分结果
function BadComponent() {
  const [atoms] = useAtom(splitResultAtom);
  atoms.forEach((atom) => {
    useAtom(atom); // ❌ 错误用法
  });
}

// ❌ 问题：没有 key 属性
function MissingKey() {
  const [todos] = useAtom(todosAtom);
  return (
    <ul>
      {todos.map((todo, index) => (
        <TodoItem key={index}> {/* ❌ 应该用 id */}
          {todo.text}
        </TodoItem>
      ))}
    </ul>
  );
}
`;

// ============================================================================
// 场景 23: atomWithCache 问题
// ============================================================================
// 问题场景：误用缓存 atoms

const cacheProblem = `
import { atomWithCache } from 'jotai-cache';

// ❌ 问题：在 atomWithCache 中使用 set
const badCacheAtom = atomWithCache(async (get, set) => {
  const data = await fetchData();
  set(otherAtom, data); // ❌ atomWithCache 只读
});

// ❌ 问题：缓存依赖不稳定的值
const unstableCacheAtom = atomWithCache(async (get) => {
  const random = Math.random(); // ❌ 无法缓存
  return fetchData(random);
});

// ❌ 问题：没有处理 null/undefined
const unsafeCacheAtom = atomWithCache(async (get) => {
  const id = get(itemIdAtom);
  if (!id) return null;
  return fetchItem(id); // ❌ 应该处理 cache null
});

// ❌ 问题：缓存键不稳定
const badCacheKeyAtom = atomWithCache(async (get) => {
  const now = Date.now(); // ❌ 每次不同
  return fetchData(now);
});
`;

// ============================================================================
// 测试结果记录模板
// ============================================================================
/**
 * 运行此测试后，记录以下信息：
 *
 * 1. 哪些错误场景被正确识别？
 * 2. 哪些场景被遗漏了？
 * 3. 常见的 rationalizations（合理化借口）是什么？
 * 4. 需要在 skill 中明确禁止的做法有哪些？
 */
