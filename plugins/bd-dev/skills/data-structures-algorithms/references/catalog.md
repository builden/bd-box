# 数据结构和算法知识索引

## 快速选择表

| 你的需求       | 推荐数据结构/算法                                                                     |
| -------------- | ------------------------------------------------------------------------------------- |
| 缓存淘汰策略   | [LRU](cache/lru.md)、[LFU](cache/lfu.md)                                              |
| 去重/判断存在  | [布隆过滤器](cache/bloom-filter.md)                                                   |
| 高效范围查询   | [B+树](database/relational/b-plus-tree.md)                                            |
| 写入密集型存储 | [LSM树](database/columnar/lsm-tree.md)                                                |
| 有序kv存取     | [跳表](database/kv/skip-list.md)                                                      |
| 快速查找       | [哈希表](computation/hash-table/hash-table.md)、[二叉搜索树](computation/tree/bst.md) |
| 有序数据存储   | [AVL树](computation/tree/avl-tree.md)、[红黑树](computation/tree/red-black-tree.md)   |
| 2D空间查询     | [四叉树](game/quadtree.md)                                                            |
| 3D空间查询     | [八叉树](game/octree.md)                                                              |
| 寻路           | [A\*算法](game/a-star.md)                                                             |
| 限流           | [令牌桶](system/token-bucket.md)、[漏桶](system/leaky-bucket.md)                      |
| 分布式节点     | [一致性哈希](system/consistent-hash.md)                                               |
| 向量相似度检索 | [HNSW](ai/vector-search/hnsw.md)、[KD树](ai/vector-search/kd-tree.md)                 |

---

## 视角一：数据库类型 → 使用的算法 → 产品

### 关系型数据库

> **定义**：以表格形式存储，支持 SQL，事务 ACID

**代表产品：**

- MySQL（最流行）
- PostgreSQL（功能最强大）
- SQLite（嵌入式）
- Oracle（商业）
- SQL Server（微软）

| 核心数据结构/算法                          | 用途               |
| ------------------------------------------ | ------------------ |
| [B+树](database/relational/b-plus-tree.md) | 主键索引、范围查询 |
| 哈希索引                                   | 等值查询           |
| R-Tree                                     | 空间索引           |

### KV 存储

> **定义**：键值对存储，高性能，简单模型

**代表产品：**

- Redis（内存 + 持久化）
- Memcached（纯内存）
- etcd（分布式一致性）
- RocksDB（嵌入式）

| 核心数据结构/算法                              | 用途                |
| ---------------------------------------------- | ------------------- |
| [跳表](database/kv/skip-list.md)               | Sorted Set 有序集合 |
| [LRU](cache/lru.md) / [LFU](cache/lfu.md)      | 内存淘汰策略        |
| [哈希表](computation/hash-table/hash-table.md) | Hash 类型           |
| [B+树](database/relational/b-plus-tree.md)     | 持久化索引          |

### 文档数据库

> **定义**：JSON/XML 文档存储，无 Schema，灵活

**代表产品：**

- MongoDB（最流行）
- CouchDB
- Elasticsearch（分布式搜索）

| 核心数据结构/算法                  | 用途     |
| ---------------------------------- | -------- |
| [B树](database/document/b-tree.md) | 文档索引 |
| [跳表](database/kv/skip-list.md)   | 内存索引 |
| 倒排索引                           | 全文搜索 |

### 列式数据库

> **定义**：按列存储，压缩率高，分析查询快

**代表产品：**

- ClickHouse（OLAP 实时分析）
- Apache Druid（时序分析）
- Cassandra（分布式写入）
- HBase（Hadoop 生态）

| 核心数据结构/算法                      | 用途              |
| -------------------------------------- | ----------------- |
| [LSM树](database/columnar/lsm-tree.md) | 写入优化          |
| [布隆过滤器](cache/bloom-filter.md)    | 数据去重/快速判断 |
| 位图索引                               | 低基数列查询      |

### 图数据库

> **定义**：专门处理图关系，节点和边

