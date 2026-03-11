# Dynamic Components (Vue)

## 一句话定义

动态切换组件渲染。

## 函数式实现

```typescript
<template>
  <component :is="currentComponent" />
</template>

<script setup>
import { ref } from 'vue';
import ComponentA from './ComponentA.vue';
import ComponentB from './ComponentB.vue';

const currentComponent = ref(ComponentA);
</script>
```

## 参考

- [patterns.dev - Dynamic Components](https://www.patterns.dev/vue/dynamic-components)
