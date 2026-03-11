# AVL 树

## 一句话定义

自平衡二叉搜索树，左右子树高度差不超过 1，查找/插入/删除 O(log n)。

## 为什么好

**优点：**

- 严格平衡 O(log n)
- 查找效率高
- 自动平衡

**缺点：**

- 旋转开销大
- 实现复杂
- 读多写少场景

## 适用场景

- 读密集型场景
- 查找为主
- 严格平衡需求

## 代码实现

```typescript
class AVLNode<T> {
  val: T;
  height: number = 1;
  left: AVLNode<T> | null = null;
  right: AVLNode<T> | null = null;

  constructor(val: T) {
    this.val = val;
  }
}

class AVLTree<T> {
  root: AVLNode<T> | null = null;
  private compare: (a: T, b: T) => number;

  constructor(compare?: (a: T, b: T) => number) {
    this.compare = compare || ((a: any, b: any) => a - b);
  }

  private getHeight(node: AVLNode<T> | null): number {
    return node?.height ?? 0;
  }

  private getBalance(node: AVLNode<T> | null): number {
    return node ? this.getHeight(node.left) - this.getHeight(node.right) : 0;
  }

  private rightRotate(y: AVLNode<T>): AVLNode<T> {
    const x = y.left!;
    const T2 = x.right;
    x.right = y;
    y.left = T2;
    y.height = Math.max(this.getHeight(y.left), this.getHeight(y.right)) + 1;
    x.height = Math.max(this.getHeight(x.left), this.getHeight(x.right)) + 1;
    return x;
  }

  private leftRotate(x: AVLNode<T>): AVLNode<T> {
    const y = x.right!;
    const T2 = y.left;
    y.left = x;
    x.right = T2;
    x.height = Math.max(this.getHeight(x.left), this.getHeight(x.right)) + 1;
    y.height = Math.max(this.getHeight(y.left), this.getHeight(y.right)) + 1;
    return y;
  }

  insert(val: T): void {
    this.root = this._insert(this.root, val);
  }

  private _insert(node: AVLNode<T> | null, val: T): AVLNode<T> {
    if (!node) return new AVLNode(val);

    if (this.compare(val, node.val) < 0) {
      node.left = this._insert(node.left, val);
    } else {
      node.right = this._insert(node.right, val);
    }

    node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
    const balance = this.getBalance(node);

    // LL
    if (balance > 1 && this.compare(val, node.left!.val) < 0) {
      return this.rightRotate(node);
    }
    // RR
    if (balance < -1 && this.compare(val, node.right!.val) > 0) {
      return this.leftRotate(node);
    }
    // LR
    if (balance > 1 && this.compare(val, node.left!.val) > 0) {
      node.left = this.leftRotate(node.left!);
      return this.rightRotate(node);
    }
    // RL
    if (balance < -1 && this.compare(val, node.right!.val) < 0) {
      node.right = this.rightRotate(node.right!);
      return this.leftRotate(node);
    }

    return node;
  }
}
```

## 时间复杂度

| 操作 | 时间复杂度 |
| ---- | ---------- |
| 查找 | O(log n)   |
| 插入 | O(log n)   |
| 删除 | O(log n)   |

## 经典应用

- **C++ std::map**：早期实现
- **数据库**：内存索引
- **文件系统**：目录结构

## 使用边界

**何时不用：**

- 写多读少：红黑树更适合（旋转更少）
- 实现简单优先：红黑树更简单
- 大规模数据：考虑 B 树系列

**注意事项：**

- 严格平衡，高度差不超过 1
- 插入/删除最多 O(log n) 次旋转
- 需要存储高度信息

**面试常考点：**

- AVL 树的 4 种旋转情况（LL、RR、LR、RL）
- AVL vs 红黑树对比
- 平衡因子计算

**为什么选择**：AVL 是最早的自平衡二叉树，查找效率最优。