**代表产品：**

- Neo4j（最流行）
- JanusGraph
- Amazon Neptune

| 核心数据结构/算法 | 用途     |
| ----------------- | -------- |
| 邻接表            | 图遍历   |
| B+树              | 属性索引 |

### 向量数据库

> **定义**：存储高维向量，支持相似度检索

**代表产品：**

- Pinecone（云服务）
- Milvus（开源）
- Weaviate（开源）
- Qdrant（开源）

| 核心数据结构/算法                   | 用途           |
| ----------------------------------- | -------------- |
| [HNSW](ai/vector-search/hnsw.md)    | 向量近似检索   |
| [KD树](ai/vector-search/kd-tree.md) | 低维向量最近邻 |
| 倒排索引                            | 混合检索       |

### 时序数据库

> **定义**：专门存储时序数据，优化写入和聚合

**代表产品：**

- InfluxDB
- TimescaleDB（PostgreSQL 扩展）
- Prometheus

| 核心数据结构/算法 | 用途     |
| ----------------- | -------- |
| LSM树             | 高写入   |
| 压缩算法          | 数据压缩 |

---

## 视角二：算法 → 应用的数据库

### 树结构

| 数据结构                                     | 应用数据库                      |
| -------------------------------------------- | ------------------------------- |
| [B+树](database/relational/b-plus-tree.md)   | MySQL、PostgreSQL、SQLite、etcd |
| [B树](database/document/b-tree.md)           | MongoDB、CouchDB                |
| [跳表](database/kv/skip-list.md)             | Redis、LevelDB、HBase           |
| [LSM树](database/columnar/lsm-tree.md)       | Cassandra、HBase、ClickHouse    |
| [二叉搜索树](computation/tree/bst.md)        | 内存索引、符号表                |
| [红黑树](computation/tree/red-black-tree.md) | Java TreeMap、C++ std::map      |
| [AVL树](computation/tree/avl-tree.md)        | 读密集型索引                    |

### 哈希结构

| 数据结构                                       | 应用数据库            |
| ---------------------------------------------- | --------------------- |
| [哈希表](computation/hash-table/hash-table.md) | Redis Hash、Memcached |

### 缓存淘汰

| 算法                                | 应用数据库                   |
| ----------------------------------- | ---------------------------- |
| [LRU](cache/lru.md)                 | Redis、Memcached             |
| [LFU](cache/lfu.md)                 | Redis                        |
| [布隆过滤器](cache/bloom-filter.md) | Cassandra、HBase、ClickHouse |

### 向量检索

| 算法                                | 应用数据库                 |
| ----------------------------------- | -------------------------- |
| [HNSW](ai/vector-search/hnsw.md)    | Pinecone、Milvus、Weaviate |
| [KD树](ai/vector-search/kd-tree.md) | Milvus（低维）             |

---

## 视角三：AI 生成类型 → 核心算法 → 进化史

### 大语言模型 (LLM)

> **定义**：基于大规模语言模型的文本生成

**代表产品：**

- GPT-4 / GPT-3.5（OpenAI）
- Claude（Anthropic）
- Gemini（Google）
- Llama（Meta）
- 通义千问（阿里）
- 文心一言（百度）

| 核心技术         | 说明             | 引入时间 |
| ---------------- | ---------------- | -------- |
| Transformer      | 注意力机制架构   | 2017     |
| GPT              | 自回归语言模型   | 2018     |
| RLHF             | 人类反馈强化学习 | 2022     |
| Chain of Thought | 思维链推理       | 2022     |
| RAG              | 检索增强生成     | 2023     |
| Function Calling | 函数调用         | 2023     |
| MoE              | 混合专家模型     | 2023     |

**进化历程：**

```
Word2Vec → Transformer → GPT → GPT-2(无监督) → GPT-3(few-shot) → RLHF(GPT-3.5) → GPT-4(多模态)
```

### 图像生成

> **定义**：AI 生成图片/艺术作品

**代表产品：**

