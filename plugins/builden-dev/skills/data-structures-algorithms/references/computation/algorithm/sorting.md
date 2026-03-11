# 排序算法

## 概述

将一组数据按特定顺序排列。

## 分类

| 类别       | 算法     | 时间复杂度 | 空间复杂度 | 稳定性 |
| ---------- | -------- | ---------- | ---------- | ------ |
| O(n²)      | 冒泡排序 | O(n²)      | O(1)       | 稳定   |
| O(n²)      | 选择排序 | O(n²)      | O(1)       | 不稳定 |
| O(n²)      | 插入排序 | O(n²)      | O(1)       | 稳定   |
| O(n log n) | 归并排序 | O(n log n) | O(n)       | 稳定   |
| O(n log n) | 快速排序 | O(n log n) | O(log n)   | 不稳定 |
| O(n log n) | 堆排序   | O(n log n) | O(1)       | 不稳定 |
| O(n + k)   | 桶排序   | O(n + k)   | O(n + k)   | 稳定   |
| O(n + k)   | 计数排序 | O(n + k)   | O(k)       | 稳定   |
| O(nk)      | 基数排序 | O(nk)      | O(n + k)   | 稳定   |

## 快速排序

```typescript
function quickSort<T>(arr: T[], compare: (a: T, b: T) => number): T[] {
  if (arr.length <= 1) return arr;

  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter((x) => compare(x, pivot) < 0);
  const middle = arr.filter((x) => compare(x, pivot) === 0);
  const right = arr.filter((x) => compare(x, pivot) > 0);

  return [...quickSort(left, compare), ...middle, ...quickSort(right, compare)];
}
```

## 归并排序

```typescript
function mergeSort<T>(arr: T[], compare: (a: T, b: T) => number): T[] {
  if (arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid), compare);
  const right = mergeSort(arr.slice(mid), compare);

  return merge(left, right, compare);
}

function merge<T>(a: T[], b: T[], compare: (a: T, b: T) => number): T[] {
  const result: T[] = [];
  let i = 0,
    j = 0;

  while (i < a.length && j < b.length) {
    if (compare(a[i], b[j]) <= 0) {
      result.push(a[i++]);
    } else {
      result.push(b[j++]);
    }
  }

  return result.concat(a.slice(i)).concat(b.slice(j));
}
```

## 堆排序

```typescript
function heapSort<T>(arr: T[], compare: (a: T, b: T) => number): T[] {
  const heap = new MinHeap<T>((a, b) => compare(a, b));

  for (const item of arr) {
    heap.insert(item);
  }

  const result: T[] = [];
  while (heap.size() > 0) {
    result.push(heap.extract()!);
  }

  return result;
}
```

## 适用场景

- **小数据量**：插入排序 O(n²) 但常数小
- **大规模数据**：快速排序、归并排序
- **稳定排序**：归并排序
- **整数排序**：计数排序、桶排序、基数排序

**为什么选择**：没有最好的排序算法，只有最适合的。根据数据规模和特性选择。

## 使用边界

**何时不用：**

- 数据已基本有序：插入排序最优
- 数据量极小（<10）：简单 O(n²) 算法更快
- 浮点数排序：桶排序需要注意分布

**注意事项：**

- 快速排序最坏情况：选取好的 pivot（三数取中、随机）
- 归并排序空间：可以原地归并但复杂
- 稳定排序需求：基数排序是唯一 O(n) 稳定排序
- 外部排序：大数据量需要分块

**面试常考点：**

- 各排序算法时间/空间复杂度
- 快速排序优化
- 归并排序 vs 快速排序对比
- 稳定排序有哪些
- Top-K 问题解法
- 外部排序
