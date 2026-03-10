# Composables 模式 (Vue)

## 一句话定义

使用 Vue Composition API 抽离和复用有状态的逻辑。

## 为什么好

- **逻辑复用**：类似 React Hooks
- **代码组织**：按逻辑组织代码
- **类型支持**：更好的 TypeScript 支持

## 函数式实现

```typescript
// useMouse.ts
import { ref, onMounted, onUnmounted } from 'vue';

export function useMouse() {
  const x = ref(0);
  const y = ref(0);

  const update = (e: MouseEvent) => {
    x.value = e.pageX;
    y.value = e.pageY;
  };

  onMounted(() => window.addEventListener('mousemove', update));
  onUnmounted(() => window.removeEventListener('mousemove', update));

  return { x, y };
}

// 使用
<script setup>
const { x, y } = useMouse();
</script>

<template>Mouse: {{ x }}, {{ y }}</template>
```

## 参考

- [patterns.dev - Vue Composables](https://www.patterns.dev/vue/composables)
