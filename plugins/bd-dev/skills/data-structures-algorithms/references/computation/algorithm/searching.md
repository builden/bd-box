# 搜索算法

## 概述

在数据集中查找目标元素。

## 分类

| 算法     | 时间复杂度   | 适用场景         |
| -------- | ------------ | ---------------- |
| 线性搜索 | O(n)         | 无序数据         |
| 二分搜索 | O(log n)     | 有序数据         |
| 插值搜索 | O(log log n) | 均匀分布有序数据 |
| 指数搜索 | O(log n)     | 无界数组         |
| 哈希搜索 | O(1)         | 哈希表           |

## 二分搜索

```typescript
function binarySearch<T>(arr: T[], target: T, compare: (a: T, b: T) => number): number {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const cmp = compare(arr[mid], target);

    if (cmp === 0) return mid;
    if (cmp < 0) left = mid + 1;
    else right = mid - 1;
  }

  return -1;
}

// 变体：找左边界
function lowerBound<T>(arr: T[], target: T, compare: (a: T, b: T) => number): number {
  let left = 0;
  let right = arr.length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (compare(arr[mid], target) < 0) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  return left;
}

// 变体：找右边界
function upperBound<T>(arr: T[], target: T, compare: (a: T, b: T) => number): number {
  let left = 0;
  let right = arr.length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (compare(arr[mid], target) <= 0) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  return left;
}
```

## 搜索旋转数组

```typescript
function searchRotated(arr: number[], target: number): number {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) return mid;

    // 左边有序
    if (arr[left] <= arr[mid]) {
      if (target >= arr[left] && target < arr[mid]) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    } else {
      // 右边有序
      if (target > arr[mid] && target <= arr[right]) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
  }

  return -1;
}
```

## 二分搜索变体

| 场景             | 方法                            |
| ---------------- | ------------------------------- |
| 找第一次出现     | lowerBound                      |
| 找最后一次出现   | upperBound - 1                  |
| 找旋转数组最小值 | 二分比较 arr[mid] 和 arr[right] |
| 找峰值元素       | 比较 arr[mid] 和 arr[mid+1]     |

**为什么选择**：二分搜索是最重要的搜索算法，必须掌握。

## 使用边界

**何时不用：**

- 无序数据：先排序或用哈希
- 数据量小：线性搜索常数更小
- 频繁插入删除：维护有序数组成本高

**注意事项：**

- 边界条件：left <= right 还是 left < right
- 整数溢出：使用 left + (right - left) / 2
- 有序性：数据必须有序
- 旋转数组：先判断哪边有序

**面试常考点：**

- 二分搜索变体（左边界、右边界）
- 旋转数组搜索
- 搜索插入位置
- 搜索峰值元素
- 二分搜索 vs 哈希搜索
- 为什么二分比 O(n) 快
