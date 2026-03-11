# Top-K 问题

## 一句话定义

从海量数据中找出最大/最小的 K 个元素。

## 常见解法

| 方法     | 时间复杂度 | 空间复杂度 | 适用场景 |
| -------- | ---------- | ---------- | -------- |
| 排序     | O(n log n) | O(n)       | 小数据量 |
| 堆       | O(n log k) | O(k)       | 大数据流 |
| 快排变形 | O(n)       | O(n)       | 选 top-k |

## 代码实现

### 1. 堆解法（最常用）

```typescript
// 最大堆
class MaxHeap {
  private heap: number[] = [];

  push(val: number): void {
    this.heap.push(val);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): number | undefined {
    if (this.heap.length === 0) return undefined;
    const max = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return max;
  }

  size(): number {
    return this.heap.length;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent] >= this.heap[i]) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  private bubbleDown(i: number): void {
    while (true) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      let largest = i;

      if (left < this.heap.length && this.heap[left] > this.heap[largest]) {
        largest = left;
      }
      if (right < this.heap.length && this.heap[right] > this.heap[largest]) {
        largest = right;
      }
      if (largest === i) break;

      [this.heap[i], this.heap[largest]] = [this.heap[largest], this.heap[i]];
      i = largest;
    }
  }
}

function findKthLargest(nums: number[], k: number): number {
  const heap = new MaxHeap();

  for (const num of nums) {
    heap.push(num);
    if (heap.size() > k) {
      heap.pop();
    }
  }

  return heap.pop()!;
}
```

### 2. 快排变形

```typescript
function findKthLargestQuick(nums: number[], k: number): number {
  const target = nums.length - k;

  function quickSelect(left: number, right: number): number {
    const pivot = nums[right];
    let p = left;

    for (let i = left; i < right; i++) {
      if (nums[i] <= pivot) {
        [nums[i], nums[p]] = [nums[p], nums[i]];
        p++;
      }
    }
    [nums[p], nums[right]] = [nums[right], nums[p]];

    if (p === target) return nums[p];
    if (p < target) return quickSelect(p + 1, right);
    return quickSelect(left, p - 1);
  }

  return quickSelect(0, nums.length - 1);
}
```

### 3. 分布式 Top-K

```typescript
// MapReduce 风格
interface MapReduceTopK {
  map(data: number[]): Map<number, number>;
  reduce(chunks: Map<number, number>[], k: number): number[];
}

function distributedTopK(dataChunks: number[][], k: number): number[] {
  // 1. 本地 Top-K
  const localTopKs = dataChunks.map((chunk) => {
    const heap = new MaxHeap();
    for (const num of chunk) {
      heap.push(num);
      if (heap.size() > k) heap.pop();
    }
    return [...heap.heap];
  });

  // 2. 合并
  const heap = new MaxHeap();
  for (const local of localTopKs) {
    for (const num of local) {
      heap.push(num);
      if (heap.size() > k) heap.pop();
    }
  }

  const result: number[] = [];
  while (heap.size() > 0) {
    result.push(heap.pop()!);
  }
  return result;
}
```

## 时间/空间复杂度

| 方法     | 时间复杂度 | 空间复杂度 | 特点      |
| -------- | ---------- | ---------- | --------- |
| 排序     | O(n log n) | O(n)       | 简单      |
| 堆       | O(n log k) | O(k)       | 最常用    |
| 快排变形 | O(n)       | O(n)       | 找第 k 大 |
| 计数排序 | O(n + m)   | O(m)       | 小范围    |

## 经典应用案例

- **推荐系统**：热门商品/内容
- **排行榜**：游戏排名
- **日志分析**：Top 错误
- **大数据处理**：MapReduce Top-K

## 使用边界

**何时不用：**

- 数据量小：直接排序更简单
- 需要全排序：不如一次性排
- K 接近 n：排序更快

**注意事项：**

- 堆 vs 快选：堆适合流式，快选适合一次性
- 浮点数：需要特殊处理
- 多维：需要按维度排序
- 分布式：数据分片、结果合并

**面试常考点：**

- Top-K 解法对比
- 堆的实现
- 海量数据 Top-K
- 分布式 Top-K
- 堆排序 vs 快速排序

**为什么选择**：Top-K 是面试和工程中的高频问题，多种解法体现对算法的理解深度。
