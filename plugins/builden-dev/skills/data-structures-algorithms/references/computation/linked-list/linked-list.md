# 链表

## 一句话定义

通过指针串联的节点序列，支持 O(1) 插入删除。

## 为什么好

**优点：**

- 插入删除 O(1)
- 动态大小
- 内存利用率高

**缺点：**

- 随机访问 O(n)
- 内存开销大（指针）
- 缓存不友好

## 适用场景

- 频繁插入删除
- 大小未知
- 内存碎片

## 代码实现

```typescript
class ListNode<T> {
  val: T;
  next: ListNode<T> | null = null;

  constructor(val: T) {
    this.val = val;
  }
}

class LinkedList<T> {
  head: ListNode<T> | null = null;
  tail: ListNode<T> | null = null;
  length: number = 0;

  append(val: T): void {
    const node = new ListNode(val);
    if (!this.tail) {
      this.head = this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }
    this.length++;
  }

  prepend(val: T): void {
    const node = new ListNode(val);
    node.next = this.head;
    this.head = node;
    if (!this.tail) this.tail = node;
    this.length++;
  }

  delete(val: T): boolean {
    if (!this.head) return false;

    if (this.head.val === val) {
      this.head = this.head.next;
      this.length--;
      return true;
    }

    let curr = this.head;
    while (curr.next) {
      if (curr.next.val === val) {
        curr.next = curr.next.next;
        this.length--;
        return true;
      }
      curr = curr.next;
    }
    return false;
  }
}
```

## 时间复杂度

| 操作   | 时间复杂度 |
| ------ | ---------- |
| 访问   | O(n)       |
| 搜索   | O(n)       |
| 头部插 | O(1)       |
| 尾部插 | O(1)       |
| 删除   | O(n)       |

## 经典应用

- **LRU 缓存**：双向链表
- **文件系统**：Linked List FCB
- **HashMap**：链式解决冲突

## 使用边界

**何时不用：**

- 频繁随机访问：数组 O(1) 更快
- 内存敏感：每个节点有额外指针开销
- 需要缓存友好：链表跳转破坏缓存局部性

**注意事项：**

- 双向链表可支持 O(1) 删除（需要 prev 指针）
- 注意内存泄漏（循环引用）
- 头尾操作需要特殊处理

**面试常考点：**

- 反转链表（递归 vs 迭代）
- 合并有序链表
- 链表检测环（快慢指针）
- 链表相交检测

**为什么选择**：链表是基础数据结构，是理解更复杂结构（如树、图）的基础。
