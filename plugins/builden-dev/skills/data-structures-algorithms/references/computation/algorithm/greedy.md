# 贪心算法

## 一句话定义

每步选择当前最优，期望获得全局最优。

## 核心思想

```
局部最优 → 全局最优
```

## 为什么好

**优点：**

- 简单高效
- 时间复杂度低
- 易于实现

**缺点：**

- 不保证最优
- 需要证明正确性

## 适用场景

- **最优子结构 + 无后效性**：局部最优 = 全局最优
- **活动安排**：区间调度
- **哈夫曼编码**：最优前缀码
- **最小生成树**：Prim、Kruskal

## 经典案例

### 1. 活动选择问题

```typescript
interface Activity {
  start: number;
  end: number;
}

function activitySelection(activities: Activity[]): number {
  // 按结束时间排序
  activities.sort((a, b) => a.end - b.end);

  let count = 1;
  let lastEnd = activities[0].end;

  for (let i = 1; i < activities.length; i++) {
    if (activities[i].start >= lastEnd) {
      count++;
      lastEnd = activities[i].end;
    }
  }

  return count;
}
```

### 2. 哈夫曼编码

```typescript
class Huffman {
  buildFrequency(str: string): Map<string, number> {
    const freq = new Map();
    for (const char of str) {
      freq.set(char, (freq.get(char) || 0) + 1);
    }
    return freq;
  }

  encode(freq: Map<string, number>): Map<string, string> {
    const heap = new MinHeap<{ char: string; freq: number }>((a, b) => a.freq - b.freq);

    for (const [char, f] of freq) {
      heap.insert({ char, freq: f });
    }

    while (heap.size() > 1) {
      const left = heap.extract()!;
      const right = heap.extract()!;

      heap.insert({
        char: left.char + right.char,
        freq: left.freq + right.freq,
      });
    }

    return this.buildCodes(heap.extract()!);
  }

  private buildCodes(node: any, prefix = ""): Map<string, string> {
    const codes = new Map();
    if (node.char.length === 1) {
      codes.set(node.char, prefix || "0");
    } else {
      codes.setAll(this.buildCodes({ char: node.char[0], freq: 0 }, prefix + "0"));
      codes.setAll(this.buildCodes({ char: node.char.slice(1), freq: 0 }, prefix + "1"));
    }
    return codes;
  }
}
```

### 3. 找零钱

```typescript
function coinChange(coins: number[], amount: number): number {
  // 假设 coins 已按面额排序（大到小）
  coins.sort((a, b) => b - a);

  let count = 0;
  let remaining = amount;

  for (const coin of coins) {
    const num = Math.floor(remaining / coin);
    count += num;
    remaining -= num * coin;
  }

  return remaining === 0 ? count : -1;
}
```

## 贪心 vs 动态规划

| 特性       | 贪心      | 动态规划   |
| ---------- | --------- | ---------- |
| 最优性     | 不保证    | 保证       |
| 时间复杂度 | 通常 O(n) | 通常 O(n²) |
| 适用条件   | 无后效性  | 重叠子问题 |

**为什么选择**：贪心是面试常考内容，很多问题可以用贪心快速解决。

## 使用边界

**何时不用：**

- 无最优子结构：贪心不能保证最优
- 需要全局最优：贪心可能陷入局部最优
- 问题复杂：需要 DP

**注意事项：**

- 正确性证明：贪心需要证明，不能随意使用
- 反例思考：多考虑边界情况
- 排序是关键：很多贪心问题先排序就成功了一半
- 权衡：贪心牺牲最优性换取速度

**面试常考点：**

- 贪心 vs DP 对比
- 常见贪心问题（区间调度、哈夫曼、最小生成树）
- 贪心正确性证明方法
- 活动选择问题
- 背包问题的贪心解（分数背包）
