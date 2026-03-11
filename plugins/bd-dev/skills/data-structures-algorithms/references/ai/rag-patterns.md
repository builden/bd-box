# RAG 模式

## 一句话定义

检索增强生成（Retrieval Augmented Generation），结合外部知识库增强 LLM 能力。

## 核心架构

```
用户查询 → 检索 → 上下文 → LLM 生成 → 回答
```

## 为什么好

**优点：**

- 突破知识截止日期
- 减少幻觉
- 可更新知识库
- 成本更低

**缺点：**

- 检索质量影响回答
- 增加延迟
- 上下文长度限制
- 复杂度增加

## 适用场景

- **私有知识库**：企业内部文档
- **实时信息**：股票、天气
- **长尾问题**：LLM 训练数据少的内容

## 核心组件

### 1. 文档加载

```typescript
interface Document {
  id: string;
  content: string;
  metadata: Record<string, any>;
}

interface Loader {
  load(filePath: string): Promise<Document[]>;
}

// 支持：PDF、Markdown、Notion、数据库
```

### 2. 文本分块

```typescript
interface Chunker {
  chunk(documents: Document[]): Promise<Chunk[]>;
}

// 策略：固定大小、重叠、语义
function fixedSizeChunk(text: string, size: number, overlap: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size - overlap) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}
```

### 3. 向量存储

```typescript
interface VectorStore {
  add(chunks: Chunk[]): Promise<void>;
  similaritySearch(query: string, k: number): Promise<Chunk[]>;
}

// 支持：Pinecone、Milvus、Chroma、FAISS
```

### 4. 检索

```typescript
async function retrieve(query: string, k: number = 5): Promise<Chunk[]> {
  const embedding = await embedder.embed(query);
  const results = await vectorStore.similaritySearch(embedding, k);
  return results;
}
```

## 进阶模式

### 1. 父子文档检索

```
大文档 → 小块 → 检索小块 → 返回父文档
```

### 2. 混合检索

```typescript
async function hybridSearch(query: string) {
  const semanticResults = await vectorSearch(query);
  const keywordResults = await keywordSearch(query);
  return rerank([...semanticResults, ...keywordResults]);
}
```

### 3. RAG Fusion

多查询检索，融合结果。

### 4. Self-RAG

检索后评估相关性，再决定是否生成。

## 经典应用

- **LangChain**：RAG 框架
- **LlamaIndex**：专门做 RAG
- **RAGFlow**：可视化 RAG
- **Dify**：RAG 应用平台

**为什么选择**：RAG 是企业落地 LLM 的标配，让 AI "懂"企业知识。

## 使用边界

**何时不用：**

- LLM 已知答案：不需要外部知识
- 简单 FAQ：直接问答对即可
- 实时性要求极高：RAG 增加延迟

**注意事项：**

- 文本分块：块大小影响检索效果，通常 256-1024 字符
- 检索质量：检索不到 → 回答质量差，需要优化检索
- 上下文长度：块数量受限于 LLM 上下文窗口
- 评估困难：RAG 效果评估复杂，需要设计评估指标

**面试常考点：**

- RAG 完整流程
- 文本分块策略
- 向量检索 vs 关键词检索
- RAG 评估指标（Hit Rate, MRR, NDCG）
- RAG 优化方法（混合检索、重排序、父子文档）
- RAG vs 微调对比

## RAG 评估指标

| 指标     | 说明               |
| -------- | ------------------ |
| Hit Rate | 检索命中率         |
| MRR      | 平均倒数排名       |
| NDCG     | 归一化折损累计增益 |
| 召回率   | 相关文档召回比例   |
