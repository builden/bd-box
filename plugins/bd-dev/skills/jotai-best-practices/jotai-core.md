# Jotai 核心必读

本文档包含 Jotai 最常用的核心模式，是使用 jotai 时的必读内容。

## 基础 Atom 创建

```typescript
import { atom } from 'jotai';

// ✅ 正确：始终提供初始值
export const countAtom = atom(0);
export const inputTextAtom = atom('');
export const isLoadingAtom = atom(false);
export const itemsAtom = atom<Item[]>([]);
```

## 派生 Atom（只读）

```typescript
import { atom } from 'jotai';

// ✅ 正确：使用 getter 函数派生
export const doubleCountAtom = atom((get) => get(countAtom) * 2);

// ✅ 正确：多原子派生
export const totalPriceAtom = atom((get) => {
  const items = get(cartItemsAtom);
  const discount = get(discountAtom);
  return items.reduce((sum, item) => sum + item.price, 0) * (1 - discount);
});

// ❌ 错误：派生 atom 中使用副作用
export const badAtom = atom((get) => {
  const count = get(countAtom);
  saveToServer(count); // 禁止！
  return count;
});
```

## Read-Write Atom

```typescript
import { atom } from 'jotai';

// ✅ 正确：简单读写
export const countAtom = atom(
  (get) => get(baseCountAtom) + get(adjustmentAtom),
  (get, set, delta: number) => {
    set(baseCountAtom, (prev) => prev + delta);
  }
);

// ✅ 正确：异步 atom with loading/error 状态
export const userDataAtom = atom(
  (get) => get(userIdAtom),
  async (get, set, userId: string) => {
    set(userLoadingAtom, true);
    set(userErrorAtom, null);
    try {
      const data = await fetchUser(userId);
      set(userDataAtom, data);
    } catch (error) {
      set(userErrorAtom, error.message);
    } finally {
      set(userLoadingAtom, false);
    }
  }
);

// ❌ 错误：在 write 中使用 get 获取异步值
export const badAsyncAtom = atom(null, async (get, set, id: string) => {
  const user = get(userDataAtom); // 可能不是最新值！
  await updateUser(id, user);
});
```

## loadable（加载状态）

```typescript
import { atom } from 'jotai';
import { loadable } from 'jotai/utils';

// ✅ 正确：使用 loadable 处理异步数据状态
const userAtom = atom(async (get) => {
  const userId = get(selectedUserIdAtom);
  return fetchUser(userId);
});

const loadableUserAtom = loadable(userAtom);

function UserProfile() {
  const [user] = useAtom(loadableUserAtom);

  if (user.state === 'loading') return <Spinner />;
  if (user.state === 'hasError') return <Error message={user.error} />;
  return <div>{user.data.name}</div>;
}

// ✅ 正确：loadable 用于派生 atom
const usersLoadableAtom = loadable(
  atom((get) => {
    const filter = get(filterAtom);
    return fetchUsers(filter);
  })
);

// ❌ 错误：直接访问 async atom 的值
function BadComponent() {
  const [user] = useAtom(userAtom); // ❌ 可能不是数据
  return <div>{user.name}</div>; // 运行时错误！
}
```

## atomWithStorage 持久化

```typescript
import { atomWithStorage } from 'jotai/utils';

// ✅ 正确：使用 atomWithStorage
export const themeAtom = atomWithStorage('app-theme', 'dark');
export const preferencesAtom = atomWithStorage('user-prefs', defaultPrefs);

// ✅ 正确：处理 hydration
function useTheme() {
  const [theme, setTheme] = useAtom(themeAtom);
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    if (isMounted) {
      document.body.className = theme;
    }
  }, [theme, isMounted]);

  return [theme, setTheme] as const;
}
```

### 异步存储（AsyncStorage）

