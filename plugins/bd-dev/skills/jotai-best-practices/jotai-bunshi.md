# Bunshi - Jotai 原子作用域与依赖注入

Bunshi 是 Jotai 的补充库，提供**作用域隔离**和**依赖注入**能力。

## 核心概念

| 概念             | 说明                                   |
| ---------------- | -------------------------------------- |
| `molecule`       | 原子工厂函数，封装一组相关的 atom      |
| `useMolecule`    | React Hook，在组件中获取 molecule 实例 |
| `ComponentScope` | 组件级作用域，每个组件实例有独立状态   |
| `mol()`          | 在 molecule 内部声明依赖其他 molecule  |

## 基础用法

### 安装

```bash
bun add bunshi jotai
```

### 定义 Molecule

```typescript
// molecules/document.ts
import { molecule } from 'bunshi';
import { atom } from 'jotai/vanilla';

export const DocumentMolecule = molecule((mol) => {
  return {
    titleAtom: atom(''),
    contentAtom: atom(''),
    cursorAtom: atom({ line: 0, col: 0 }),
  };
});
```

### 组件中使用

```tsx
import { useMolecule } from 'bunshi/react';

function DocumentEditor({ docId }: { docId: string }) {
  const doc = useMolecule(DocumentMolecule, [docId]);
  const [title] = useAtom(doc.titleAtom);

  return <input value={title} />;
}
```

## Molecule 树状拆分

复杂模块的 atom 不会爆炸，按功能域拆分：

```typescript
// molecules/document/meta.ts
export const DocumentMetaMolecule = molecule(() => ({
  titleAtom: atom(''),
  createdAtAtom: atom(new Date()),
}));

// molecules/document/content.ts
export const DocumentContentMolecule = molecule(() => ({
  rawAtom: atom(''),
  parsedAtom: atom<AST | null>(null),
}));

// molecules/document/cursor.ts
export const DocumentCursorMolecule = molecule(() => ({
  positionAtom: atom({ line: 0, col: 0 }),
  anchorAtom: atom({ line: 0, col: 0 }),
}));

// molecules/document/index.ts
import { molecule } from 'bunshi';

export const DocumentMolecule = molecule((mol) => {
  return {
    meta: mol(DocumentMetaMolecule),
    content: mol(DocumentContentMolecule),
    cursor: mol(DocumentCursorMolecule),
  };
});
```

```tsx
function DocumentEditor({ docId }: { docId: string }) {
  const doc = useMolecule(DocumentMolecule, [docId]);

  const [title] = useAtom(doc.meta.titleAtom);
  const [content] = useAtom(doc.content.rawAtom);
  const [position] = useAtom(doc.cursor.positionAtom);
  // ...
}
```

## 依赖全局 Atom

```typescript
import { globalSettingsAtom } from '../global';

export const DocumentSettingsMolecule = molecule((mol) => ({
  // 依赖全局 atom
  settingsAtom: atom((get) => ({
    ...get(globalSettingsAtom),
    wordWrap: true,
  })),
}));
```

## ComponentScope（组件级隔离）

```typescript
export const CounterMolecule = molecule((mol, scope) => {
  scope(ComponentScope); // 声明为组件级

  const countAtom = atom(0);
  const doubledAtom = atom((get) => get(countAtom) * 2);

  return { countAtom, doubledAtom };
});
```

```tsx
// 每个 Counter 实例有独立的 countAtom
function Counter() {
  const { countAtom, doubledAtom } = useMolecule(CounterMolecule);
  const [count] = useAtom(countAtom);
  return (
    <div>
      {count} (doubled: {doubledAtom})
    </div>
  );
}

function Dashboard() {
  return (
    <>
      <Counter /> {/* 实例 A */}
      <Counter /> {/* 实例 B */}
    </>
  );
}
```

## 与 Family、jotai-scope 对比

| 场景            | Jotai Family  |  jotai-scope  | Bunshi  |
| --------------- | :-----------: | :-----------: | :-----: |
| 全局单例 atom   |      ✅       |      ❌       |   ✅    |
| 组件级隔离      |      ❌       |      ✅       |   ✅    |
| Provider 作用域 |      ❌       |      ✅       |   ❌    |
| 参数化动态创建  |      ✅       |      ❌       |   ❌    |
| 依赖注入        |      ❌       |      ❌       |   ✅    |
| 生命周期管理    | 需手动 remove | Provider 控制 | 自动 GC |

## 典型场景

### 文档编辑器（多文档隔离）

```typescript
// 每个文档有独立的状态组，关闭时自动清理
export const DocumentMolecule = molecule((mol) => {
  scope(ComponentScope);

  return {
    titleAtom: atom(''),
    contentAtom: atom(''),
    selectionAtom: atom(null),
    historyAtom: atom([]),
  };
});

function DocumentTab({ docId }: { docId: string }) {
  const doc = useMolecule(DocumentMolecule, [docId]);
  // docId 变化时自动切换到新实例
  // 组件卸载时 molecule 自动清理
}
```

### 面板实例隔离

```typescript
export const PanelMolecule = molecule((mol, scope) => {
  scope(ComponentScope);
  return {
    isExpandedAtom: atom(false),
    activeItemAtom: atom<string | null>(null),
  };
});

function SidebarPanel() {
  const panel = useMolecule(PanelMolecule, [panelId]);
  // 每个面板实例状态独立
}
```

## 何时用

| 推荐场景             | 原因                      |
| -------------------- | ------------------------- |
| 复杂模块多 atom 封装 | 生命周期统一管理          |
| 需要依赖注入         | atom 间依赖声明式         |
| 文档/面板等多实例    | 自动隔离，无需手动 remove |
| 跨框架状态逻辑       | molecules.ts 可纯 TS      |

## 何时不用

| 避免场景              | 原因                 |
| --------------------- | -------------------- |
| 简单全局状态          | 直接用 `atom()` 即可 |
| 参数化 atom（如缓存） | 用 `atomFamily`      |
| Provider 嵌套隔离     | 用 `jotai-scope`     |
| 轻量级场景            | 避免引入额外依赖     |

## 组合方案

Bunshi + atomFamily + jotai-scope 各有所长：

```
需要的场景              推荐方案
──────────────────────────────────────
有明确生命周期的模块    Bunshi molecule
动态参数化（如用户列表） atomFamily
Provider 作用域隔离     jotai-scope
复杂依赖关系           Bunshi + molecule 树
```

## 相关章节

- [SKILL.md](SKILL.md) - 场景选择指南
- [jotai-core.md](jotai-core.md) - atomFamily 模式
- [jotai-extensions.md](jotai-extensions.md) - jotai-scope 详解
