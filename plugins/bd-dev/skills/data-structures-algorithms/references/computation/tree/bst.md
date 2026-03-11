# 二叉搜索树（BST）

## 一句话定义

左子树所有节点小于根，右子树所有节点大于根的二叉树，支持 O(log n) 查找。

## 为什么好

**优点：**

- 查找 O(log n)（平衡时）
- 插入 O(log n)
- 支持有序遍历
- 实现简单

**缺点：**

- 最坏 O(n)（退化成链表）
- 需要旋转平衡

## 适用场景

- 有序数据存储
- 查找需求多
- 符号表实现

## 代码实现

```typescript
class BSTNode<T> {
  val: T;
  left: BSTNode<T> | null = null;
  right: BSTNode<T> | null = null;

  constructor(val: T) {
    this.val = val;
  }
}

class BST<T> {
  root: BSTNode<T> | null = null;
  private compare: (a: T, b: T) => number;

  constructor(compare?: (a: T, b: T) => number) {
    this.compare = compare || ((a: any, b: any) => a - b);
  }

  insert(val: T): void {
    this.root = this._insert(this.root, val);
  }

  private _insert(node: BSTNode<T> | null, val: T): BSTNode<T> {
    if (!node) return new BSTNode(val);

    if (this.compare(val, node.val) < 0) {
      node.left = this._insert(node.left, val);
    } else {
      node.right = this._insert(node.right, val);
    }
    return node;
  }

  search(val: T): boolean {
    return this._search(this.root, val);
  }

  private _search(node: BSTNode<T> | null, val: T): boolean {
    if (!node) return false;
    const cmp = this.compare(val, node.val);
    if (cmp === 0) return true;
    return cmp < 0 ? this._search(node.left, val) : this._search(node.right, val);
  }

  // 中序遍历（有序）
  inorder(): T[] {
    const result: T[] = [];
    this._inorder(this.root, result);
    return result;
  }

  private _inorder(node: BSTNode<T> | null, result: T[]): void {
    if (!node) return;
    this._inorder(node.left, result);
    result.push(node.val);
    this._inorder(node.right, result);
  }
}
```

## 时间复杂度

| 操作 | 平均     | 最坏 |
| ---- | -------- | ---- |
| 查找 | O(log n) | O(n) |
| 插入 | O(log n) | O(n) |
| 删除 | O(log n) | O(n) |

## 经典应用

- **数据库索引**：B+树前身
- **符号表**：编译器
- **优先队列**：集合实现

**为什么选择**：BST 是理解更复杂平衡树的基础，面试必考。
