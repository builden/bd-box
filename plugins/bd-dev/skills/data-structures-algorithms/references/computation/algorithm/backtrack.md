# 回溯算法

## 一句话定义

尝试所有可能路径，失败则回退，剪枝避免无效搜索。

## 核心思想

```
尝试 → 回退 → 剪枝 → 找到解
```

## 为什么好

**优点：**

- 能找到所有解
- 避免无效搜索
- 通用性强

**缺点：**

- 时间复杂度指数级
- 空间复杂度高

## 适用场景

- **排列组合**：子集、排列
- **棋盘问题**：N 皇后、数独
- **路径搜索**：迷宫、单词搜索
- **约束满足**：八皇后

## 经典案例

### 1. 全排列

```typescript
function permute(nums: number[][]: number[][] {
  const result: number[][] = [];
  const backtrack = (path: number[], used: boolean[]) => {
    if (path.length === nums.length) {
      result.push([...path]);
      return;
    }

    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      path.push(nums[i]);
      used[i] = true;
      backtrack(path, used);
      path.pop();
      used[i] = false;
    }
  };

  backtrack([], new Array(nums.length).fill(false));
  return result;
}
```

### 2. N 皇后

```typescript
function solveNQueens(n: number): string[][] {
  const result: string[][] = [];
  const cols = new Set<number>();
  const diag1 = new Set<number>(); // 行+列
  const diag2 = new Set<number>(); // 行-列

  const backtrack = (row: number[], currentBoard: string[]) => {
    if (row.length === n) {
      result.push(currentBoard);
      return;
    }

    for (let col = 0; col < n; col++) {
      const d1 = row.length + col;
      const d2 = row.length - col;

      if (cols.has(col) || diag1.has(d1) || diag2.has(d2)) continue;

      cols.add(col);
      diag1.add(d1);
      diag2.add(d2);
      row.push(col);

      const newBoard = [...currentBoard];
      newBoard.push(".".repeat(col) + "Q" + ".".repeat(n - col - 1));
      backtrack(row, newBoard);

      row.pop();
      cols.delete(col);
      diag1.delete(d1);
      diag2.delete(d2);
    }
  };

  backtrack([], []);
  return result;
}
```

### 3. 子集

```typescript
function subsets(nums: number[]): number[][] {
  const result: number[][] = [];

  const backtrack = (start: number, path: number[]) => {
    result.push([...path]);

    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);
      backtrack(i + 1, path);
      path.pop();
    }
  };

  backtrack(0, []);
  return result;
}
```

## 剪枝优化

```typescript
// 剪枝：提前排除不可能的情况
function backtrackWithPruning(n: number, k: number, start: number, path: number[]): void {
  // 剪枝：剩余元素不够
  if (path.length + (n - start + 1) < k) return;

  // 找到解
  if (path.length === k) {
    result.push([...path]);
    return;
  }

  for (let i = start; i <= n; i++) {
    path.push(i);
    backtrackWithPruning(n, k, i + 1, path);
    path.pop();
  }
}
```

## 时间复杂度

回溯算法通常是指数级，但通过剪枝可以大幅优化。

## 使用边界

**何时不用：**

- 解空间小：暴力搜索即可
- 有更优算法：DP 可解决的不用回溯
- 实时性要求高：指数级复杂度

**注意事项：**

- 剪枝是关键：好的剪枝大幅提升效率
- 状态重置：回退时一定要恢复状态
- 递归深度：注意栈溢出问题
- 对称剪枝：避免重复搜索

**面试常考点：**

- 回溯 vs DFS vs BFS 对比
- 常见回溯问题（全排列、子集、N 皇后）
- 剪枝方法
- 回溯 vs DP 对比
- 子集树 vs 排列树

**为什么选择**：回溯是解决约束满足问题的通用方法，面试常考。
