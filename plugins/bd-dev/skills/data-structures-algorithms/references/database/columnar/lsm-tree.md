# LSM 树

## 一句话定义

日志结构合并树，写入优化型存储结构，批量写入后再合并。

## 为什么好

**优点：**

- 写入性能极高
- 顺序写入，磁盘友好
- 支持高并发写入

**缺点：**

- 读取需要合并多个层级
- 空间放大
- 写入放大

## 适用场景

- **写入密集型**：日志系统、时序数据
- **大数据存储**：Cassandra、HBase
- **需要高吞吐**：实时分析

## 代码实现

```typescript
// 简化版 LSM 树
class LSMTree {
  private levels: Map<number, SortedMap[]> = new Map();
  private memTable: SortedMap;
  private maxMemSize: number;
  private levelSizeRatio: number = 10;

  constructor(maxMemSize: number = 1000) {
    this.maxMemSize = maxMemSize;
    this.memTable = new SortedMap();
  }

  put(key: string, value: any): void {
    this.memTable.set(key, value);

    if (this.memTable.size >= this.maxMemSize) {
      this.flush();
    }
  }

  get(key: string): any | undefined {
    // 先查内存
    let value = this.memTable.get(key);
    if (value !== undefined) return value;

    // 再查各层级（从新到旧）
    for (let level = 0; level < 10; level++) {
      const tables = this.levels.get(level) || [];
      for (const table of tables) {
        value = table.get(key);
        if (value !== undefined) return value;
      }
    }

    return undefined;
  }

  private flush(): void {
    // 将内存表刷到磁盘作为 L0
    const sstable = this.memTable;
    this.memTable = new SortedMap();

    const l0 = this.levels.get(0) || [];
    l0.push(sstable);

    // 如果 L0 超过阈值，合并到 L1
    if (l0.length >= this.levelSizeRatio) {
      this.compact(0);
    }
  }

  private compact(level: number): void {
    const tables = this.levels.get(level) || [];
    if (tables.length < this.levelSizeRatio) return;

    // 合并所有表
    const merged = new SortedMap();
    for (const table of tables) {
      for (const [k, v] of table) {
        merged.set(k, v); // 保留最新值
      }
    }

    // 放到下一层
    const nextLevel = level + 1;
    if (!this.levels.has(nextLevel)) {
      this.levels.set(nextLevel, []);
    }
    this.levels.get(nextLevel)!.push(merged);
    this.levels.set(level, []);
  }
}

// 简化版有序 Map
class SortedMap extends Map {
  // 实际实现需要落盘
}
```

## 时间/空间复杂度

| 操作 | 时间复杂度 |
| ---- | ---------- |
| 写入 | O(1)       |
| 读取 | O(log n)   |
| 合并 | O(n)       |

## 使用边界/注意事项

1. **写放大**：合并过程频繁写入
2. **空间放大**：重复数据占用空间
3. **读延迟**：需要合并多层
4. **调优复杂**：需要权衡多层数和合并策略

## 面试常考点

- LSM 树 vs B+树对比（写多读少 vs 读多写少）
- 写放大和空间放大问题
- LSM 树的合并策略（Tiered vs Leveled）

## 经典应用案例

- **Cassandra**：写入优化
- **HBase**：HDFS 上的 LSM 树
- **ClickHouse**：MergeTree 引擎
- **RocksDB**：LSM 树实现

**为什么选择**：LSM 树是写入密集型场景的首选，完美适配大数据实时写入。