- Midjourney
- Stable Diffusion
- DALL-E（OpenAI）
- Adobe Firefly

| 核心技术   | 说明         | 引入时间 |
| ---------- | ------------ | -------- |
| GAN        | 对抗生成网络 | 2014     |
| VAE        | 变分自编码器 | 2013     |
| Diffusion  | 扩散模型     | 2015     |
| CLIP       | 图文对齐     | 2021     |
| LoRA       | 低秩适配     | 2021     |
| ControlNet | 条件控制     | 2023     |

**进化历程：**

```
GAN(2014) → StyleGAN → VAE → Diffusion(2015) → DDPM → Stable Diffusion(2022) → ControlNet(2023)
```

### 语音合成 (TTS)

> **定义**：文本转语音生成

**代表产品：**

- ElevenLabs
- Azure TTS
- Vall-E（微软）

| 核心技术   | 说明          | 引入时间 |
| ---------- | ------------- | -------- |
| WaveNet    | 原始音频生成  | 2016     |
| Tacotron   | 端到端 TTS    | 2017     |
| FastSpeech | 非自回归      | 2019     |
| VALL-E     | 神经Codec TTS | 2023     |

### 3D 模型生成

> **定义**：AI 生成 3D 几何模型

**代表产品：**

- LGM
- DreamGaussian
- TripoSR

| 核心技术           | 说明       | 引入时间 |
| ------------------ | ---------- | -------- |
| NeRF               | 神经辐射场 | 2020     |
| Gaussian Splatting | 高斯溅射   | 2023     |
| Diffusion 3D       | 3D 扩散    | 2023     |

**进化历程：**

```
Point Cloud → NeRF(2020) → 3D Gaussian Splatting(2023) → Diffusion 3D(2023)
```

### 视频生成

> **定义**：AI 生成视频内容

**代表产品：**

- Sora（OpenAI）
- Runway Gen-2/3
- Pika

| 核心技术       | 说明                  | 引入时间 |
| -------------- | --------------------- | -------- |
| 时空 Diffusion | 时空建模              | 2023     |
| DiT            | Diffusion Transformer | 2024     |
| VideoGPT       | VAE 视频              | 2021     |

### RAG（检索增强生成）

> **定义**：结合检索和生成的混合架构

**代表产品：**

- LangChain
- LlamaIndex
- RAGFlow

| 核心技术   | 说明                                                                  | 引入时间 |
| ---------- | --------------------------------------------------------------------- | -------- |
| 向量检索   | [HNSW](ai/vector-search/hnsw.md)、[KD树](ai/vector-search/kd-tree.md) | -        |
| Chunking   | 文本分块策略                                                          | -        |
| Re-ranking | 结果重排                                                              | -        |

---

## 视角四：AI Agent 模式 → 变种 → 优缺点 → 应用

### ReAct（推理 + 行动）

> **定义**：结合推理和行动的 Agent 模式

**代表产品：**

- New Bing（早期）
- AutoGPT

| 变种        | 说明         | 优点       | 缺点           |
| ----------- | ------------ | ---------- | -------------- |
| ReAct       | 推理后行动   | 可解释性强 | 步骤多，速度慢 |
| ReAct + CoT | 结合思维链   | 推理更强   | 更慢           |
| 反思 ReAct  | 加入自我反思 | 减少错误   | 实现复杂       |

**为什么好**：让模型先思考再行动，避免盲目执行

### Chain of Thought（思维链）

> **定义**：显式展示推理过程

**代表产品：**

- GPT-4（内置）

| 变种             | 说明       | 优点         | 缺点         |
| ---------------- | ---------- | ------------ | ------------ |
| CoT              | 逐步推理   | 提升推理能力 | 需引导       |
| Few-shot CoT     | 示例引导   | 无需微调     | 依赖示例质量 |
| Self-Consistency | 多路径投票 | 更稳定       | 计算成本高   |

**为什么好**：大模型在推理任务上表现显著提升

### Tool Use（工具调用）

> **定义**：Agent 调用外部工具扩展能力

