# Async Components (Vue)

## 一句话定义

异步加载组件，按需加载。

## 函数式实现

```typescript
// 异步组件
const AsyncComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
);

// 带 loading
const AsyncWithLoading = defineAsyncComponent({
  loader: () => import('./HeavyComponent.vue'),
  loadingComponent: LoadingSpinner,
  delay: 200
});

// 使用
<template>
  <AsyncComponent v-if="show" />
</template>
```

## 参考

- [patterns.dev - Async Components](https://www.patterns.dev/vue/async-components)
