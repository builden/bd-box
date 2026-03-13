# Jotai 与 Immer 结合

本文档包含 Jotai 与 Immer 结合使用的完整指南，包括基本用法、高级模式和自定义 "with" 模式设计。

## 基本用法

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

export const addItemAtom = atom(null, (get, set, item: Item) => {
  set(
    itemsAtom,
    produce((draft) => {
      draft.push(item);
    })
  );
});
```

## atomWithImmer（简化更新语法）

```typescript
import { atomWithImmer } from 'jotai/immer';
import { useAtom } from 'jotai/react';

// ✅ 正确：使用 atomWithImmer 创建支持 Immer 更新的 atom
const formDataAtom = atomWithImmer({
  user: { name: '', email: '' },
  settings: { theme: 'light' },
});

// ✅ 正确：在组件中直接修改（类似 Vue/Observable）
function FormComponent() {
  const [formData, updateForm] = useAtom(formDataAtom);

  const handleNameChange = (name: string) => {
    updateForm((draft) => {
      draft.user.name = name;
    });
  };

  return (
    <input value={formData.user.name} onChange={(e) => handleNameChange(e.target.value)} />
  );
}
```

## useImmerAtom（更简洁的更新方式）

```typescript
import { useImmerAtom } from 'jotai/immer';

// ✅ 正确：useImmerAtom 返回 [state, draftUpdater]
const [formData, setFormData] = useImmerAtom(formDataAtom);

// ✅ 正确：使用 setFormData 的更新器直接修改
function updateEmail(email: string) {
  setFormData((draft) => {
    draft.user.email = email;
  });
}
```

## 对比：produce vs atomWithImmer

```typescript
// ❌ 错误：每次更新都要包装 produce
const [formData, setFormData] = useAtom(formDataAtom);
function updateName(name: string) {
  setFormData(
    produce((draft) => {
      draft.user.name = name;
    })
  );
}

// ✅ 正确：atomWithImmer 直接传入更新函数
const [formData, setFormData] = useImmerAtom(formDataAtom);
function updateName(name: string) {
  setFormData((draft) => {
    draft.user.name = name;
  });
}
```

## 何时使用

| 场景               | 选择               | 说明         |
| ------------------ | ------------------ | ------------ |
| 简单嵌套对象更新   | `atomWithImmer`    | 更简洁的 API |
| 复杂深度嵌套更新   | `produce` + `atom` | 更灵活的控制 |
| 追求最小依赖       | `produce`          | 只依赖 immer |
| 组件内快速原型开发 | `useImmerAtom`     | 开发效率优先 |

## 与其他模式配合

### atomWithImmer 与 atomWithStorage 配合

```typescript
import { atomWithStorage } from 'jotai/utils';
import { atomWithImmer } from 'jotai/immer';

// ✅ 正确：atomWithImmer 不能直接与 atomWithStorage 配合
// 需要通过派生 atom 或自定义实现
const createPersistedImmerAtom = <T extends object>(
  key: string,
  initialValue: T
) => {
  const baseAtom = atomWithStorage(key, initialValue);
  return baseAtom;
};

// ✅ 正确：手动实现持久化 Immer atom
export const formDataAtom = atomWithImmer({
  user: { name: '', email: '' },
  settings: { theme: 'light' },
});

// 持久化更新函数
export const persistFormDataAtom = atom(
  null,
  (get, set, update: (draft: FormData) => void) => {
    const current = get(formDataAtom);
    set(formDataAtom, current);
    localStorage.setItem('form-data', JSON.stringify(get(formDataAtom)));
  }
);

// ✅ 正确：在组件中组合使用
function PersistedForm() {
  const [formData, updateForm] = useAtom(formDataAtom);
  const [, persist] = useAtom(persistFormDataAtom);

  const handleNameChange = (name: string) => {
    updateForm((draft) => {
      draft.user.name = name;
    });
    persist();
  };

  return <input value={formData.user.name} onChange={(e) => handleNameChange(e.target.value)} />;
}
```

### atomWithImmer 与 atomWithQuery 配合

```typescript
import { atomWithQuery } from 'jotai-tanstack-query';
import { atomWithImmer } from 'jotai/immer';
import { atom, useAtom } from 'jotai';

// ✅ 正确：查询结果存储到 Immer atom
export const cachedUsersAtom = atomWithImmer<{ list: User[]; lastUpdated: number }>({
  list: [],
  lastUpdated: 0,
});

// ✅ 正确：atomWithQuery 派生更新 Immer atom
export const usersQueryAtom = atomWithQuery((get) => ({
  queryKey: ['users'],
  queryFn: fetchUsers,
}));

export const updateCachedUsersAtom = atom(
  (get) => get(usersQueryAtom),
  async (get, set) => {
    const users = await get(usersQueryAtom);
    set(cachedUsersAtom, (draft) => {
      draft.list = users;
      draft.lastUpdated = Date.now();
    });
  }
);

