# 栈

## 一句话定义

后进先出（LIFO）的线性数据结构。

## 为什么好

**优点：**

- 实现简单
- 操作 O(1)
- 递归的替代

**缺点：**

- 只能访问栈顶
- 无遍历功能

## 适用场景

- 函数调用栈
- 表达式求值
- 括号匹配
- 深度优先搜索

## 代码实现

```typescript
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }
}

// 表达式求值
function evaluatePostfix(expr: string): number {
  const stack = new Stack<number>();
  const tokens = expr.split(" ");

  for (const token of tokens) {
    if (!isNaN(Number(token))) {
      stack.push(Number(token));
    } else {
      const b = stack.pop()!;
      const a = stack.pop()!;
      switch (token) {
        case "+":
          stack.push(a + b);
          break;
        case "-":
          stack.push(a - b);
          break;
        case "*":
          stack.push(a * b);
          break;
        case "/":
          stack.push(Math.trunc(a / b));
          break;
      }
    }
  }
  return stack.pop()!;
}
```

## 时间复杂度

| 操作 | 时间复杂度 |
| ---- | ---------- |
| push | O(1)       |
| pop  | O(1)       |
| peek | O(1)       |

## 经典应用

- **浏览器后退**：历史记录
- **编辑器撤销**：操作栈
- **递归调用**：函数栈帧
- **算法竞赛**：基础结构

## 使用边界

**何时不用：**

- 需要访问非栈顶元素：栈只能 LIFO
- 需要FIFO顺序：应使用队列
- 需要随机访问：应使用数组

**注意事项：**

- 递归深度过大可能导致栈溢出
- 栈空间有限，需要注意内存
- 溢出检查很重要

**面试常考点：**

- 括号匹配（有效括号）
- 表达式求值（中缀→后缀）
- 栈溢出和内存管理
- 用队列实现栈

**为什么选择**：栈是计算机科学最基础的结构之一，无处不在。