```typescript
import { atomWithStorage } from 'jotai/utils';

// ✅ 正确：React Native / SSR 使用异步存储
const createAsyncStorage = () => {
  // 实现存储接口
  const asyncStorage = {
    getItem: async (key: string): Promise<string | null> => {
      // 从 AsyncStorage / IndexedDB / 网络读取
      const value = await AsyncStorage.getItem(key);
      return value;
    },
    setItem: async (key: string, value: string): Promise<void> => {
      await AsyncStorage.setItem(key, value);
    },
    removeItem: async (key: string): Promise<void> => {
      await AsyncStorage.removeItem(key);
    },
  };
  return asyncStorage;
};

// ✅ 正确：使用异步存储
export const asyncThemeAtom = atomWithStorage('app-theme', 'dark', createAsyncStorage());

// ✅ 正确：自定义存储 + 加密
const encryptedStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const encrypted = await SecureStore.getItemAsync(key);
    if (!encrypted) return null;
    return decrypt(encrypted);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    const encrypted = encrypt(value);
    await SecureStore.setItemAsync(key, encrypted);
  },
  removeItem: async (key: string): Promise<void> => {
    await SecureStore.deleteItemAsync(key);
  },
};

export const sensitiveDataAtom = atomWithStorage('sensitive', defaultData, encryptedStorage);

// ✅ 正确：IndexedDB 存储大量数据
const idbStorage = {
  async getItem(key: string): Promise<string | null> {
    const db = await openDB();
    const value = await db.get('store', key);
    return value ?? null;
  },
  async setItem(key: string, value: string): Promise<void> {
    const db = await openDB();
    await db.put('store', value, key);
  },
  async removeItem(key: string): Promise<void> {
    const db = await openDB();
    await db.delete('store', key);
  },
};

export const largeDataAtom = atomWithStorage('large-data', [], idbStorage);

// ❌ 错误：在同步组件中立即读取异步存储的值
function BadComponent() {
  const [data] = useAtom(asyncDataAtom);
  // ❌ 初始值可能是 default，异步读取还没完成
  useEffect(() => {
    console.log(data); // 初始可能是默认值
  }, [data]);
}

// ✅ 正确：使用 useAtomValue + useEffect 等待加载
function GoodComponent() {
  const data = useAtomValue(asyncDataAtom);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // atomWithStorage 会自动处理异步读取
    // 当数据加载完成后组件会重新渲染
    setIsLoaded(true);
  }, []);

  if (!isLoaded) return <Loading />;
  return <div>{/* render data */}</div>;
}
```

### 存储迁移

```typescript
// ✅ 正确：处理存储版本迁移
const createMigratedStorage = () => {
  const storage = createAsyncStorage();
  const currentVersion = 2;

  return {
    ...storage,
    getItem: async (key: string): Promise<string | null> => {
      const value = await storage.getItem(key);
      if (!value) return null;

      const versionKey = `${key}-version`;
      const version = await storage.getItem(versionKey);

      if (Number(version) < currentVersion) {
        const migrated = migrate(JSON.parse(value), currentVersion);
        await storage.setItem(key, JSON.stringify(migrated));
        await storage.setItem(versionKey, String(currentVersion));
        return JSON.stringify(migrated);
      }

      return value;
    },
  };
};

export const migratedDataAtom = atomWithStorage('data-v2', defaultData, createMigratedStorage());
```

### 数据验证（Zod）

```typescript
import { atomWithStorage } from 'jotai/utils';
import { z } from 'zod';

// ✅ 正确：使用 Zod schema 验证存储的数据
const userSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().min(0),
  email: z.string().email().optional(),
});

const themeSchema = z.enum(['light', 'dark', 'system']);

// ✅ 正确：带验证的 atomWithStorage
export const userDataAtom = atomWithStorage(
  'user-data',
  { name: '', age: 0 },
  {
    getItem(key, initialValue) {
      const storedValue = localStorage.getItem(key);
      try {
        const parsed = JSON.parse(storedValue ?? 'null');
        return parsed ? userSchema.parse(parsed) : initialValue;
      } catch {
        return initialValue;
      }
    },
    setItem(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    },
    removeItem(key) {
      localStorage.removeItem(key);
    },
    subscribe(key, callback, initialValue) {
      if (typeof window === 'undefined' || !window.addEventListener) return;
      const handler = (e: StorageEvent) => {
        if (e.storageArea === localStorage && e.key === key) {
          try {
            const newValue = userSchema.parse(JSON.parse(e.newValue ?? 'null'));
            callback(newValue);
          } catch {
            callback(initialValue);
          }
        }
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    },
  }
);

// ✅ 正确：简单值验证
const numberSchema = z.number().int().min(0);

export const storedNumberAtom = atomWithStorage('my-number', 0, {
  getItem(key, initialValue) {
    const storedValue = localStorage.getItem(key);
    try {
      const parsed = JSON.parse(storedValue ?? 'null');
      return parsed ? numberSchema.parse(parsed) : initialValue;
    } catch {
      return initialValue;
    }
  },
  setItem(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  removeItem(key) {
    localStorage.removeItem(key);
  },
  subscribe(key, callback, initialValue) {
    if (typeof window === 'undefined' || !window.addEventListener) return;
    const handler = (e: StorageEvent) => {
      if (e.storageArea === localStorage && e.key === key) {
        try {
          const newValue = numberSchema.parse(JSON.parse(e.newValue ?? 'null'));
          callback(newValue);
        } catch {
          callback(initialValue);
        }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  },
});

// ✅ 正确：复杂嵌套对象验证
const notificationSettingsSchema = z.object({
  email: z.boolean(),
  sms: z.boolean(),
  push: z.boolean(),
});

const settingsSchema = z.object({
  theme: themeSchema,
  notifications: notificationSettingsSchema,
  preferences: z.record(z.string(), z.unknown()).optional(),
});

// ✅ 正确：封装为可复用函数
function createValidatedStorage<T>(key: string, schema: z.ZodSchema<T>, initialValue: T) {
  return atomWithStorage(key, initialValue, {
    getItem(_, defaultValue) {
      if (typeof window === 'undefined') return defaultValue;
      try {
        const stored = localStorage.getItem(key);
        return stored ? schema.parse(JSON.parse(stored)) : defaultValue;
      } catch {
        return defaultValue;
      }
    },
    setItem(_, value) {
      localStorage.setItem(key, JSON.stringify(value));
    },
    removeItem(_) {
      localStorage.removeItem(key);
    },
    subscribe(key, callback, initialVal) {
      if (typeof window === 'undefined' || !window.addEventListener) return;
      const handler = (e: StorageEvent) => {
        if (e.storageArea === localStorage && e.key === key) {
          try {
            const newVal = schema.parse(JSON.parse(e.newValue ?? 'null'));
            callback(newVal);
          } catch {
            callback(initialVal);
          }
        }
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    },
  });
}

// 使用封装函数
export const validatedSettingsAtom = createValidatedStorage('app-settings', settingsSchema, defaultSettings);
```

