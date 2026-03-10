# Script Setup (Vue)

## 一句话定义

Vue 3 Composition API 的简洁语法。

## 函数式实现

```typescript
<script setup lang="ts">
// 自动暴露到模板
const msg = 'Hello';
const count = ref(0);

function inc() {
  count.value++;
}

// 编译器宏
defineProps({
  title: String
});

defineEmits(['update']);
</script>

<template>
  <button @click="inc">{{ msg }} - {{ count }}</button>
</template>
```

## 参考

- [patterns.dev - Script Setup](https://www.patterns.dev/vue/script-setup)
