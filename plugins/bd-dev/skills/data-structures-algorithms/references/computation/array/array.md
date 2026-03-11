# 数组

## 一句话定义

连续内存存储的线性数据结构，支持 O(1) 随机访问。

## 为什么好

**优点：**

- 随机访问 O(1)
- 缓存友好（局部性原理）
- 实现简单

**缺点：**

- 插入删除 O(n)
- 固定大小（静态数组）

## 适用场景

- 需要频繁随机访问
- 数据量固定
- 遍历操作多

## 代码实现

```typescript
// 动态数组
class DynamicArray<T> {
  private data: T[];
  private length: number;
  private capacity: number;

  constructor(capacity: number = 4) {
    this.capacity = capacity;
    this.data = new Array(capacity);
    this.length = 0;
  }

  get(index: number): T | undefined {
    if (index < 0 || index >= this.length) return undefined;
    return this.data[index];
  }

  push(item: T): void {
    if (this.length === this.capacity) {
      this.resize(this.capacity * 2);
    }
    this.data[this.length++] = item;
  }

  pop(): T | undefined {
    if (this.length === 0) return undefined;
    return this.data[--this.length];
  }

  private resize(newCapacity: number): void {
    const newData = new Array(newCapacity);
    for (let i = 0; i < this.length; i++) {
      newData[i] = this.data[i];
    }
    this.data = newData;
    this.capacity = newCapacity;
  }
}
```

## 时间复杂度

| 操作 | 时间复杂度 |
| ---- | ---------- |
| 访问 | O(1)       |
| 搜索 | O(n)       |
| 插入 | O(n)       |
| 删除 | O(n)       |

## 经典应用

- **V8 引擎**：JavaScript 数组底层
- **Redis**：紧凑列表
- **算法竞赛**：基础数据结构

## 使用边界

**何时不用：**

- 频繁在中间插入/删除：应使用链表
- 数据量无法预知且变化大：动态数组有扩容开销
- 需要存储稀疏数据：考虑哈希表或映射

**注意事项：**

- 动态数组扩容时需要复制整个数组，有 O(n) 代价
- 预分配合理容量可避免频繁扩容
- 数组下标越界是常见 bug

**面试常考点：**

- 动态数组扩容机制和复杂度分析
- 数组和链表的对比
- 缓存命中率和局部性原理

**为什么选择**：数组是最基础的数据结构，大多数语言的数组实现都是动态数组。