**代表产品：**

- GPT-4 Function Calling
- Claude Tool Use
- 各种 Agent 框架

| 变种             | 说明     | 优点       | 缺点            |
| ---------------- | -------- | ---------- | --------------- |
| Function Calling | 函数调用 | 标准化接口 | 需要定义 schema |
| Tool Pool        | 工具池   | 灵活选择   | 选择困难        |
| 工具编排         | 工具链   | 复杂任务   | 编排复杂        |

**为什么好**：突破模型知识截止日期，扩展实时能力

### Multi-Agent（多 Agent 协作）

> **定义**：多个 Agent 协同工作

**代表产品：**

- ChatDev
- MetaGPT
- CAMEL

| 变种     | 说明                | 优点     | 缺点     |
| -------- | ------------------- | -------- | -------- |
| 角色分工 | 不同 Agent 不同角色 | 专业化   | 协调复杂 |
| 辩论     | Agent 之间辩论      | 多角度   | 收敛慢   |
| 层级     | 上级分配任务        | 结构清晰 | 灵活性差 |

**为什么好**：分工协作，解决复杂任务

### Plan-Execute（计划执行）

> **定义**：先规划再执行的两阶段模式

**代表产品：**

- BabyAGI
- LangChain Agents

| 变种       | 说明           | 优点     | 缺点         |
| ---------- | -------------- | -------- | ------------ |
| 一次性计划 | 先生成完整计划 | 全局最优 | 计划可能错误 |
| 动态计划   | 边执行边调整   | 适应变化 | 可能偏离目标 |
| 层级计划   | 多层分解       | 复杂任务 | 实现复杂     |

**为什么好**：处理需要多步骤的复杂任务

### Reflection（自我反思）

> **定义**：Agent 反思和修正错误

**代表产品：**

- Reflexion
- Self-RAG

| 变种     | 说明         | 优点         | 缺点         |
| -------- | ------------ | ------------ | ------------ |
| 错误反思 | 失败后反思   | 减少重复错误 | 依赖错误检测 |
| 连续反思 | 持续评估     | 实时修正     | 成本高       |
| 外部反馈 | 结合外部评估 | 更准确       | 需要反馈源   |

**为什么好**：让 Agent 从错误中学习

---

## 完整分类索引

### 按领域分类

#### 缓存应用

| 数据结构                            | 一句话           | 适用场景                         |
| ----------------------------------- | ---------------- | -------------------------------- |
| [LRU](cache/lru.md)                 | 最近最少使用淘汰 | 缓存大小有限，需要保留热点数据   |
| [LFU](cache/lfu.md)                 | 最不经常使用淘汰 | 访问频率差异大，需要保留高频访问 |
| [布隆过滤器](cache/bloom-filter.md) | 概率型存在性判断 | 大规模数据去重、判断不存在       |

#### 关系型数据库

| 数据结构                                   | 一句话         | 适用场景              |
| ------------------------------------------ | -------------- | --------------------- |
| [B+树](database/relational/b-plus-tree.md) | 多路平衡查找树 | MySQL/PostgreSQL 索引 |

#### KV 存储

| 数据结构                         | 一句话       | 适用场景                      |
| -------------------------------- | ------------ | ----------------------------- |
| [跳表](database/kv/skip-list.md) | 多层有序链表 | Redis Sorted Set、内存有序 kv |

#### 文档数据库

| 数据结构                           | 一句话         | 适用场景     |
| ---------------------------------- | -------------- | ------------ |
| [B树](database/document/b-tree.md) | 多路平衡查找树 | MongoDB 索引 |

#### 列式数据库

| 数据结构                               | 一句话         | 适用场景                         |
| -------------------------------------- | -------------- | -------------------------------- |
| [LSM树](database/columnar/lsm-tree.md) | 日志结构合并树 | 写入密集型存储 (Cassandra/HBase) |

#### 图数据库

| 数据结构 | 一句话      | 适用场景         |
| -------- | ----------- | ---------------- |
| 邻接表   | 节点+边列表 | 图遍历、关系查询 |

