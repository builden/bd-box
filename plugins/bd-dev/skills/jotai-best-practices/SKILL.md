---
name: jotai-best-practices
description: Use when writing, reviewing, or debugging Jotai atoms, including atom creation, derived atoms, atomWithStorage, atom families, and store patterns.
---

# Jotai 最佳实践

## 场景选择指南

先回答以下问题，找到适合你的模式：

### Q1: 你需要持久化存储吗？

| 场景                         | 选择                       | 章节            |
| ---------------------------- | -------------------------- | --------------- |
| 主题切换、用户偏好设置       | `atomWithToggleAndStorage` | jotai-common.md |
| 简单的开/关状态              | `atomWithToggle`           | jotai-common.md |
| 复杂数据（数组、对象）       | `atomWithStorage`          | jotai-core.md   |
| 需要与 localStorage 手动同步 | Store + localStorage 模式  | jotai-common.md |
| 自定义存储（AsyncStorage）   | 自定义 storage 接口        | jotai-core.md   |
| 存储数据验证                 | Zod schema 验证            | jotai-core.md   |

### Q2: 你需要防抖/节流吗？

| 场景         | 选择               | 章节                |
| ------------ | ------------------ | ------------------- |
| 搜索输入防抖 | `atomWithDebounce` | jotai-extensions.md |
| API 请求节流 | 自定义 atom        | jotai-common.md     |

### Q3: 你需要派生/计算状态吗？

| 场景                   | 选择              | 章节              |
| ---------------------- | ----------------- | ----------------- |
| 从其他 atom 派生单个值 | 派生 atom         | jotai-core.md     |
| 从大对象中提取部分     | `selectAtom`      | jotai-advanced.md |
| 派生复杂过滤/计算      | `atomWithDefault` | jotai-advanced.md |

### Q4: 你需要异步数据吗？

| 场景              | 选择                  | 章节                |
| ----------------- | --------------------- | ------------------- |
| 简单异步          | `loadable(asyncAtom)` | jotai-core.md       |
| 需要缓存          | `atomWithCache`       | jotai-advanced.md   |
| 复杂查询/缓存管理 | jotai-tanstack-query  | jotai-extensions.md |
| 一次性的 API 调用 | Read-Write async atom | jotai-core.md       |

### Q5: 你需要操作嵌套对象/数组吗？

| 场景             | 选择                    | 章节               |
| ---------------- | ----------------------- | ------------------ |
| 更新深层路径     | `focusAtom` + optics-ts | jotai-advanced.md  |
| 复杂的不可变更新 | `immer.produce`         | **jotai-immer.md** |
| 拆分大数组       | `splitAtom`             | jotai-advanced.md  |

### Q6: 你需要撤销/重做或副作用吗？

| 场景              | 选择              | 章节                |
| ----------------- | ----------------- | ------------------- |
| 简单文本/值的历史 | `atomWithHistory` | jotai-extensions.md |
| 监听状态变化      | `atomEffect`      | jotai-extensions.md |

### Q7: 相同的逻辑有多个实例吗？

| 场景                         | 选择                       | 章节              |
| ---------------------------- | -------------------------- | ----------------- |
| 多个独立计数器               | 工厂模式                   | jotai-common.md   |
| 动态数量的表单字段           | `atomFamily`               | jotai-core.md     |
| 列表中每个元素独立更新       | `splitAtom`                | jotai-advanced.md |
| 多组相同配置（主题、设置等） | 工厂模式 + atomWithStorage | jotai-common.md   |

### Q8: 你需要隔离/限制状态的作用域吗？

| 场景                | 选择           | 章节                |
| ------------------- | -------------- | ------------------- |
| 多实例组件状态隔离  | `jotai-scope`  | jotai-extensions.md |
| 模态框/弹窗状态隔离 | `useAtomScope` | jotai-extensions.md |
| 组件库封装          | `createScope`  | jotai-extensions.md |
| 测试环境隔离        | 独立 scope     | jotai-extensions.md |

### Q9: 你需要 Redux 风格或回调模式吗？

| 场景               | 选择               | 章节              |
| ------------------ | ------------------ | ----------------- |
| Redux 风格状态管理 | `atomWithReducer`  | jotai-advanced.md |
| 状态变化时触发回调 | `atomWithCallback` | jotai-advanced.md |
| 表单提交/事件处理  | `atomWithCallback` | jotai-advanced.md |

### Q10: 你需要测试 atoms 或组件吗？

| 场景                      | 选择               | 章节             |
| ------------------------- | ------------------ | ---------------- |
| React 组件行为测试        | TestProvider + RTL | jotai-testing.md |
| Node 环境纯 atom 单元测试 | `createStore`      | jotai-testing.md |
| 注入初始值测试边界情况    | `useHydrateAtoms`  | jotai-testing.md |
| 派生 atom 依赖追踪验证    | `createStore`      | jotai-testing.md |
| atomFamily 隔离测试       | `createStore`      | jotai-testing.md |

---

## 文档结构

### 优先级 1：核心必读

[jotai-core.md](jotai-core.md) - 基础 atoms、loadable、atomWithStorage、atomFamily

- 基础 atom 创建
- 派生 atom（只读）
- Read-Write atom
- loadable 加载状态
- atomWithStorage 持久化（基础用法、自定义存储、Zod 验证）
- atomFamily 模式

### 优先级 2：常用模式

[jotai-common.md](jotai-common.md) - Store API、工厂模式、Utility Atoms

