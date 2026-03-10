# API 接口规范

有后端 API 的项目使用此模板描述接口规范。

## 基础规范

### 版本控制

```
/v1/users
/v2/users
```

版本号放在 URL 路径中，位于 host 之后。

### URL 命名

| 规范           | 示例                             |
| -------------- | -------------------------------- |
| 资源用名词     | `/products`，不是 `/getProducts` |
| 集合用复数     | `/users`，不是 `/user`           |
| kebab-case     | `/shipping-addresses`            |
| 小写           | 全部小写                         |
| 描述性路径参数 | `{userId}`，不是 `{id}`          |
| 嵌套限制       | 最多 2-3 层                      |

### HTTP 方法对应

| 方法   | 用途     | 示例                     |
| ------ | -------- | ------------------------ |
| GET    | 获取资源 | `GET /users`             |
| POST   | 创建资源 | `POST /users`            |
| PUT    | 全量更新 | `PUT /users/{userId}`    |
| PATCH  | 部分更新 | `PATCH /users/{userId}`  |
| DELETE | 删除资源 | `DELETE /users/{userId}` |

### 过滤/分页

```
GET /users?status=active&page=1&limit=20&sort=createdAt
```

---

## 请求规范

### Header

| Header          | 说明                     | 必填 |
| --------------- | ------------------------ | ---- |
| Content-Type    | `application/json`       | 是   |
| Accept-Language | 语言偏好：`zh-CN` / `en` | 否   |
| Authorization   | 认证 Token               | 是   |

### 请求体结构

使用 `data` 包装：

```json
{
  "data": {
    "name": "张三",
    "email": "test@example.com"
  }
}
```

### 字段命名

| 场景         | 命名方式  | 示例                     |
| ------------ | --------- | ------------------------ |
| JSON 字段    | camelCase | `{ "userName": "张三" }` |
| Query 参数   | camelCase | `?pageSize=20`           |
| URL 路径参数 | camelCase | `/users/{userId}`        |

### 日期时间格式

使用 ISO 8601 格式：

```
2026-03-11T10:00:00Z
```

---

## 响应规范

### 正常响应（2xx）

```json
{
  "data": { ... }
}
```

### 资源集合

```json
{
  "data": [
    { "id": "usr_1", ... },
    { "id": "usr_2", ... }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  },
  "links": {
    "self": "/v1/users?page=1",
    "next": "/v1/users?page=2",
    "prev": null
  }
}
```

### 错误响应（4xx/5xx）

遵循 RFC 7807 / RFC 9457：

```json
{
  "error": {
    "code": "validation_error",
    "message": "请求参数验证失败",
    "details": [
      { "field": "email", "message": "邮箱格式不正确" },
      { "field": "password", "message": "密码强度不足" }
    ],
    "locale": "zh-CN",
    "request_id": "req_abc123",
    "timestamp": "2026-03-11T10:00:00Z"
  }
}
```

### 错误码设计

使用小写下划线格式，按领域分组：

```
auth.invalid_credentials
auth.token_expired
user.not_found
validation_error
```

---

## HTTP 状态码

| 状态码 | 场景                 |
| ------ | -------------------- |
| 200    | 成功                 |
| 201    | 创建成功             |
| 204    | 删除成功，无返回内容 |
| 400    | 请求语法错误         |
| 401    | 未认证               |
| 403    | 无权限               |
| 404    | 资源不存在           |
| 422    | 验证错误             |
| 429    | 限流                 |
| 500    | 服务端错误           |
| 502    | 上游服务失败         |
| 504    | 上游服务超时         |

---

## 国际化

### 语言传递方式

**Header 方式（推荐）**：

```
Accept-Language: zh-CN
```

### 优先级

| 优先级 | 来源                     |
| ------ | ------------------------ |
| 1      | Header `Accept-Language` |
| 2      | 默认语言 `zh-CN`         |

### 错误响应示例

```json
// 请求
GET /v1/users HTTP/1.1
Accept-Language: en

// 响应
{
  "error": {
    "code": "validation_error",
    "message": "Request validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ],
    "locale": "en",
    "request_id": "req_abc123"
  }
}
```

---

## 完整示例

### 创建用户

**请求：**

```
POST /v1/users
Accept-Language: zh-CN
Content-Type: application/json
Authorization: Bearer token_xxx

{
  "data": {
    "name": "张三",
    "email": "zhangsan@example.com",
    "password": "xxx"
  }
}
```

**成功响应 (201)：**

```json
{
  "data": {
    "id": "usr_123",
    "name": "张三",
    "email": "zhangsan@example.com"
  }
}
```

**错误响应 (422)：**

```json
{
  "error": {
    "code": "validation_error",
    "message": "请求参数验证失败",
    "details": [
      { "field": "email", "message": "邮箱格式不正确" },
      { "field": "password", "message": "密码强度不足，至少8位" }
    ],
    "locale": "zh-CN",
    "request_id": "req_abc123",
    "timestamp": "2026-03-11T10:00:00Z"
  }
}
```