#### 向量数据库

| 数据结构                            | 一句话         | 适用场景         |
| ----------------------------------- | -------------- | ---------------- |
| [HNSW](ai/vector-search/hnsw.md)    | 分层小世界图   | 高速向量近似搜索 |
| [KD树](ai/vector-search/kd-tree.md) | k 维二叉搜索树 | 低维向量最近邻   |

#### 计算应用

##### 线性结构

| 数据结构                                       | 一句话                   | 适用场景                   |
| ---------------------------------------------- | ------------------------ | -------------------------- |
| [数组](computation/array/array.md)             | 连续内存的同类型元素集合 | 随机访问为主、遍历多       |
| [链表](computation/linked-list/linked-list.md) | 节点串起的离散数据       | 插入删除频繁、大小不确定   |
| [栈](computation/stack/stack.md)               | LIFO 有序集合            | 函数调用栈、括号匹配、DFS  |
| [队列](computation/queue/queue.md)             | FIFO 有序集合            | 广度优先、任务调度、流处理 |

##### 树形结构

| 数据结构                                     | 一句话             | 适用场景                   |
| -------------------------------------------- | ------------------ | -------------------------- |
| [二叉树](computation/tree/binary-tree.md)    | 基础二叉树结构     | 遍历、表达式树             |
| [二叉搜索树](computation/tree/bst.md)        | 左小右大的二叉树   | 基础查找、有序遍历         |
| [AVL树](computation/tree/avl-tree.md)        | 高度平衡二叉搜索树 | 查找为主、需要严格平衡     |
| [红黑树](computation/tree/red-black-tree.md) | 近平衡二叉搜索树   | 插入删除频繁、需要近似平衡 |
| [线段树](computation/tree/segment-tree.md)   | 区间查询树         | 区间统计、动态数组         |
| [树状数组](computation/tree/fenwick-tree.md) | BIT 树             | 前缀和、单点更新           |

##### 堆结构

| 数据结构                       | 一句话              | 适用场景                  |
| ------------------------------ | ------------------- | ------------------------- |
| [堆](computation/heap/heap.md) | 完全二叉树 + 堆属性 | 优先级队列、top-k、堆排序 |

##### 图结构

| 数据结构                         | 一句话        | 适用场景           |
| -------------------------------- | ------------- | ------------------ |
| [图](computation/graph/graph.md) | 节点+边的集合 | 关系网络、路径规划 |

##### 哈希结构

| 数据结构                                       | 一句话     | 适用场景              |
| ---------------------------------------------- | ---------- | --------------------- |
| [哈希表](computation/hash-table/hash-table.md) | 键值对映射 | 快速查找、O(1) 复杂度 |

##### 算法

| 算法                                       | 一句话                | 适用场景               |
| ------------------------------------------ | --------------------- | ---------------------- |
| [排序](computation/algorithm/sorting.md)   | 元素有序排列          | 各种需要有序数据的场景 |
| [搜索](computation/algorithm/searching.md) | 查找目标元素          | 静态/动态数据查找      |
| [动态规划](computation/algorithm/dp.md)    | 最优子结构+重叠子问题 | 最优解问题             |
| [贪心](computation/algorithm/greedy.md)    | 局部最优              | 最优子结构、无后效性   |
| [回溯](computation/algorithm/backtrack.md) | 尝试+回退             | 排列组合、棋盘问题     |

#### AI 应用

##### AI 生成类型

| 类型       | 核心技术                    | 代表产品                     |
| ---------- | --------------------------- | ---------------------------- |
| 大语言模型 | Transformer、RLHF、CoT      | GPT、Claude、Llama           |
| 图像生成   | Diffusion、CLIP、ControlNet | Midjourney、Stable Diffusion |
| 语音合成   | WaveNet、Tacotron           | ElevenLabs、VALL-E           |
| 3D 生成    | NeRF、Gaussian Splatting    | LGM、DreamGaussian           |
| 视频生成   | 时空 Diffusion、DiT         | Sora、Runway                 |
| RAG        | 向量检索 + 生成             | LangChain、LlamaIndex        |

