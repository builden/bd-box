# 树状数组（Fenwick Tree）

## 一句话定义

用数组实现的前缀和树，单点更新 O(log n)，区间求和 O(log n)。

## 为什么好

**优点：**

- 实现简单
- 空间 O(n)
- 常数比线段树小

**缺点：**

- 只能做前缀和操作
- 功能有限

## 适用场景

- **前缀和**：动态前缀和查询
- **逆序对**：统计小于某值的元素个数
- **区间和**：单点更新 + 区间求和

## 代码实现

```typescript
class FenwickTree {
  private tree: number[];
  private n: number;

  constructor(n: number) {
    this.n = n;
    this.tree = new Array(n + 1).fill(0);
  }

  // 单点更新：add(i, delta)
  update(index: number, delta: number): void {
    for (let i = index + 1; i <= this.n; i += i & -i) {
      this.tree[i] += delta;
    }
  }

  // 前缀和：sum(0, i)
  query(index: number): number {
    let sum = 0;
    for (let i = index + 1; i > 0; i -= i & -i) {
      sum += this.tree[i];
    }
    return sum;
  }

  // 区间和：sum(l, r)
  rangeQuery(left: number, right: number): number {
    return this.query(right) - this.query(left - 1);
  }
}

// 逆序对
function countInversions(arr: number[]): number {
  const n = Math.max(...arr) + 1;
  const bit = new FenwickTree(n);
  let inversions = 0;

  for (let i = 0; i < arr.length; i++) {
    // 查询比 arr[i] 大的已有元素数量
    inversions += bit.query(n - 1) - bit.query(arr[i]);
    bit.update(arr[i], 1);
  }

  return inversions;
}
```

## 时间/空间复杂度

| 操作     | 时间复杂度 | 空间复杂度 |
| -------- | ---------- | ---------- |
| 单点更新 | O(log n)   | -          |
| 前缀和   | O(log n)   | -          |
| 区间和   | O(log n)   | O(n)       |

## 经典应用案例

- **LeetCode**：前缀和、逆序对问题
- **数据流**：实时统计
- **算法竞赛**：高频数据结构

**为什么选择**：树状数组是线段树的简化版，实现更简洁，适合简单前缀和场景。

## 使用边界

**何时不用：**

- 需要区间最值：线段树才能支持
- 复杂区间操作：线段树更通用
- 静态数组：前缀和数组更快

**注意事项：**

- 只能做前缀和：区间求和通过两次前缀和实现
- 索引偏移：通常用 1-indexed
- lowbit：i & -i 是核心操作
- 逆序对：典型应用场景

**面试常考点：**

- lowbit 原理
- 树状数组 vs 线段树对比
- 树状数组构建
- 逆序对问题
- 区间求和实现