// ✅ 正确：组件中使用
function UserList() {
  const [usersState] = useAtom(cachedUsersAtom);
  const [queryResult] = useAtom(usersQueryAtom);

  return (
    <div>
      <p>缓存用户数: {usersState.list.length}</p>
      <p>最后更新: {new Date(usersState.lastUpdated).toLocaleString()}</p>
      {queryResult.isFetching && <Spinner />}
      <ul>
        {usersState.list.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## 实现原理

```typescript
import { Draft } from 'immer';
import { atom } from 'jotai';
import { useAtom } from 'jotai/react';

// ✅ 理解：atomWithImmer 本质是一个包装器
// 1. 内部存储原始值
// 2. write 函数接收更新函数，用 produce 处理
// 3. 将结果转换为不可变对象

export function atomWithImmer<Value extends object>(initialValue: Value) {
  const baseAtom = atom(initialValue);

  const wrappedAtom = atom(
    (get) => get(baseAtom),
    (get, set, fn: (draft: Draft<Value>) => void) => {
      const current = get(baseAtom);
      const next = produce(current, fn);
      set(baseAtom, next);
    }
  );

  return wrappedAtom;
}

export function useImmerAtom<Value extends object>(anAtom: WritableAtom<Value, [(draft: Draft<Value>) => void]>) {
  const [value, updateValue] = useAtom(anAtom);

  const setValue = (fn: (draft: Draft<Value>) => void) => {
    updateValue(fn);
  };

  return [value, setValue] as const;
}
```

## 自定义 "with" 模式

参考 atomWithImmer 的设计模式，可以创建自定义的 atom 包装器。

### atomWithValidator（带验证的 atom）

```typescript
import { Draft } from 'immer';
import { atom } from 'jotai';

export function atomWithValidator<Value>(initialValue: Value, validator: (value: Value) => boolean) {
  const baseAtom = atom(initialValue);

  const wrappedAtom = atom(
    (get) => get(baseAtom),
    (get, set, update: Value | ((draft: Draft<Value>) => void)) => {
      const current = get(baseAtom);
      let next: Value;

      if (typeof update === 'function') {
        next = produce(current, update as any);
      } else {
        next = update;
      }

      if (validator(next)) {
        set(baseAtom, next);
      } else {
        console.warn('Validation failed');
      }
    }
  );

  return wrappedAtom;
}

// 使用
const formAtom = atomWithValidator({ name: '', email: '' }, (form) => form.name.length > 0 && form.email.includes('@'));

function Form() {
  const [form, updateForm] = useAtom(formAtom);

  updateForm((draft) => {
    draft.name = 'John';
  });
}
```

### atomWithUndoRedo（带撤销重做的 atom）

```typescript
export function atomWithUndoRedo<Value>(initialValue: Value, maxHistory: number = 50) {
  const baseAtom = atom(initialValue);
  const historyAtom = atom<Value[]>([initialValue]);
  const indexAtom = atom(0);

  const wrappedAtom = atom(
    (get) => {
      const history = get(historyAtom);
      const index = get(indexAtom);
      return history[index];
    },
    (get, set, update: Value | ((draft: Draft<Value>) => void) | 'UNDO' | 'REDO') => {
      if (update === 'UNDO') {
        const index = get(indexAtom);
        if (index > 0) set(indexAtom, index - 1);
        return;
      }
      if (update === 'REDO') {
        const history = get(historyAtom);
        const index = get(indexAtom);
        if (index < history.length - 1) set(indexAtom, index + 1);
        return;
      }

      const current = get(baseAtom);
      let next: Value;

      if (typeof update === 'function') {
        next = produce(current, update as any);
      } else {
        next = update;
      }

      const history = get(historyAtom);
      const index = get(indexAtom);

      const newHistory = history.slice(0, index + 1);
      newHistory.push(next);

      if (newHistory.length > maxHistory) {
        newHistory.shift();
      }

      set(historyAtom, newHistory);
      set(indexAtom, newHistory.length - 1);
    }
  );

  return wrappedAtom;
}
```

### atomWithAnalytics（带埋点的 atom）

```typescript
export function atomWithAnalytics<Value>(initialValue: Value, analyticsKey: string) {
  const baseAtom = atom(initialValue);

  const wrappedAtom = atom(
    (get) => get(baseAtom),
    (get, set, update: Value | ((draft: Draft<Value>) => void)) => {
      const current = get(baseAtom);
      let next: Value;

      if (typeof update === 'function') {
        next = produce(current, update as any);
      } else {
        next = update;
      }

      if (current !== next) {
        console.log(`[Analytics] ${analyticsKey}:`, {
          from: current,
          to: next,
          timestamp: Date.now(),
        });
      }

      set(baseAtom, next);
    }
  );

  return wrappedAtom;
}
```

## "with" 模式的设计原则

```typescript
// 1. 基础模式：atomWithX
//    - 接收初始值和配置
//    - 返回包装后的 atom
//    - 内部使用 baseAtom 存储数据

// 2. 包装模式：useXAtom
//    - 接收 atom
//    - 返回 [value, setter]
//    - setter 可以增强（添加逻辑）

// 3. 核心技巧
const createWithX = (baseAtomCreator) => {
  return (initialValue, ...args) => {
    const baseAtom = baseAtomCreator(initialValue);
    // 包装逻辑
    return wrappedAtom;
  };
};

// 4. 常见增强点
//    - 验证（validator）
//    - 持久化（storage）
//    - 追踪（tracking）
//    - 日志（logging）
//    - 转换（transform）
```

## 相关章节

- [jotai-core.md](jotai-core.md) - 核心概念（基础 atom、loadable、atomWithStorage）
- [jotai-common.md](jotai-common.md) - 常用模式（Store API、工厂模式、Utility Atoms）
- [jotai-advanced.md](jotai-advanced.md) - 高级特性（selectAtom、splitAtom、focusAtom、atomWithReducer 等）
