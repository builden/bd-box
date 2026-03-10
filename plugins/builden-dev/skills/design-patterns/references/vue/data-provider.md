# Data Provider Pattern (Vue)

## 一句话定义

抽离数据逻辑，只提供数据不控制渲染。

## 函数式实现

```typescript
// DataProvider.vue
<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  fetchFn: { type: Function, required: true }
});

const data = ref(null);
const loading = ref(true);

props.fetchFn().then(result => {
  data.value = result;
  loading.value = false;
});
</script>

<template>
  <slot :data="data" :loading="loading" />
</template>

<!-- 使用 -->
<DataProvider :fetchFn="fetchUsers">
  <template #default="{ data, loading }">
    <div v-if="loading">Loading...</div>
    <div v-else>{{ data }}</div>
  </template>
</DataProvider>
```

## 参考

- [patterns.dev - Data Provider](https://www.patterns.dev/vue/data-provider)
