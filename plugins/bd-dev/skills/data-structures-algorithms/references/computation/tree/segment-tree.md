# 线段树

## 一句话定义

专门用于区间查询和更新的二叉树结构。

## 为什么好

**优点：**

- 区间查询 O(log n)
- 区间更新 O(log n)
- 支持多种区间操作

**缺点：**

- 实现复杂
- 空间开销大（4n）

## 适用场景

- **区间求和/最值**：动态数组区间查询
- **区间修改**：批量更新
- **前缀和**：动态前缀和

## 代码实现

```typescript
class SegmentTree {
  private tree: number[];
  private n: number;
  private operation: (a: number, b: number) => number;
  private identity: number;

  constructor(arr: number[], operation: (a: number, b: number) => number, identity: number) {
    this.n = arr.length;
    this.operation = operation;
    this.identity = identity;
    this.tree = new Array(4 * this.n).fill(identity);
    this.build(arr, 0, 0, this.n - 1);
  }

  private build(arr: number[], node: number, start: number, end: number): void {
    if (start === end) {
      this.tree[node] = arr[start];
    } else {
      const mid = Math.floor((start + end) / 2);
      this.build(arr, 2 * node + 1, start, mid);
      this.build(arr, 2 * node + 2, mid + 1, end);
      this.tree[node] = this.operation(this.tree[2 * node + 1], this.tree[2 * node + 2]);
    }
  }

  query(left: number, right: number): number {
    return this.queryHelper(0, 0, this.n - 1, left, right);
  }

  private queryHelper(node: number, start: number, end: number, left: number, right: number): number {
    if (right < start || left > end) return this.identity;
    if (left <= start && end <= right) return this.tree[node];

    const mid = Math.floor((start + end) / 2);
    return this.operation(
      this.queryHelper(2 * node + 1, start, mid, left, right),
      this.queryHelper(2 * node + 2, mid + 1, end, left, right),
    );
  }

  update(index: number, value: number): void {
    this.updateHelper(0, 0, this.n - 1, index, value);
  }

  private updateHelper(node: number, start: number, end: number, index: number, value: number): void {
    if (start === end) {
      this.tree[node] = value;
    } else {
      const mid = Math.floor((start + end) / 2);
      if (index <= mid) {
        this.updateHelper(2 * node + 1, start, mid, index, value);
      } else {
        this.updateHelper(2 * node + 2, mid + 1, end, index, value);
      }
      this.tree[node] = this.operation(this.tree[2 * node + 1], this.tree[2 * node + 2]);
    }
  }
}

// 使用
const arr = [1, 3, 5, 7, 9, 11];
const sumTree = new SegmentTree(arr, (a, b) => a + b, 0);
console.log(sumTree.query(1, 4)); // 3 + 5 + 7 + 9 = 24
```

## 时间/空间复杂度

| 操作 | 时间复杂度 | 空间复杂度 |
| ---- | ---------- | ---------- |
| 构建 | O(n)       | O(n)       |
| 查询 | O(log n)   | -          |
| 更新 | O(log n)   | -          |

## 经典应用案例

- **LeetCode**：区间求和/最值问题
- **数据库**：范围查询优化
- **可视化**：区间统计

**为什么选择**：线段树是区间查询和更新的标准解法，面试常考。

## 使用边界

**何时不用：**

- 静态数组：前缀和数组更快
- 单点查询：哈希表即可
- 只查询不更新：前缀和

**注意事项：**

- 空间：需要 4n 空间
- 区间更新：懒传播可优化
- 操作泛化：通过函数参数化支持不同操作
- 边界处理：注意数组下标越界

**面试常考点：**

- 线段树构建
- 区间查询/更新
- 懒传播线段树
- 线段树 vs 树状数组对比
- 线段树应用场景
