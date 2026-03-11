---
name: data-structures-algorithms
description: 数据结构和算法指南。选择合适的数据结构/算法，理解优缺点、适用场景、使用边界，以及在各优秀应用中的实践。涵盖 6 大领域：缓存、数据库、计算、AI、游戏、系统设计。
---

# 数据结构和算法 Skill

本 skill 帮助开发者选择合适的数据结构和算法，理解为什么好，什么场景适用，什么时候不该用。

## 触发场景

- "用什么数据结构好"
- "这个场景用什么算法"
- "想优化性能"
- 提及具体数据结构名（数组、链表、LRU、B+树等）
- 提及具体算法名（快排、动态规划、A\*等）
- 提及具体应用（Redis、MySQL、MongoDB 等）

## 快速导航

[知识索引](references/catalog.md)

## 文档分类

### 按领域分类

- [缓存应用](references/cache/)：LRU、LFU、布隆过滤器
- [关系型数据库](references/database/relational/)：B+树
- [NoSQL 数据库](references/database/nosql/)：LSM树、跳表、B树
- [分布式数据库](references/database/distributed/)：一致性哈希、Gossip、Raft
- [计算应用](references/computation/)：数组、链表、栈、队列、哈希表、树、堆、图、排序、搜索
- [AI 应用](references/ai/)：向量检索、KD树、HNSW、Trie
- [游戏应用](references/game/)：四叉树、八叉树、A\*、对象池、ECS
- [系统设计](references/system/)：令牌桶、漏桶

## 文档结构

每个数据结构/算法包含：

- 一句话定义
- 为什么好（优缺点）
- 适用场景
- TypeScript 代码实现
- 时间/空间复杂度
- 使用边界/注意事项
- 经典应用案例（产品 + 为什么选择）

## 参考资料

- 王争《数据结构与算法之美》
- 开源项目源码（Redis、MySQL、Linux Kernel）
- LeetCode 算法题解
