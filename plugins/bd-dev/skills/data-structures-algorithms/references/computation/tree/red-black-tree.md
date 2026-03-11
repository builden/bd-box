# 红黑树

## 一句话定义

近似平衡的二叉搜索树，查找/插入/删除 O(log n)，比 AVL 旋转更少。

## 为什么好

**优点：**

- O(log n) 保障
- 插入旋转少
- 综合性能好

**缺点：**

- 实现复杂
- 不保证严格平衡
- 查询略慢 AVL

## 适用场景

- 写密集型场景
- 语言标准库
- 数据库索引

## 代码实现

```typescript
enum Color {
  RED,
  BLACK,
}

class RBNode<T> {
  val: T;
  color: Color = Color.RED;
  left: RBNode<T> | null = null;
  right: RBNode<T> | null = null;
  parent: RBNode<T> | null = null;

  constructor(val: T) {
    this.val = val;
  }
}

class RedBlackTree<T> {
  nil: RBNode<T>;
  root: RBNode<T>;
  private compare: (a: T, b: T) => number;

  constructor(compare?: (a: T, b: T) => number) {
    this.compare = compare || ((a: any, b: any) => a - b);
    this.nil = new RBNode(null as any);
    this.nil.color = Color.BLACK;
    this.root = this.nil;
  }

  private leftRotate(x: RBNode<T>): void {
    const y = x.right!;
    x.right = y.left;
    if (y.left !== this.nil) {
      y.left.parent = x;
    }
    y.parent = x.parent;
    if (x.parent === this.nil) {
      this.root = y;
    } else if (x === x.parent!.left) {
      x.parent!.left = y;
    } else {
      x.parent!.right = y;
    }
    y.left = x;
    x.parent = y;
  }

  private rightRotate(y: RBNode<T>): void {
    const x = y.left!;
    y.left = x.right;
    if (x.right !== this.nil) {
      x.right.parent = y;
    }
    x.parent = y.parent;
    if (y.parent === this.nil) {
      this.root = x;
    } else if (y === y.parent!.right) {
      y.parent!.right = x;
    } else {
      y.parent!.left = x;
    }
    x.right = y;
    y.parent = x;
  }

  insert(val: T): void {
    const z = new RBNode(val);
    z.left = this.nil;
    z.right = this.nil;

    let y = this.nil;
    let x = this.root;

    while (x !== this.nil) {
      y = x;
      if (this.compare(z.val, x.val) < 0) {
        x = x.left!;
      } else {
        x = x.right!;
      }
    }

    z.parent = y;
    if (y === this.nil) {
      this.root = z;
    } else if (this.compare(z.val, y.val) < 0) {
      y.left = z;
    } else {
      y.right = z;
    }

    this.insertFixup(z);
  }

  private insertFixup(z: RBNode<T>): void {
    while (z.parent!.color === Color.RED) {
      if (z.parent === z.parent!.parent!.left) {
        const y = z.parent!.parent!.right;
        if (y!.color === Color.RED) {
          z.parent!.color = Color.BLACK;
          y!.color = Color.BLACK;
          z.parent!.parent!.color = Color.RED;
          z = z.parent!.parent!;
        } else {
          if (z === z.parent!.right) {
            z = z.parent!;
            this.leftRotate(z);
          }
          z.parent!.color = Color.BLACK;
          z.parent!.parent!.color = Color.RED;
          this.rightRotate(z.parent!.parent!);
        }
      } else {
        // symmetric
      }
    }
    this.root.color = Color.BLACK;
  }
}
```

## 时间复杂度

| 操作 | 时间复杂度 |
| ---- | ---------- |
| 查找 | O(log n)   |
| 插入 | O(log n)   |
| 删除 | O(log n)   |

## AVL vs 红黑树

| 特性   | AVL    | 红黑树 |
| ------ | ------ | ------ |
| 平衡度 | 严格   | 近似   |
| 查找   | 更优   | 略差   |
| 插入   | 旋转多 | 旋转少 |
| 应用   | 读多   | 写多   |

## 经典应用

- **Java TreeMap/TreeSet**
- **C++ std::map**（现代）
- **Linux 调度器**
- **Epoll 红黑树**

## 使用边界

**何时不用：**

- 纯读场景：AVL 更优
- 需要严格平衡：AVL 更适合
- 非常简单的有序集合：有序数组即可

**注意事项：**

- 红黑树不是严格平衡，查找略慢于 AVL
- 实现复杂度高，建议使用现成库
- 插入最多 2 次旋转，删除最多 3 次

**面试常考点：**

- 红黑树的 5 个性质
- 插入和删除的旋转情况
- 红黑树 vs AVL 对比
- 为什么红黑树比 AVL 插入效率高

**为什么选择**：红黑树是工业界最常用的平衡树，综合性能最优。
