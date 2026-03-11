# 堆

## 一句话定义

完全二叉树结构，每个节点满足堆属性（大根堆/小根堆）。

## 为什么好

**优点：**

- 插入删除 O(log n)
- 获取最值 O(1)
- 空间效率高

**缺点：**

- 无法快速查找任意元素
- 无法遍历有序

## 适用场景

- **优先级队列**：任务调度
- **top-k 问题**：求最大/最小的 k 个元素
- **堆排序**：O(n log n) 排序
- **合并有序文件**：多路归并

## 代码实现

```typescript
class MinHeap<T> {
  private data: T[] = [];
  private compare: (a: T, b: T) => number;

  constructor(compare?: (a: T, b: T) => number) {
    this.compare = compare || ((a: any, b: any) => a - b);
  }

  insert(value: T): void {
    this.data.push(value);
    this.bubbleUp(this.data.length - 1);
  }

  extract(): T | undefined {
    if (this.data.length === 0) return undefined;

    const min = this.data[0];
    const last = this.data.pop()!;

    if (this.data.length > 0) {
      this.data[0] = last;
      this.bubbleDown(0);
    }

    return min;
  }

  peek(): T | undefined {
    return this.data[0];
  }

  size(): number {
    return this.data.length;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compare(this.data[index], this.data[parentIndex]) >= 0) break;
      [this.data[index], this.data[parentIndex]] = [this.data[parentIndex], this.data[index]];
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    const length = this.data.length;

    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;

      if (leftChild < length && this.compare(this.data[leftChild], this.data[smallest]) < 0) {
        smallest = leftChild;
      }

      if (rightChild < length && this.compare(this.data[rightChild], this.data[smallest]) < 0) {
        smallest = rightChild;
      }

      if (smallest === index) break;

      [this.data[index], this.data[smallest]] = [this.data[smallest], this.data[index]];
      index = smallest;
    }
  }
}

// top-k 问题
function topK<T>(arr: T[], k: number, compare: (a: T, b: T) => number): T[] {
  const heap = new MinHeap(compare);

  for (const item of arr) {
    if (heap.size() < k) {
      heap.insert(item);
    } else if (compare(item, heap.peek()!) > 0) {
      heap.extract();
      heap.insert(item);
    }
  }

  return Array.from({ length: k }, () => heap.extract()!);
}
```

## 时间/空间复杂度

| 操作     | 时间复杂度 |
| -------- | ---------- |
| 插入     | O(log n)   |
| 提取     | O(log n)   |
| 获取最值 | O(1)       |

## 经典应用案例

- **PriorityQueue**：Java/C++ 优先级队列
- **Redis ZSet**：有序集合底层
- **Dijkstra**：最短路径算法
- **Huffman**：哈夫曼编码

## 使用边界

**何时不用：**

- 需要快速查找任意元素：堆只能访问最值
- 需要有序遍历：堆不是有序的
- 需要同时获取最大和最小：需要两个堆

**注意事项：**

- 堆化操作时间复杂度 O(n)
- 堆不支持快速合并
- 堆是完全二叉树，适合数组存储

**面试常考点：**

- top-k 问题的两种解法（堆 vs 快速选择）
- 合并 k 个有序数组
- 中位数维护（大小堆）

**为什么选择**：堆是实现优先级队列的最佳选择，top-k 问题的标准解法。