##### 向量检索

| 数据结构                                          | 一句话             | 适用场景             |
| ------------------------------------------------- | ------------------ | -------------------- |
| [向量搜索概述](ai/vector-search/vector-search.md) | 高维向量相似度搜索 | 推荐系统、语义搜索   |
| [KD树](ai/vector-search/kd-tree.md)               | k 维二叉搜索树     | 低维向量最近邻       |
| [HNSW](ai/vector-search/hnsw.md)                  | 分层小世界图       | 高速向量近似搜索     |
| [Trie](ai/trie.md)                                | 前缀树             | 字符串检索、自动补全 |
| [RAG模式](ai/rag-patterns.md)                     | 检索增强生成       | LLM 知识库问答       |

##### AI Agent 模式

| 模式                                     | 核心思想      | 代表产品         |
| ---------------------------------------- | ------------- | ---------------- |
| [ReAct](ai/agent/react.md)               | 推理+行动     | AutoGPT          |
| [Chain of Thought](ai/agent/cot.md)      | 思维链        | GPT-4            |
| [Tool Use](ai/agent/tool-use.md)         | 工具调用      | GPT-4 Function   |
| [Multi-Agent](ai/agent/multi-agent.md)   | 多 Agent 协作 | ChatDev、MetaGPT |
| [Plan-Execute](ai/agent/plan-execute.md) | 计划执行      | BabyAGI          |
| [Reflection](ai/agent/reflection.md)     | 自我反思      | Reflexion        |

#### 游戏应用

| 数据结构                         | 一句话         | 适用场景               |
| -------------------------------- | -------------- | ---------------------- |
| [四叉树](game/quadtree.md)       | 2D 空间分割树  | 2D 碰撞检测、视锥剔除  |
| [八叉树](game/octree.md)         | 3D 空间分割树  | 3D 碰撞检测、空间查询  |
| [A\*算法](game/a-star.md)        | A\* 寻路算法   | 游戏 NPC 寻路          |
| [空间哈希](game/spatial-hash.md) | 网格化空间索引 | 大量动态对象碰撞检测   |
| [对象池](game/object-pool.md)    | 对象复用池     | 高频创建销毁的游戏对象 |
| [ECS](game/ecs.md)               | 实体组件系统   | 游戏实体管理           |
| [位掩码](game/bitmask.md)        | 位运算状态管理 | 技能/Buff 状态标记     |

#### 系统设计

| 数据结构                                | 一句话              | 适用场景            |
| --------------------------------------- | ------------------- | ------------------- |
| [一致性哈希](system/consistent-hash.md) | 分布式哈希          | 分布式缓存/存储节点 |
| [令牌桶](system/token-bucket.md)        | 固定容量桶 + 速率   | 突发流量限流        |
| [漏桶](system/leaky-bucket.md)          | 固定队列 + 恒定流出 | 恒定速率限流        |

---

## 数据结构对比表

### 树结构对比

| 数据结构 | 平衡度     | 查询     | 插入/删除       | 空间 | 适用场景 |
| -------- | ---------- | -------- | --------------- | ---- | -------- |
| BST      | 取决于数据 | O(log n) | O(log n)        | O(n) | 基础有序 |
| AVL      | 严格平衡   | O(log n) | O(log n) + 旋转 | O(n) | 读多写少 |
| 红黑树   | 近似平衡   | O(log n) | O(log n) + 旋转 | O(n) | 写多读少 |
| B树      | 多路平衡   | O(log n) | O(log n)        | O(n) | 磁盘索引 |
| B+树     | 多路平衡   | O(log n) | O(log n)        | O(n) | 范围查询 |
| 跳表     | 概率平衡   | O(log n) | O(log n)        | O(n) | 内存有序 |

### 空间索引对比

