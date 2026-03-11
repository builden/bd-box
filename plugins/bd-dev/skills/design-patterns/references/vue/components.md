# Components 模式 (Vue)

## 一句话定义

Vue 组件的核心组织模式。

## 函数式实现

```typescript
// Single File Component
<script setup lang="ts">
import { ref } from 'vue';
const count = ref(0);
</script>

<template>
  <button @click="count++">Count: {{ count }}</button>
</template>
```

## 参考

- [patterns.dev - Vue Components](https://www.patterns.dev/vue/components)
