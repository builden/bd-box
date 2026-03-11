# 双端队列

## 一句话定义

可以在两端 O(1) 插入和删除的队列。

## 为什么好

**优点：**

- 两端操作 O(1)
- 可以模拟栈和队列
- 滑动窗口神器

**缺点：**

- 随机访问效率低
- 实现比普通队列复杂

## 适用场景

- **滑动窗口**：最大值/最小值问题
- **单调队列**：单调栈的队列版本
- **双向工作池**：既可以做队列也可以做栈

## 代码实现

```typescript
class Deque<T> {
  private front: ListNode<T> | null = null;
  private rear: ListNode<T> | null = null;
  private size: number = 0;

  pushFront(val: T): void {
    const node = new ListNode(val);
    if (!this.front) {
      this.front = node;
      this.rear = node;
    } else {
      node.next = this.front;
      this.front.prev = node;
      this.front = node;
    }
    this.size++;
  }

  pushBack(val: T): void {
    const node = new ListNode(val);
    if (!this.rear) {
      this.front = node;
      this.rear = node;
    } else {
      node.prev = this.rear;
      this.rear.next = node;
      this.rear = node;
    }
    this.size++;
  }

  popFront(): T | undefined {
    if (!this.front) return undefined;
    const val = this.front.val;
    this.front = this.front.next;
    if (this.front) this.front.prev = null;
    else this.rear = null;
    this.size--;
    return val;
  }

  popBack(): T | undefined {
    if (!this.rear) return undefined;
    const val = this.rear.val;
    this.rear = this.rear.prev;
    if (this.rear) this.rear.next = null;
    else this.front = null;
    this.size--;
    return val;
  }

  frontVal(): T | undefined {
    return this.front?.val;
  }

  rearVal(): T | undefined {
    return this.rear?.val;
  }

  getSize(): number {
    return this.size;
  }

  isEmpty(): boolean {
    return this.size === 0;
  }
}

class ListNode<T> {
  val: T;
  next: ListNode<T> | null = null;
  prev: ListNode<T> | null = null;

  constructor(val: T) {
    this.val = val;
  }
}

// 滑动窗口最大值
function maxSlidingWindow(nums: number[], k: number): number[] {
  const result: number[] = [];
  const deque = new Deque<number>();

  for (let i = 0; i < nums.length; i++) {
    // 移除窗口外的元素
    if (!deque.isEmpty() && deque.frontVal()! <= i - k) {
      deque.popFront();
    }

    // 保持递减队列
    while (!deque.isEmpty() && nums[deque.rearVal()!] <= nums[i]) {
      deque.popBack();
    }

    deque.pushBack(i);

    // 窗口形成后开始记录
    if (i >= k - 1) {
      result.push(nums[deque.frontVal()!]);
    }
  }

  return result;
}
```

## 时间/空间复杂度

| 操作      | 时间复杂度 | 空间复杂度 |
| --------- | ---------- | ---------- |
| pushFront | O(1)       | -          |
| pushBack  | O(1)       | -          |
| popFront  | O(1)       | -          |
| popBack   | O(1)       | -          |

## 经典应用案例

- **滑动窗口**：LeetCode 滑动窗口最大值
- **单调队列**：银行排队问题
- **双向任务调度**：双端工作池

## 使用边界

**何时不用：**

- 单端操作：普通队列/栈足够
- 随机访问：数组更好
- 简单 FIFO：普通队列

**注意事项：**

- 边界检查：空队列操作要处理
- 内存管理：注意节点回收
- 与数组对比：数组实现双端队列也很快

**面试常考点：**

- 双端队列 vs 普通队列
- 滑动窗口最大值（单调队列）
- 队列实现栈/栈实现队列
- 线程安全的双端队列

**为什么选择**：双端队列是滑动窗口问题的标准解法，单调队列让 O(n) 解法成为可能。