## atomFamily 模式

```typescript
import { atom } from 'jotai';
import { atomFamily } from 'jotai-family';
import { atomWithStorage } from 'jotai/utils';

// ✅ 正确：使用 atomWithStorage 作为 family 基础
export const todoAtomFamily = atomFamily((id: string) =>
  atomWithStorage(`todo-${id}`, { id, text: '', completed: false })
);

// ✅ 正确：需要清理时使用 onMount
export const dynamicAtomFamily = atomFamily((key: string) => {
  const anAtom = atom(initialData);
  anAtom.onMount = () => {
    const unsubscribe = subscribe(key, (val) => {
      anAtom.write(val);
    });
    return () => unsubscribe();
  };
  return anAtom;
});

// ✅ 正确：手动回收策略 - 完全可控
export const controlledAtomFamily = atomFamily((id: string) =>
  atom({ id, name: '' })
);

// 方法 1：手动移除单个 atom
controlledAtomFamily.remove(id); // 移除指定 id 的 atom

// 方法 2：手动移除所有 atom（清空 family）
controlledAtomFamily.removeAll(); // 重置整个 family

// 方法 3：条件移除
controlledAtomFamily.setShouldRemove((createdAt, param) => {
  // 返回 true 时，返回 false 时保留移除
  const shouldRemove = someCondition(param);
  return shouldRemove;
});

// ✅ 正确：组件中使用后手动清理
function TodoItem({ id }: { id: string }) {
  const [todo, setTodo] = useAtom(controlledAtomFamily(id));

  useEffect(() => {
    return () => {
      // 组件卸载时清理对应的 atom
      controlledAtomFamily.remove(id);
    };
  }, [id]);

  return <div>{todo.name}</div>;
}

// ✅ 正确：列表场景批量清理
function TodoList({ ids }: { ids: string[] }) {
  // 离开列表页时清理所有
  useEffect(() => {
    return () => {
      ids.forEach((id) => controlledAtomFamily.remove(id));
    };
  }, [ids]);
}
```

## 快速参考表

| 场景       | 模式                                   | 关键点                         |
| ---------- | -------------------------------------- | ------------------------------ |
| 简单状态   | `atom(initialValue)`                   | 提供初始值                     |
| 派生状态   | `atom((get) => get(otherAtom))`        | 只读，使用 getter              |
| 持久化     | `atomWithStorage(key, default)`        | 处理 hydration                 |
| 动态 atoms | `atomFamily((id) => atom(...))`        | 注意内存泄漏                   |
| 异步操作   | `atom(async (get, set, arg) => {...})` | 处理 loading/error             |
| 加载状态   | `loadable(asyncAtom)`                  | state: loading/hasError/loaded |

## Red Flags - 停止并修复

- Atom 没有初始值
- 派生 atom 中使用 `await` 或副作用
- 直接修改 atom 的值或参数
- atomFamily 永不清理
- 派生 atom 返回新对象引用

## 相关章节

- [jotai-common.md](jotai-common.md) - 常用模式（Store API、工厂模式、Utility Atoms）
- [jotai-immer.md](jotai-immer.md) - Immer 不可变更新（atomWithImmer、自定义 "with" 模式）
- [jotai-advanced.md](jotai-advanced.md) - 高级特性（selectAtom、splitAtom、focusAtom、atomWithReducer 等）
- [jotai-extensions.md](jotai-extensions.md) - 生态库扩展（tanstack-query、history、scope 等）
