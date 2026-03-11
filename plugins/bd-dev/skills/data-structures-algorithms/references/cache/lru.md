# LRU 缓存

## 一句话定义

最近最少使用（Least Recently Used）淘汰策略，保留热点数据。

## 为什么好

**优点：**

- 保留热点数据，命中率较高
- 实现相对简单
- 适合访问模式有时间局部性

**缺点：**

- 需要维护访问顺序，有额外开销
- 无法区分访问频率

## 适用场景

- **缓存淘汰**：内存缓存大小有限
- **页面置换**：操作系统页面置换
- **CDN 缓存**：内容分发网络

## 代码实现

```typescript
class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V> = new Map();

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;

    // 移动到末尾（最近使用）
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key: K, value: V): void {
    // 已存在，删除后重新插入
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // 淘汰最旧的（第一个）
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  size(): number {
    return this.cache.size;
  }
}
```

## 时间/空间复杂度

| 操作 | 时间复杂度 | 空间复杂度  |
| ---- | ---------- | ----------- |
| get  | O(1)       | -           |
| put  | O(1)       | O(capacity) |

## 使用边界/注意事项

1. **容量设置**：太小频繁淘汰，太大内存浪费
2. **热点数据**：适合访问有时间局部性的场景
3. **突发流量**：突发大量新数据会冲掉热点

## 经典应用案例

- **Redis**：内存淘汰策略之一
- **MySQL Buffer Pool**：InnoDB 缓冲池
- **浏览器缓存**：HTTP 缓存
- **Guava Cache**：Java 本地缓存
- **iOS 视图层级**：UIView 缓存

**为什么选择**：LRU 是最常用的缓存淘汰策略，在访问有时间局部性的场景下效果良好。
