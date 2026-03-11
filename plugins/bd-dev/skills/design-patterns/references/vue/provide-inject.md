# Provide/Inject 模式 (Vue)

## 一句话定义

父组件提供数据，子组件注入使用。

## 为什么好

- **避免 props 穿透**
- **跨层级通信**
- **响应式数据**

## 函数式实现

```typescript
// 父组件
import { provide, ref } from "vue";

const count = ref(0);
provide("count", count);

// 子组件
import { inject } from "vue";

const count = inject("count");
```

## 参考

- [patterns.dev - Provide/Inject](https://www.patterns.dev/vue/provide-inject)
