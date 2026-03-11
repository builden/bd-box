# 二叉树

## 一句话定义

每个节点最多有两个子节点的树形结构。

## 为什么好

**优点：**

- 结构简单
- 容易实现
- 便于递归操作

**缺点：**

- 查找效率依赖平衡性
- 可能退化成链表

## 适用场景

- 基础树结构
- 二分搜索
- 表达式解析
- 堆的实现

## 基本结构

```typescript
class TreeNode<T> {
  val: T;
  left: TreeNode<T> | null = null;
  right: TreeNode<T> | null = null;

  constructor(val: T) {
    this.val = val;
  }
}
```

## 遍历方式

```typescript
// 前序遍历：根 → 左 → 右
function preorder<T>(root: TreeNode<T> | null): T[] {
  if (!root) return [];
  return [root.val, ...preorder(root.left), ...preorder(root.right)];
}

// 中序遍历：左 → 根 → 右
function inorder<T>(root: TreeNode<T> | null): T[] {
  if (!root) return [];
  return [...inorder(root.left), root.val, ...inorder(root.right)];
}

// 后序遍历：左 → 右 → 根
function postorder<T>(root: TreeNode<T> | null): T[] {
  if (!root) return [];
  return [...postorder(root.left), ...postorder(root.right), root.val];
}

// 层序遍历
function levelOrder<T>(root: TreeNode<T> | null): T[][] {
  if (!root) return [];
  const result: T[][] = [];
  const queue: TreeNode<T>[] = [root];

  while (queue.length) {
    const level: T[] = [];
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const node = queue.shift()!;
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
}
```

## 常见操作

| 操作 | 复杂度 |
| ---- | ------ |
| 查找 | O(n)   |
| 插入 | O(n)   |
| 删除 | O(n)   |
| 遍历 | O(n)   |

## 经典应用

- **表达式树**：编译器语法分析
- **堆**：完全二叉树实现
- **哈夫曼树**：数据压缩

**为什么选择**：二叉树是理解更复杂树结构的基础，面试常考二叉树遍历和操作。
