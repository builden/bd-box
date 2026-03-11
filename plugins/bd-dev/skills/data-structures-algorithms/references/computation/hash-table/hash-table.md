# 哈希表

## 一句话定义

通过哈希函数将键映射到数组索引的键值对数据结构。

## 为什么好

**优点：**

- 查找 O(1)
- 插入 O(1)
- 灵活键值

**缺点：**

- 哈希冲突
- 内存占用大
- 无序遍历

## 适用场景

- 快速查找
- 去重
- 关联数组
- 缓存

## 代码实现

```typescript
class HashMap<K, V> {
  private buckets: Array<[K, V][]> = [];
  private size: number = 0;
  private loadFactor: number = 0.75;

  constructor(capacity: number = 16) {
    this.buckets = new Array(capacity);
  }

  private hash(key: K): number {
    let hash = 0;
    const str = String(key);
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % this.buckets.length;
  }

  set(key: K, value: V): void {
    if (this.size >= this.buckets.length * this.loadFactor) {
      this.resize();
    }

    const index = this.hash(key);
    const bucket = this.buckets[index] || [];

    for (const [k, v] of bucket) {
      if (k === key) {
        v = value;
        return;
      }
    }

    bucket.push([key, value]);
    this.buckets[index] = bucket;
    this.size++;
  }

  get(key: K): V | undefined {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    if (!bucket) return undefined;

    for (const [k, v] of bucket) {
      if (k === key) return v;
    }
    return undefined;
  }

  delete(key: K): boolean {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    if (!bucket) return false;

    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        bucket.splice(i, 1);
        this.size--;
        return true;
      }
    }
    return false;
  }

  private resize(): void {
    const newBuckets = new Array(this.buckets.length * 2);
    for (const bucket of this.buckets) {
      if (bucket) {
        for (const [k, v] of bucket) {
          const index = Math.abs(this.hash(k)) % newBuckets.length;
          if (!newBuckets[index]) newBuckets[index] = [];
          newBuckets[index].push([k, v]);
        }
      }
    }
    this.buckets = newBuckets;
  }
}
```

## 时间复杂度

| 操作 | 平均 | 最坏 |
| ---- | ---- | ---- |
| 查找 | O(1) | O(n) |
| 插入 | O(1) | O(n) |
| 删除 | O(1) | O(n) |

## 经典应用

- **Redis**：Hash 类型
- **Java HashMap**：语言内置
- **Deno/KV**：键值存储
- **加密货币**：区块链

## 使用边界

**何时不用：**

- 需要有序遍历：哈希表是无序的
- 键数量少且固定：直接用对象可能更简单
- 内存敏感场景：哈希表有额外内存开销

**注意事项：**

- 哈希函数设计影响分布均匀性
- 负载因子超过 0.75 需要扩容
- 极端情况下退化为链表（DOS 攻击）

**面试常考点：**

- 哈希冲突解决方法（链地址法、开放地址法）
- 哈希函数设计原则
- 扩容策略和再哈希

**为什么选择**：哈希表是现代计算最核心的数据结构之一，几乎无处不在。
