# B+树

## 一句话定义

多路平衡查找树，磁盘数据库范围查询的标配数据结构。

## 为什么好

**优点：**

- 矮胖树形，查找 IO 次数少
- 范围查询友好（叶子节点链表）
- 所有数据在叶子节点，查询稳定

**缺点：**

- 实现复杂
- 插入删除有维护成本
- 内存中不如红黑树高效

## 适用场景

- **磁盘数据库索引**：MySQL InnoDB、PostgreSQL
- **文件系统**：NTFS、HFS+
- **需要范围查询**：区间检索

## 代码实现

```typescript
// B+树简化实现（度为 m，每个节点最多 m-1 个 key）
class BPlusTree<K, V> {
  private degree: number;
  private root: BPlusNode<K, V>;

  constructor(degree: number) {
    this.degree = degree;
    this.root = new LeafNode<K, V>();
  }

  search(key: K): V | undefined {
    return this.root.search(key);
  }

  insert(key: K, value: V): void {
    this.root.insert(key, value, this.degree);
  }

  delete(key: K): void {
    this.root.delete(key, this.degree);
  }
}

abstract class BPlusNode<K, V> {
  keys: K[] = [];
  abstract search(key: K): V | undefined;
  abstract insert(key: K, value: V, degree: number): void;
  abstract delete(key: K, degree: number): void;
}

class LeafNode<K, V> extends BPlusNode<K, V> {
  values: V[] = [];
  next: LeafNode<K, V> | null = null;

  search(key: K): V | undefined {
    const idx = this.keys.indexOf(key);
    return idx >= 0 ? this.values[idx] : undefined;
  }

  // 简化实现，实际需处理分裂
  insert(key: K, value: V, degree: number): void {
    const idx = this.keys.findIndex((k) => k > key);
    if (idx >= 0) {
      this.keys.splice(idx, 0, key);
      this.values.splice(idx, 0, value);
    } else {
      this.keys.push(key);
      this.values.push(value);
    }
  }

  delete(key: K, degree: number): void {
    const idx = this.keys.indexOf(key);
    if (idx >= 0) {
      this.keys.splice(idx, 1);
      this.values.splice(idx, 1);
    }
  }
}

// 内部节点
class InternalNode<K, V> extends BPlusNode<K, V> {
  children: BPlusNode<K, V>[] = [];

  search(key: K): V | undefined {
    const idx = this.keys.findIndex((k) => k > key);
    const childIdx = idx >= 0 ? idx : this.keys.length;
    return this.children[childIdx].search(key);
  }

  insert(key: K, value: V, degree: number): void {
    // 简化实现
  }

  delete(key: K, degree: number): void {
    // 简化实现
  }
}
```

## 时间/空间复杂度

| 操作 | 时间复杂度 | 空间复杂度 |
| ---- | ---------- | ---------- |
| 查找 | O(log_m n) | -          |
| 插入 | O(log_m n) | -          |
| 删除 | O(log_m n) | -          |

注：m 是阶数，log_m n 是树高，一般 3-4 层

## 使用边界/注意事项

1. **度选择**：磁盘页大小决定，一般 4KB
2. **顺序插入**：可能导致不平衡
3. **并发控制**：B+树并发访问需要锁

## 经典应用案例

- **MySQL InnoDB**：主键索引和二级索引
- **PostgreSQL**：B-tree 索引
- **SQLite**：默认索引类型
- **Oracle**：B-tree 索引
- **SQL Server**：聚集索引

**为什么选择**：B+树是最成功的磁盘索引结构，完美平衡了查找效率和磁盘 IO。