- Store + localStorage 同步模式
- Store 最佳实践（getDefaultStore、createStore）
- 常见错误与修复
- 工厂模式
- Utility Atoms（atomWithToggle、atomWithToggleAndStorage）
- `@builden/bd-utils` 自定义扩展（atomWithDebounce）

### 优先级 2.5：Immer 不可变更新

[jotai-immer.md](jotai-immer.md) - atomWithImmer、useImmerAtom、自定义 "with" 模式

- atomWithImmer 和 useImmerAtom 的详细用法
- 与 atomWithStorage、atomWithQuery 的集成模式
- 自定义 "with" 模式设计（atomWithValidator、atomWithUndoRedo、atomWithAnalytics）

### 优先级 3：高级特性

[jotai-advanced.md](jotai-advanced.md) - selectAtom、splitAtom、focusAtom、高级 utility atoms

- selectAtom 选择器（部分状态派生、引用比较）
- splitAtom 数组拆分
- focusAtom + optics-ts（嵌套路径更新）
- atomWithReset 值重置
- atomWithDefault 默认值派生
- atomWithCache 异步缓存
- atomWithReducer Redux 风格
- atomWithCallback 回调模式

### 优先级 4：生态库扩展

[jotai-extensions.md](jotai-extensions.md) - tanstack-query、history、scope、effect、optics、自定义扩展

- jotai-tanstack-query（React Query 集成）
- jotai-history（撤销/重做）
- jotai-scope（作用域控制）
- jotai-effect（副作用处理）
- jotai-optics（透镜操作）
- @builden/bd-utils 自定义扩展（atomWithDebounce）

### 优先级 5：测试专题

[jotai-testing.md](jotai-testing.md) - React 组件测试、Node 环境 atom 测试

- L1: React 组件行为测试（React Testing Library + TestProvider + useHydrateAtoms）
- L2: Pure atom 单元测试（createStore API）
- 常见问题（atomFamily、派生依赖、atomWithStorage）

## 快速参考

| 需求            | 推荐方案                                                    |
| --------------- | ----------------------------------------------------------- |
| 基础状态        | `atom(initialValue)`                                        |
| 主题/偏好持久化 | `atomWithToggleAndStorage(key, default)`                    |
| 弹窗/临时开关   | `atomWithToggle(initial)`                                   |
| 搜索防抖        | `atomWithDebounce(initial, delay)` (来自 @builden/bd-utils) |
| 派生计算        | `atom((get) => ...)`                                        |
| 异步加载        | `loadable(asyncAtom)`                                       |
| 复杂嵌套更新    | `focusAtom` + `optic`                                       |
| 撤销/重做       | `atomWithHistory`                                           |
| API 缓存        | `atomWithCache` 或 `jotai-tanstack-query`                   |
| Redux 风格      | `atomWithReducer`                                           |
| 状态变化回调    | `atomWithCallback`                                          |

## 调试技巧

```typescript
import { getDefaultStore } from 'jotai';

const store = getDefaultStore();

// 1. 读取当前所有 atom 值
console.log('All atoms:', store.devtools_unsubscribe_devtools?.());

// 2. 订阅 atom 变化
store.sub(countAtom, () => {
  console.log('Count changed:', store.get(countAtom));
});

// 3. 使用 getDefaultStore 在组件外调试
function debugAtom() {
  console.log('Current value:', store.get(countAtom));
}
```

## Jotai 的局限性

```typescript
import { atomFamily } from 'jotai-family';

// ❌ 局限性 1：atomFamily 内存泄漏风险
const userAtomFamily = atomFamily((id: string) => atom<User>(null));
// 无限数量的参数会导致内存增长
// 必须使用 setShouldRemove 或手动 remove

// ✅ 正确：设置自动清理策略
userAtomFamily.setShouldRemove((createdAt, param) => {
  return Date.now() - createdAt > 60 * 60 * 1000; // 1小时后清理
});

// ⚠️ 注意事项：清除后状态会丢失，组件会回到初始值
// 用户正在编辑的表单可能被清空，需要合理设置策略

// ❌ 局限性 2：异步 atom 强制 Suspense 行为
const asyncAtom = atom(async () => fetchData());
// 组件必须被 Suspense 包裹，否则会抛出异常
// 无法直接访问 loading/error 状态

// ✅ 正确：使用 loadable 避免 Suspense
const loadableAtom = loadable(asyncAtom);
// 返回 { state: 'loading'|'hasData'|'hasError', data?, error? }

// ❌ 局限性 3：复杂状态机支持弱
// 需要自行实现状态机的逻辑
// 没有内置的 actions、guards、transitions

// ❌ 局限性 4：DevTools 功能有限
// Redux DevTools 集成 vs Redux 原生体验
// 生产环境调试不如 Redux 方便

// ❌ 局限性 5：派生 atom 的依赖追踪
// 过于复杂的派生可能导致意外的重新计算
// 需要注意选择器的性能
```

## 测试

[jotai-testing.md](jotai-testing.md) - 系统性测试指南

- L1: React 组件测试（React Testing Library）
- L2: Node 环境 atom 测试（createStore）
- 常见问题与解答

[pressure-scenarios.ts](pressure-scenarios.ts) - 23 个压力场景测试

运行此测试记录常见错误模式：

```typescript
// 场景 1-12: 核心问题
// 场景 13-18: 扩展库问题
// 场景 19-23: 工具函数问题
```
