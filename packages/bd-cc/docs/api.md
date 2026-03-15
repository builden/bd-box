# API 响应格式规范

本文档定义 bd-cc API 的统一响应格式。

## 响应结构

### 成功响应

| 类型     | 格式                                    | 说明                 |
| -------- | --------------------------------------- | -------------------- |
| 单个资源 | `{ data: T }`                           | `success()` 返回     |
| 资源集合 | `{ data: { items: T[], meta: {...} } }` | `successList()` 返回 |

### 错误响应

所有错误响应遵循 [RFC 7807](https://datatracker.ietf.org/doc/html/rfc7807) / [RFC 9457](https://datatracker.ietf.org/doc/html/rfc9457) 规范：

```json
{
  "error": {
    "code": "error_code",
    "message": "错误描述",
    "details": [{ "field": "fieldName", "message": "字段错误描述" }],
    "locale": "zh-CN",
    "request_id": "req_1234567890_abc123def456",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## 响应函数

### success(data, statusCode = 200)

用于返回单个资源。

```typescript
// 返回
{ data: { id: 1, name: "example" } }
```

### successList(items, meta?)

用于返回资源集合（带分页元数据）。

```typescript
// 返回
{
  data: {
    items: [
      { id: 1, name: "item1" },
      { id: 2, name: "item2" }
    ],
    meta: {
      total: 100,
      page: 1,
      limit: 10
    }
  }
}
```

### created(data)

用于返回创建成功的资源（状态码 201）。

```typescript
// 返回
{ data: { id: 1, name: "new item" } }
```

### noContent()

用于返回空响应（状态码 204）。

```typescript
// 返回
// 无响应体
```

## 错误处理函数

| 函数                               | 状态码 | 用途         |
| ---------------------------------- | ------ | ------------ |
| `badRequest(message, details?)`    | 400    | 请求参数错误 |
| `unauthorized(message?)`           | 401    | 未认证       |
| `forbidden(message?)`              | 403    | 无权限       |
| `notFound(resource)`               | 404    | 资源不存在   |
| `conflict(message)`                | 409    | 资源冲突     |
| `unprocessable(message, details?)` | 422    | 验证错误     |
| `rateLimited(message?)`            | 429    | 请求过于频繁 |
| `serverError(message?)`            | 500    | 服务端错误   |
| `badGateway(message?)`             | 502    | 上游服务失败 |
| `gatewayTimeout(message?)`         | 504    | 上游服务超时 |

## 前端处理

前端 `authenticatedFetch` 会自动处理响应：

```typescript
// 单个资源
const response = await authenticatedFetch('/api/users/me');
const user = await response.json();
// user = { id: 1, name: "example" }

// 资源集合
const response = await authenticatedFetch('/api/projects');
const { items, meta } = await response.json();
// items = [...], meta = { total, page, limit }
```

## Zod 验证

前端使用 Zod 验证响应数据，Schema 定义在 `shared/api/` 目录下。

```typescript
import { ApiKeysListResponseSchema } from '@shared/api/settings';

const result = validateResponse(ApiKeysListResponseSchema, json, {
  endpoint: '/api/settings/api-keys',
  status: 200,
});
// result = { apiKeys: [...] }
```
