# B 树

## 一句话定义

多路平衡查找树，每个节点可以有多个键和多个子节点。

## 为什么好

**优点：**

- 减少磁盘 IO
- 范围查询友好
- 平衡保证查询性能

**缺点：**

- 实现复杂
- 空间利用率不如 B+树

## 适用场景

- **文档数据库索引**：MongoDB
- **文件系统**：文件系统索引
- **磁盘索引**：需要磁盘友好的场景

## 代码实现

```typescript
class BTree<K, V> {
  private degree: number; // 最小度数
  private root: BTreeNode<K, V>;

  constructor(degree: number) {
    this.degree = degree;
    this.root = new BTreeNode<K, V>(true);
  }

  search(key: K): V | undefined {
    return this.root.search(key);
  }

  insert(key: K, value: V): void {
    const root = this.root;
    if (root.keys.length === 2 * this.degree - 1) {
      const newRoot = new BTreeNode<K, V>(false);
      newRoot.children.push(root);
      this.splitChild(newRoot, 0);
      this.insertNonFull(newRoot, key, value);
      this.root = newRoot;
    } else {
      this.insertNonFull(root, key, value);
    }
  }

  private insertNonFull(node: BTreeNode<K, V>, key: K, value: V): void {
    let i = node.keys.length - 1;

    if (node.isLeaf) {
      // 找到插入位置
      while (i >= 0 && key < node.keys[i]) {
        i--;
      }
      node.keys.splice(i + 1, 0, key);
      node.values.splice(i + 1, 0, value);
    } else {
      while (i >= 0 && key < node.keys[i]) {
        i--;
      }
      i++;
      if (node.children[i].keys.length === 2 * this.degree - 1) {
        this.splitChild(node, i);
        if (key > node.keys[i]) {
          i++;
        }
      }
      this.insertNonFull(node.children[i], key, value);
    }
  }

  private splitChild(parent: BTreeNode<K, V>, index: number): void {
    const child = parent.children[index]!;
    const newChild = new BTreeNode<K, V>(child.isLeaf);

    // 移动后半部分键值到新节点
    for (let j = 0; j < this.degree - 1; j++) {
      newChild.keys.push(child.keys[j + this.degree]);
      newChild.values.push(child.values[j + this.degree]);
    }

    if (!child.isLeaf) {
      for (let j = 0; j < this.degree; j++) {
        newChild.children.push(child.children[j + this.degree]);
      }
    }

    child.keys = child.keys.slice(0, this.degree - 1);
    child.values = child.values.slice(0, this.degree - 1);
    if (!child.isLeaf) {
      child.children = child.children.slice(0, this.degree);
    }

    // 将中间的键提升到父节点
    parent.children.splice(index + 1, 0, newChild);
    parent.keys.splice(index, 0, child.keys[this.degree - 1]);
    parent.values.splice(index, 0, child.values[this.degree - 1]);
  }
}

class BTreeNode<K, V> {
  keys: K[] = [];
  values: V[] = [];
  children: BTreeNode<K, V>[] = [];
  isLeaf: boolean;

  constructor(isLeaf: boolean) {
    this.isLeaf = isLeaf;
  }

  search(key: K): V | undefined {
    let i = 0;
    while (i < this.keys.length && key > this.keys[i]) {
      i++;
    }

    if (i < this.keys.length && key === this.keys[i]) {
      return this.values[i];
    }

    if (this.isLeaf) {
      return undefined;
    }

    return this.children[i].search(key);
  }
}
```

## 时间/空间复杂度

| 操作 | 时间复杂度 |
| ---- | ---------- |
| 查找 | O(log_m n) |
| 插入 | O(log_m n) |
| 删除 | O(log_m n) |

## B 树 vs B+树

| 特性       | B 树             | B+树             |
| ---------- | ---------------- | ---------------- |
| 数据存储   | 键和数据都在节点 | 仅叶子节点存数据 |
| 范围查询   | 需要遍历树       | 叶子节点链表     |
| 查询稳定性 | 最坏 O(log n)    | 稳定 O(log n)    |

## 经典应用案例

- **MongoDB**：文档数据库索引
- **CouchDB**：NoSQL 索引
- **Berkeley DB**：嵌入式数据库
- **文件系统**：NTFS、HFS+

## 使用边界

**何时不用：**

- 纯范围查询为主：B+树更优（叶子节点链表）
- 内存数据库：红黑树更简单高效
- 需要所有数据在叶子：B+树更合适

**注意事项：**

- 阶数（degree）选择影响树高和磁盘 IO
- 节点分裂/合并有维护成本
- 度越大，树越矮，但单次操作代价越大

**面试常考点：**

- B 树 vs B+树区别和应用场景
- B 树的插入和分裂过程
- B 树为什么适合磁盘存储

**为什么选择**：B 树适合需要随机访问和范围查询的场景，是很多数据库的基础。
