# 跳表

## 一句话定义

多层有序链表，通过随机跳跃实现 O(log n) 查找的平衡结构。

## 为什么好

**优点：**

- 实现比红黑树简单
- 插入删除不需要旋转
- 有序，支持范围查询
- 并发友好

**缺点：**

- 空间复杂度较高（O(n log n)）
- 随机性，查找时间不稳定
- 缓存不友好

## 适用场景

- **内存有序 kv 存储**：Redis ZSet
- **替代红黑树**：需要有序性的场景
- **并发环境**：需要锁-free 或细粒度锁

## 代码实现

```typescript
class SkipList<K, V> {
  private head: SkipNode<K, V>;
  private maxLevel: number = 16;
  private size = 0;

  constructor() {
    this.head = new SkipNode<K, V>(undefined, undefined, maxLevel);
  }

  private randomLevel(): number {
    let level = 0;
    while (Math.random() < 0.5 && level < this.maxLevel - 1) {
      level++;
    }
    return level;
  }

  insert(key: K, value: V): void {
    const update: SkipNode<K, V>[] = new Array(this.maxLevel);
    let current = this.head;

    // 从高层向低层遍历
    for (let i = this.maxLevel - 1; i >= 0; i--) {
      while (current.forward[i] && current.forward[i].key < key) {
        current = current.forward[i]!;
      }
      update[i] = current;
    }

    current = current.forward[0];

    // 已存在，更新
    if (current && current.key === key) {
      current.value = value;
      return;
    }

    // 新插入
    const level = this.randomLevel();
    const newNode = new SkipNode(key, value, level);

    for (let i = 0; i < level; i++) {
      newNode.forward[i] = update[i].forward[i];
      update[i].forward[i] = newNode;
    }
    this.size++;
  }

  search(key: K): V | undefined {
    let current = this.head;

    for (let i = this.maxLevel - 1; i >= 0; i--) {
      while (current.forward[i] && current.forward[i].key < key) {
        current = current.forward[i]!;
      }
    }

    current = current.forward[0];
    return current?.key === key ? current.value : undefined;
  }

  delete(key: K): boolean {
    const update: SkipNode<K, V>[] = new Array(this.maxLevel);
    let current = this.head;

    for (let i = this.maxLevel - 1; i >= 0; i--) {
      while (current.forward[i] && current.forward[i].key < key) {
        current = current.forward[i]!;
      }
      update[i] = current;
    }

    current = current.forward[0];
    if (!current || current.key !== key) return false;

    for (let i = 0; i < this.maxLevel; i++) {
      if (update[i].forward[i] !== current) break;
      update[i].forward[i] = current.forward[i];
    }

    this.size--;
    return true;
  }

  get size(): number {
    return this.size;
  }
}

class SkipNode<K, V> {
  key: K;
  value: V;
  forward: (SkipNode<K, V> | null)[];

  constructor(key: K, value: V, level: number) {
    this.key = key;
    this.value = value;
    this.forward = new Array(level + 1).fill(null);
  }
}
```

## 时间/空间复杂度

| 操作 | 平均复杂度 | 最坏复杂度 |
| ---- | ---------- | ---------- |
| 查找 | O(log n)   | O(n)       |
| 插入 | O(log n)   | O(n)       |
| 删除 | O(log n)   | O(n)       |
| 空间 | O(n)       | O(n log n) |

## 使用边界/注意事项

1. **随机层级**：概率保证平衡，时间有波动
2. **内存开销**：每节点有多个指针
3. **顺序访问**：不适合顺序遍历
4. **并发友好**：适合高并发场景

## 面试常考点

- 跳表 vs 红黑树对比
- 跳表层级计算和概率分析
- 插入/删除操作详解
- 为什么用随机而不是确定性平衡

## 经典应用案例

- **Redis ZSet**：有序集合底层
- **LevelDB**：MemTable 内存结构
- **HBase**：MemStore
- **ConcurrentSkipListMap**：Java 并发 Map

**为什么选择**：跳表是 Redis 成功的关键，用简单的随机实现了高效的平衡结构。
