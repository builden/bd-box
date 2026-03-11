# Trie（前缀树）

## 一句话定义

专门处理字符串前缀的树形结构，又称前缀树。

## 为什么好

**优点：**

- 前缀查询 O(m)，m 为字符串长度
- 空间换时间
- 适合自动补全

**缺点：**

- 内存开销大
- 只适合字符串

## 适用场景

- **字符串检索**：前缀匹配
- **自动补全**：搜索建议
- **IP 路由**：最长前缀匹配
- **敏感词过滤**：多模式匹配

## 代码实现

```typescript
class Trie {
  private root: TrieNode;
  private endChar = "*";

  constructor() {
    this.root = new TrieNode();
  }

  insert(word: string): void {
    let node = this.root;
    for (const char of word) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEnd = true;
  }

  search(word: string): boolean {
    const node = this.traverse(word);
    return node?.isEnd ?? false;
  }

  startsWith(prefix: string): boolean {
    return this.traverse(prefix) !== null;
  }

  autocomplete(prefix: string): string[] {
    const results: string[] = [];
    const node = this.traverse(prefix);
    if (!node) return results;
    this.collectWords(node, prefix, results);
    return results;
  }

  private traverse(prefix: string): TrieNode | null {
    let node = this.root;
    for (const char of prefix) {
      if (!node.children[char]) return null;
      node = node.children[char];
    }
    return node;
  }

  private collectWords(node: TrieNode, prefix: string, results: string[]): void {
    if (node.isEnd) results.push(prefix);

    for (const [char, child] of Object.entries(node.children)) {
      this.collectWords(child, prefix + char, results);
    }
  }
}

class TrieNode {
  children: Record<string, TrieNode> = {};
  isEnd = false;
}
```

## 时间/空间复杂度

| 操作     | 时间复杂度 |
| -------- | ---------- |
| 插入     | O(m)       |
| 查找     | O(m)       |
| 前缀匹配 | O(m + k)   |

注：m = 字符串长度，k = 结果数量

## 经典应用案例

- **搜索框自动补全**：Google 搜索建议
- **IP 路由**：最长前缀匹配
- **敏感词过滤**：多模式匹配
- **T9 输入法**：九键拼音输入

**为什么选择**：Trie 是字符串前缀问题的标准解法，完美适配自动补全场景。

## 使用边界

**何时不用：**

- 单次查询：简单哈希表即可
- 字符串极长：压缩前缀树（PATRICIA）更适合
- 内存敏感：内存开销大

**注意事项：**

- 字符集大小：中文字符集大，内存开销大，考虑双数组 Trie
- 插入顺序：影响树结构，影响缓存命中
- 删除操作：需要标记节点何时真正删除

**面试常考点：**

- Trie 查找/插入复杂度分析
- Trie vs 哈希表对比
- 前缀树在自动补全中的应用
- PATRICIA / 双数组 Trie 原理
