# 迭代器模式 (Iterator)

## 一句话定义

提供一种方法顺序访问集合中的元素，而不暴露其底层表示。

## 为什么好

- **统一接口**：不同集合统一遍历方式
- **解耦**：遍历逻辑与集合解耦
- **可扩展**：可以添加新的遍历方式

## 函数式实现

```typescript
const createIterator = <T>(items: T[]) => {
  let index = 0;
  return {
    next: () => {
      if (index < items.length) {
        return { value: items[index++], done: false };
      }
      return { value: undefined, done: true };
    },
    hasNext: () => index < items.length,
    reset: () => {
      index = 0;
    },
  };
};

// 使用
const iter = createIterator([1, 2, 3]);
while (iter.hasNext()) {
  console.log(iter.next().value);
}

// 生成器版本
function* generator<T>(items: T[]): Generator<T> {
  for (const item of items) {
    yield item;
  }
}

for (const item of generator([1, 2, 3])) {
  console.log(item);
}
```

## 适用场景

- 统一遍历接口
- 复杂数据结构遍历
- 惰性计算

## 参考

- 《设计模式》- 迭代器模式
