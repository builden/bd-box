# API 规范

## 响应格式

### 成功响应

```typescript
// 单个资源
{ data: T }

// 资源列表（带分页）
{
  data: T[],
  meta?: {
    total?: number,  // 总数
    page?: number,   // 当前页码
    limit?: number   // 每页数量
  }
}
```

### 错误响应 (RFC 7807 / RFC 9457)

```typescript
{
  error: {
    code: string,           // 错误码
    message: string,       // 错误消息
    locale: "zh-CN",       // 语言
    request_id: string,   // 请求 ID
    timestamp: string,    // 时间戳 ISO 8601
    details?: {            // 详细错误信息
      field: string,
      message: string
    }[]
  }
}
```

## 项目 API

### GET /api/projects

响应：

```typescript
{
  data: Project[]
}
```

### Project 类型

```typescript
{
  id: string,                    // 唯一标识 (必填)
  name: string,                  // 项目标识符 (必填)
  displayName: string,           // 显示名称 (必填)
  fullPath: string,              // 完整路径 (必填)
  path?: string,                 // 简短路径
  type?: string,                // 项目类型
  manuallyAdded?: boolean,       // 是否手动添加
  hasTaskMaster?: {              // TaskMaster 检测结果
    hasTaskmaster: boolean,
    reason?: string
  },
  sessionMeta?: {                 // 会话元信息
    total: number,
    hasMore: boolean
  }
}
```

## 会话 API

### GET /api/projects/:projectName/sessions

响应：

```typescript
{
  data: Session[],
  meta?: { total, page, limit }
}
```

### Session 类型

```typescript
{
  id: string,                    // 唯一标识 (必填)
  projectName: string,           // 所属项目 (必填)
  displayName?: string,          // 显示名称
  customName?: string,          // 用户自定义名称
  provider: "claude"|"codex"|"cursor"|"gemini",  // AI 提供商 (必填)
  createdAt: string,             // 创建时间 ISO 8601 (必填)
  updatedAt: string,             // 更新时间 ISO 8601 (必填)
  messageCount?: number          // 消息数量
}
```

## 消息 API

### GET /api/projects/:projectName/sessions/:sessionId/messages

响应：

```typescript
{
  data: SessionMessage[],
  meta?: { total, page, limit }
}
```

### SessionMessage 类型

```typescript
{
  id?: string,                   // 消息 ID
  type: string,                  // 消息类型 (必填)
  role?: "user"|"assistant"|"system",  // 消息角色
  content?: string,              // 消息内容
  timestamp?: string,           // 时间戳 ISO 8601
  message?: {                    // 消息结构
    role: "user"|"assistant"|"system",
    content?: string | MessageContentBlock[]
  }
}
```

### MessageContentBlock

```typescript
{
  type: string,                  // 类型 (必填)
  text?: string                  // 文本内容
}
```

## 状态码

| 状态码 | 说明         |
| ------ | ------------ |
| 200    | 成功         |
| 201    | 创建成功     |
| 204    | 无内容       |
| 400    | 请求参数错误 |
| 401    | 未认证       |
| 403    | 无权限       |
| 404    | 资源不存在   |
| 409    | 冲突         |
| 422    | 验证错误     |
| 429    | 请求过于频繁 |
| 500    | 服务端错误   |
| 502    | 上游服务失败 |
| 504    | 上游服务超时 |