| 数据结构 | 维度  | 查询复杂度   | 实现复杂度 | 适用场景      |
| -------- | ----- | ------------ | ---------- | ------------- |
| 四叉树   | 2D    | O(log n + k) | 简单       | 2D 碰撞检测   |
| 八叉树   | 3D    | O(log n + k) | 中等       | 3D 碰撞检测   |
| 空间哈希 | 2D/3D | O(1) + k     | 简单       | 均匀分布对象  |
| R-Tree   | 多维  | O(log n + k) | 复杂       | GIS、地理查询 |
| KD-Tree  | 低维  | O(log n)     | 中等       | <20维向量     |

### 缓存淘汰对比

| 算法 | 命中率         | 实现复杂度 | 适用场景   |
| ---- | -------------- | ---------- | ---------- |
| LRU  | 访问局部性强   | 简单       | 时间局部性 |
| LFU  | 访问频率差异大 | 中等       | 频率局部性 |
| FIFO | 简单           | 最简单     | 冷数据     |

### 限流算法对比

| 算法     | 特点     | 适用场景 |
| -------- | -------- | -------- |
| 令牌桶   | 允许突发 | API 限流 |
| 漏桶     | 严格匀速 | 金融交易 |
| 计数器   | 简单     | 简单限流 |
| 滑动窗口 | 平滑     | 精确限流 |

### 排序算法对比

| 算法 | 时间复杂度 | 空间复杂度 | 稳定性 | 适用场景 |
| ---- | ---------- | ---------- | ------ | -------- |
| 冒泡 | O(n²)      | O(1)       | 稳定   | 教学     |
| 插入 | O(n²)      | O(1)       | 稳定   | 基本有序 |
| 归并 | O(n log n) | O(n)       | 稳定   | 外部排序 |
| 快速 | O(n log n) | O(log n)   | 不稳定 | 通用     |
| 堆   | O(n log n) | O(1)       | 不稳定 | Top-K    |

### 向量检索对比

| 算法    | 查询复杂度  | 召回率 | 内存 | 适用维度 |
| ------- | ----------- | ------ | ---- | -------- |
| 暴力    | O(n)        | 100%   | 低   | 任意     |
| KD-Tree | O(log n)    | 100%   | 中   | <20      |
| HNSW    | O(log n)    | 高     | 高   | 任意     |
| PQ      | O(n/分片数) | 中     | 低   | 高维     |

---

## 场景反向索引

### 快速查找

| 场景          | 推荐数据结构           |
| ------------- | ---------------------- |
| 精确 key 查找 | 哈希表                 |
| 范围查找      | B+树、有序数组         |
| 前缀查找      | Trie                   |
| 最相似查找    | 向量索引(HNSW/KD-Tree) |

### 高频操作

| 操作          | 推荐数据结构   |
| ------------- | -------------- |
| 插入+删除     | 链表、哈希表   |
| 插入+有序遍历 | 有序链表、跳表 |
| 读多写少      | AVL树          |
| 写多读少      | 红黑树         |

### 内存受限

| 场景     | 推荐数据结构 |
| -------- | ------------ |
| 极小内存 | 位图、位掩码 |
| 小内存   | 堆、树状数组 |
| 大内存   | 哈希表、B树  |

### 并发场景

| 场景         | 推荐数据结构     |
| ------------ | ---------------- |
| 无锁队列     | 环形缓冲区       |
| 高并发缓存   | Redis (各种结构) |
| 分布式一致性 | 一致性哈希       |

---

## 面试高频题汇总

### 基础数据结构

- 数组 vs 链表 vs 栈 vs 队列 区别
- 哈希表冲突解决
- 二叉树遍历（非递归）
- 图遍历（BFS/DFS）

### 高级数据结构

- Top-K 问题解法
- LRU 实现
- 并查集应用
- 线段树/树状数组

### 算法思想

- 二分搜索变体
- 排序算法复杂度
- DP vs 贪心 vs 回溯
- KMP 原理

### 系统设计

- 分布式 ID 生成
- 缓存设计
- 限流实现
- 消息队列原理
