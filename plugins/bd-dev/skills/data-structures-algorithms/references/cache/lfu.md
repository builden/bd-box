# LFU 缓存

## 一句话定义

最不经常使用（Least Frequently Used）淘汰策略，保留高频访问数据。

## 为什么好

**优点：**

- 保留高频数据，命中率更高
- 适合访问频率差异大的场景

**缺点：**

- 实现复杂，需要维护频率
- 需要处理突发访问

## 适用场景

- **访问频率差异大**：热点数据明显
- **推荐系统**：需要保留高频偏好

## 代码实现

```typescript
class LFUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V> = new Map();
  private freqMap: Map<number, Set<K>> = new Map();
  private keyFreq: Map<K, number> = new Map();
  private minFreq = 1;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;

    const freq = this.keyFreq.get(key)!;
    const keys = this.freqMap.get(freq)!;
    keys.delete(key);

    if (keys.size === 0) {
      this.freqMap.delete(freq);
      if (freq === this.minFreq) this.minFreq++;
    }

    const newFreq = freq + 1;
    this.keyFreq.set(key, newFreq);

    if (!this.freqMap.has(newFreq)) {
      this.freqMap.set(newFreq, new Set());
    }
    this.freqMap.get(newFreq)!.add(key);

    return this.cache.get(key);
  }

  put(key: K, value: V): void {
    if (this.capacity === 0) return;

    if (this.cache.has(key)) {
      this.cache.set(key, value);
      this.get(key);
      return;
    }

    if (this.cache.size >= this.capacity) {
      const keys = this.freqMap.get(this.minFreq)!;
      const evictedKey = keys.values().next().value;
      this.cache.delete(evictedKey);
      this.keyFreq.delete(evictedKey);
      keys.delete(evictedKey);
      if (keys.size === 0) this.freqMap.delete(this.minFreq);
    }

    this.cache.set(key, value);
    this.keyFreq.set(key, 1);
    this.minFreq = 1;
    if (!this.freqMap.has(1)) this.freqMap.set(1, new Set());
    this.freqMap.get(1)!.add(key);
  }
}
```

## 时间/空间复杂度

| 操作 | 时间复杂度 | 空间复杂度  |
| ---- | ---------- | ----------- |
| get  | O(1)       | -           |
| put  | O(1)       | O(capacity) |

## 经典应用案例

- **Redis**：LFU 淘汰策略
- **Guava Cache**：Java 本地缓存
- **CDN 缓存**：高频内容分发

## 使用边界

**何时不用：**

- 访问模式经常变化：突发流量可能被误淘汰
- 无法区分访问频率：需要历史累积数据
- 实现简单为王：LRU 更简单

**注意事项：**

- 需要计数器衰减机制避免"历史权重"
- 频率相同时的淘汰策略
- 实现复杂度高于 LRU

**面试常考点：**

- LRU vs LFU 区别和适用场景
- LFU 实现细节（双哈希表或堆）
- LFU 的计数器衰减

**为什么选择**：在访问频率差异明显的场景，LFU 比 LRU 效果更好。
