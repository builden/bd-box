# 队列

## 一句话定义

先进先出（FIFO）的线性数据结构。

## 为什么好

**优点：**

- 顺序保证
- 操作 O(1)
- 实现简单

**缺点：**

- 只能访问队首
- 无随机访问

## 适用场景

- 任务调度
- 广度优先搜索
- 消息队列
- 缓冲区

## 代码实现

```typescript
class Queue<T> {
  private items: T[] = [];
  private head: number = 0;

  enqueue(item: T): void {
    this.items.push(item);
  }

  dequeue(): T | undefined {
    if (this.isEmpty()) return undefined;
    const item = this.items[this.head];
    this.head++;
    // 定期压缩
    if (this.head > this.items.length / 2) {
      this.items = this.items.slice(this.head);
      this.head = 0;
    }
    return item;
  }

  peek(): T | undefined {
    return this.items[this.head];
  }

  isEmpty(): boolean {
    return this.head >= this.items.length;
  }

  size(): number {
    return this.items.length - this.head;
  }
}

// 双端队列
class Deque<T> {
  private items: T[] = [];

  addFront(item: T): void {
    this.items.unshift(item);
  }
  addBack(item: T): void {
    this.items.push(item);
  }
  removeFront(): T | undefined {
    return this.items.shift();
  }
  removeBack(): T | undefined {
    return this.items.pop();
  }
}
```

## 时间复杂度

| 操作    | 时间复杂度 |
| ------- | ---------- |
| enqueue | O(1)       |
| dequeue | O(1)       |
| peek    | O(1)       |

## 经典应用

- **消息队列**：Kafka、RabbitMQ
- **BFS 遍历**：图算法
- **任务调度**：线程池
- **滑动窗口**：单调队列

## 使用边界

**何时不用：**

- 需要随机访问元素：队列只支持队首操作
- 需要优先级的任务：应使用优先队列（堆）
- 需要 LIFO 顺序：应使用栈

**注意事项：**

- 循环队列可避免假溢出
- 阻塞队列用于生产者-消费者模式
- 队列满/空的处理策略

**面试常考点：**

- 用栈实现队列 / 用队列实现栈
- 循环队列设计
- 单调队列（滑动窗口最大值）

**为什么选择**：队列是处理顺序任务的核心结构，消息队列是现代架构的基础组件。
