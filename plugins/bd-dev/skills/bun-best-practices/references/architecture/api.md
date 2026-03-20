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
  "data": {
    "items": [
      { "id": "usr_1", ... },
      { "id": "usr_2", ... }
    ],
    "meta": {
      "total": 100,
      "page": 1,
      "limit": 20
    }
  }
}
```

> 注意：资源集合使用 `{ data: { items: [], meta?: {} } }` 格式，`meta` 可选。

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

## TypeScript 类型定义

### 请求/响应类型示例

```typescript
// 请求类型
interface ApiRequest<T = unknown> {
  data?: T;
  pagination?: PaginationParams;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
}

// 响应类型
interface ApiResponse<T = unknown> {
  data: T;
  meta?: PaginationMeta;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
}

// 分页列表响应
interface PaginatedListResponse<T> {
  data: {
    items: T[];
    meta: PaginationMeta;
  };
}
```

---

## 输入验证规范

### 使用 Zod 进行验证

使用 [Zod](https://zod.dev) 进行声明式输入验证：

```typescript
import { z } from 'zod';
import { handleZodError, asyncHandler } from '@server/utils/api-response';

// 定义 Schema
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

// 验证中间件
export function validateCreateUser(req: Request, res: Response, next: NextFunction) {
  const result = createUserSchema.safeParse(req.body.data);
  if (!result.success) {
    return handleZodError(res, result.error);
  }
  next();
}
```

### 预定义验证 Schema

| Schema                | 用途                                      |
| --------------------- | ----------------------------------------- |
| `emailSchema`         | 邮箱验证                                  |
| `gitBranchNameSchema` | Git 分支名验证（`/^[a-zA-Z0-9._\/-]+$/`） |
| `paginationSchema`    | 分页参数 `{ page, limit }`                |
| `filePathSchema`      | 文件路径（防止 null 字节注入）            |
| `gitCommitRefSchema`  | Git commit ref（hash、HEAD~N 等）         |

### 验证函数

```typescript
import {
  validateEmail,
  validateBranchName,
  validateFilePath,
  validateGitConfig,
  validateCommitRef,
} from '@server/utils/validation';

// 使用
const email = validateEmail(req.body.email); // 抛错如无效
const branch = validateBranchName(req.params.branchName);
const file = validateFilePath(req.params.file, projectPath); // 支持路径遍历检测
```

---

## 统一 API 响应模块

### 响应函数

使用 `@server/utils/api-response` 中的统一响应函数：

```typescript
import {
  success, // 200 - 单个资源
  successList, // 200 - 资源列表（带分页）
  created, // 201 - 创建资源
  noContent, // 204 - 无内容
  badRequest, // 400 - 请求语法错误
  unauthorized, // 401 - 未认证
  forbidden, // 403 - 无权限
  notFound, // 404 - 资源不存在
  conflict, // 409 - 资源冲突
  unprocessable, // 422 - 验证错误
  rateLimited, // 429 - 限流
  serverError, // 500 - 服务端错误
  badGateway, // 502 - 上游服务失败
  gatewayTimeout, // 504 - 上游服务超时
} from '@server/utils/api-response';

// 单个资源
success(res, { id: 'usr_1', name: '张三' });

// 资源列表（带分页）
successList(res, users, { total: 100, page: 1, limit: 20 });

// 创建资源 (201)
created(res, newUser);

// 无内容 (204)
noContent(res);

// 错误响应
badRequest(res, 'Invalid input');
unauthorized(res); // 默认: "未认证"
forbidden(res); // 默认: "无权限"
notFound(res, 'User'); // 返回: "User不存在"
conflict(res, 'Already exists');
unprocessable(res, 'Validation failed', details);
serverError(res); // 默认: "服务端错误"
```

### asyncHandler 路由包装器

自动捕获异步错误，无需 try-catch：

```typescript
import { asyncHandler } from '@server/utils/api-response';

router.post(
  '/users',
  asyncHandler(async (req, res) => {
    const user = await createUser(req.body);
    return created(res, user);
  })
);
```

### handleZodError

将 Zod 验证错误转换为 RFC 7807 格式：

```typescript
const result = schema.safeParse(req.body.data);
if (!result.success) {
  return handleZodError(res, result.error);
}
```

---

## 路由文件结构

### 目录组织

```
server/routes/{resource}/
├── index.ts           # 路由注册和认证中间件
├── handlers.ts         # 主路由处理器
├── utils.ts            # 辅助函数
└── {resource}.test.ts  # 测试文件（可选）
```

### 职责划分

| 文件          | 职责                           |
| ------------- | ------------------------------ |
| `index.ts`    | 聚合导出，注册路由，应用中间件 |
| `handlers.ts` | 具体处理函数，业务逻辑         |
| `utils.ts`    | 共享工具函数（格式化、转换等） |

### 示例

**`server/routes/users/index.ts`**：

```typescript
import { Router } from 'express';
import { asyncHandler } from '@server/utils/api-response';
import { getUsers, createUser, getUserById } from './handlers';
import { authenticate } from '@server/middleware/auth';

const router = Router();

router.get('/', authenticate, asyncHandler(getUsers));
router.post('/', authenticate, asyncHandler(createUser));
router.get('/:userId', authenticate, asyncHandler(getUserById));

export default router;
```

**`server/routes/users/handlers.ts`**：

```typescript
import { success, created, notFound } from '@server/utils/api-response';
import { paginationSchema } from '@server/utils/validation';

export async function getUsers(req: Request, res: Response) {
  const { page, limit } = paginationSchema.parse(req.query);
  const users = await findUsers({ page, limit });
  return successList(res, users, { total: users.length, page, limit });
}

export async function createUser(req: Request, res: Response) {
  const user = await db.create(req.body.data);
  return created(res, user);
}
```

---

## 日志记录

### 使用统一日志模块

```typescript
import { createLogger } from '@server/utils/logger';

const logger = createLogger('module-name');

// 信息日志 - 正常流程
logger.info('Operation description', { context });

// 错误日志 - 异常情况（第二个参数为 Error 对象）
logger.error('Error occurred', error, { context });

// 警告日志 - 需要注意但不阻断流程
logger.warn('Warning message', { data });

// 调试日志 - 开发环境详细输出
logger.debug('Debug info', { data });
```

### 日志内容规范

- **第一个参数**：简洁的动作描述（动词开头）
- **第二个参数（error）**：Error 实例，用于记录堆栈
- **第三个参数**：附加上下文数据（对象）

```typescript
logger.info('User created', { userId: 'usr_1', email: 'test@example.com' });
logger.error('Database query failed', error, { query: 'SELECT * FROM users' });
```

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
