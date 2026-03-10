# Renderless Components (Vue)

## 一句话定义

只包含逻辑，不控制渲染的组件。

## 函数式实现

```typescript
// MouseTracker.vue
<script setup>
import { ref } from 'vue';

const x = ref(0);
const y = ref(0);

const handleMove = (e) => {
  x.value = e.pageX;
  y.value = e.pageY;
};
</script>

<template>
  <slot :x="x" :y="y" />
</template>

<!-- 使用 -->
<MouseTracker v-slot="{ x, y }">
  Mouse at {{ x }}, {{ y }}
</MouseTracker>
```

## 参考

- [patterns.dev - Renderless Components](https://www.patterns.dev/vue/renderless-components)
