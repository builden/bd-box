# State Management (Vue)

## 一句话定义

Vue 应用的状态管理方案。

## Pinia 示例

```typescript
// stores/user.ts
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    name: 'Alice',
    age: 25
  }),
  getters: {
    isAdult: (state) => state.age >= 18
  },
  actions: {
    incrementAge() {
      this.age++;
    }
  }
});

// 使用
<script setup>
import { useUserStore } from './stores/user';
const user = useUserStore();
</script>

<template>
  <h1>{{ user.name }} - {{ user.age }}</h1>
</template>
```

## 参考

- [patterns.dev - State Management](https://www.patterns.dev/vue/state-management)
