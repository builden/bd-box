# 并查集

## 一句话定义

disjoint set，用于处理不相交集合的合并与查询。

## 为什么好

**优点：**

- 近乎 O(1) 的查询和合并
- 路径压缩 + 按秩合并接近常数
- 实现简单

**缺点：**

- 只能处理连通性问题
- 不支持分割操作

## 适用场景

- **图的连通分量**：岛屿数量、朋友圈
- **等价关系处理**：动态连通性
- **Kruskal 算法**：最小生成树

## 代码实现

```typescript
class UnionFind {
  parent: number[];
  rank: number[];
  count: number;

  constructor(n: number) {
    this.count = n;
    this.parent = new Array(n);
    this.rank = new Array(n);

    for (let i = 0; i < n; i++) {
      this.parent[i] = i;
      this.rank[i] = 0;
    }
  }

  find(x: number): number {
    if (this.parent[x] !== x) {
      // 路径压缩
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }

  union(x: number, y: number): void {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) return;

    // 按秩合并
    if (this.rank[rootX] < this.rank[rootY]) {
      this.parent[rootX] = rootY;
    } else if (this.rank[rootX] > this.rank[rootY]) {
      this.parent[rootY] = rootX;
    } else {
      this.parent[rootY] = rootX;
      this.rank[rootX]++;
    }

    this.count--;
  }

  connected(x: number, y: number): boolean {
    return this.find(x) === this.find(y);
  }
}

// 岛屿数量
function numIslands(grid: char[][]): number {
  if (!grid.length || !grid[0].length) return 0;

  const rows = grid.length;
  const cols = grid[0].length;
  const uf = new UnionFind(rows * cols);

  const directions = [
    [0, 1],
    [1, 0],
    [-1, 0],
    [0, -1],
  ];

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (grid[i][j] === "0") continue;

      const idx = i * cols + j;
      uf.parent[idx] = idx;

      for (const [dx, dy] of directions) {
        const ni = i + dx;
        const nj = j + dy;

        if (ni >= 0 && ni < rows && nj >= 0 && nj < cols && grid[ni][nj] === "1") {
          uf.union(idx, ni * cols + nj);
        }
      }
    }
  }

  return uf.count;
}
```

## 时间/空间复杂度

| 操作      | 时间复杂度 | 空间复杂度 |
| --------- | ---------- | ---------- |
| find      | O(α(n))    | -          |
| union     | O(α(n))    | O(n)       |
| connected | O(α(n))    | -          |

注：α(n) 为阿克曼函数的反函数，接近常数

## 经典应用案例

- **LeetCode**：岛屿数量、朋友圈
- **Kruskal 算法**：最小生成树
- **图连通性**：网络渗透检测

## 使用边界

**何时不用：**

- 需要分割集合：并查集不支持
- 需要获取所有集合：需要额外维护列表
- 动态树问题：需要 Link-Cut Tree

**注意事项：**

- 路径压缩：递归实现可能导致栈溢出，迭代更安全
- 按秩合并：避免树退化
- 初始化：只初始化需要合并的节点

**面试常考点：**

- 并查集原理
- 路径压缩和按秩合并
- 岛屿数量问题
- Kruskal 算法中的应用

**为什么选择**：并查集是处理连通性问题的神器，几乎 O(1) 的操作让大规模数据处理成为可能。
