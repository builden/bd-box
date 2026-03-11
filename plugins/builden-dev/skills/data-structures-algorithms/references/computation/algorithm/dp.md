# 动态规划

## 一句话定义

将复杂问题分解为重叠子问题，自底向上求解最优解。

## 核心要素

1. **最优子结构**：最优解由子问题的最优解构成
2. **重叠子问题**：子问题会被重复求解

## 为什么好

**优点：**

- 避免重复计算
- 空间换时间
- 适合最优解问题

**缺点：**

- 需要找出状态转移方程
- 空间复杂度较高

## 适用场景

- **最优解问题**：最长公共子序列、背包问题
- **计数问题**：路径计数
- **博弈问题**：最优策略

## 经典案例

### 1. 斐波那契数列

```typescript
function fib(n: number): number {
  if (n <= 1) return n;

  const dp = new Array(n + 1);
  dp[0] = 0;
  dp[1] = 1;

  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }

  return dp[n];
}
```

### 2. 最长公共子序列

```typescript
function lcs(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
}
```

### 3. 背包问题

```typescript
function knapSack(capacity: number, weights: number[], values: number[]): number {
  const n = weights.length;
  const dp = Array(n + 1)
    .fill(null)
    .map(() => Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      if (weights[i - 1] <= w) {
        dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - weights[i - 1]] + values[i - 1]);
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  return dp[n][capacity];
}
```

## 时间/空间复杂度

| 问题     | 时间复杂度 | 空间复杂度  |
| -------- | ---------- | ----------- |
| 斐波那契 | O(n)       | O(n) → O(1) |
| LCS      | O(mn)      | O(mn)       |
| 背包     | O(nW)      | O(nW)       |

**为什么选择**：动态规划是解决最优解问题的神器，是算法面试必考内容。

## 使用边界

**何时不用：**

- 无重叠子问题：分治即可解决
- 问题规模小：暴力搜索可能更快
- 无法找到状态转移：DP 不适用

**注意事项：**

- 状态定义：状态定义是 DP 最难点
- 空间优化：很多 DP 可用滚动数组优化到 O(1)
- 初始化：注意 base case 和边界
- 遍历顺序：依赖前面的要正序，后面的要逆序

**面试常考点：**

- DP vs 贪心 vs 分治对比
- DP 状态定义方法
- DP 空间优化（滚动数组）
- 常见 DP 模型（背包、编辑距离、LIS、LCS）
- DP 优化（单调队列、斜率优化）
