# API 响应建模

用 TypeScript 高级类型精确建模 API 响应。

## 目录

- [基础 API 类型定义](#基础-api-类型定义)
- [端点配置映射](#端点配置映射)
- [请求参数类型](#请求参数类型)
- [响应类型提取](#响应类型提取)
- [完整的 API 客户端类型](#完整的-api-客户端类型)

## 基础 API 类型定义

### 定义端点配置

```typescript
type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

type Endpoint = {
  "/users": {
    GET: { response: User[] };
    POST: { body: CreateUserInput; response: User };
  };
  "/users/:id": {
    GET: { params: { id: string }; response: User };
    PUT: { params: { id: string }; body: UpdateUserInput; response: User };
    DELETE: { params: { id: string }; response: void };
  };
  "/posts": {
    GET: { query: { page?: number; limit?: number }; response: Post[] };
    POST: { body: CreatePostInput; response: Post };
  };
};
```

### 提取类型工具

```typescript
// 提取 params
type ExtractParams<T> = T extends { params: infer P } ? P : never;

// 提取 body
type ExtractBody<T> = T extends { body: infer B } ? B : never;

// 提取 response
type ExtractResponse<T> = T extends { response: infer R } ? R : never;

// 提取 query
type ExtractQuery<T> = T extends { query: infer Q } ? Q : never;

// 使用
type UserParams = ExtractParams<Endpoint["/users/:id"]["GET"]>;
// { id: string }

type CreateUserBody = ExtractBody<Endpoint["/users"]["POST"]>;
// CreateUserInput

type UserResponse = ExtractResponse<Endpoint["/users"]["GET"]>;
// User[]
```

## 类型安全的 API 客户端

### 完整实现

```typescript
type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE";

type EndpointConfig = {
  "/users": {
    GET: { response: User[] };
    POST: { body: CreateUserInput; response: User };
  };
  "/users/:id": {
    GET: { params: { id: string }; response: User };
    PUT: { params: { id: string }; body: Partial<User>; response: User };
    DELETE: { params: { id: string }; response: void };
  };
};

type ExtractParams<T> = T extends { params: infer P } ? P : never;
type ExtractBody<T> = T extends { body: infer B } ? B : never;
type ExtractResponse<T> = T extends { response: infer R } ? R : never;

class APIClient<Config extends Record<string, Record<HTTPMethod, any>>> {
  async request<Path extends keyof Config, Method extends keyof Config[Path]>(
    path: Path,
    method: Method,
    options?: {
      params?: ExtractParams<Config[Path][Method]>;
      body?: ExtractBody<Config[Path][Method]>;
      query?: Record<string, string | number>;
    },
  ): Promise<ExtractResponse<Config[Path][Method]>> {
    // 实现
    return {} as ExtractResponse<Config[Path][Method]>;
  }
}

const api = new APIClient<EndpointConfig>();

// 类型安全的调用
const users = await api.request("/users", "GET");
// Type: User[]

const user = await api.request("/users/:id", "GET", {
  params: { id: "123" },
});
// Type: User

const newUser = await api.request("/users", "POST", {
  body: { name: "John", email: "john@example.com" },
});
// Type: User

// 编译错误！
// await api.request('/users/:id', 'GET'); // Missing params
// await api.request('/users', 'POST', { body: {} }); // Missing required fields
```

## 模板字面量路径类型

### 生成路径类型

```typescript
type Path<T> = T extends object
  ? {
      [K in keyof T]: K extends string ? `${K}` | `${K}.${Path<T[K]>}` : never;
    }[keyof T]
  : never;

interface Config {
  server: {
    host: string;
    port: number;
  };
  database: {
    url: string;
  };
}

type ConfigPath = Path<Config>;
// "server" | "database" | "server.host" | "server.port" | "database.url"
```

### 动态路径建模

```typescript
type APIEndpoint = {
  "/users": { response: User[] };
  "/users/:id": { response: User };
  "/posts": { response: Post[] };
  "/posts/:id": { response: Post };
};

// 提取所有路径
type Keys<T> = T extends Record<infer K, any> ? K : never;
type AllPaths = Keys<APIEndpoint>;
// '/users' | '/users/:id' | '/posts' | '/posts/:id'
```

## 错误响应建模

### 联合类型建模

```typescript
type Success<T> = {
  status: "success";
  data: T;
};

type Error = {
  status: "error";
  error: {
    code: string;
    message: string;
  };
};

type Loading = {
  status: "loading";
};

type AsyncResult<T> = Success<T> | Error | Loading;

// 使用 discriminated union
function handleResult<T>(result: AsyncResult<T>) {
  switch (result.status) {
    case "success":
      console.log(result.data); // Type: T
      break;
    case "error":
      console.log(result.error.message); // Type: string
      break;
    case "loading":
      console.log("Loading...");
      break;
  }
}
```

### 统一响应包装

```typescript
type APIResponse<T, E = APIError> = { ok: true; data: T } | { ok: false; error: E };

interface APIError {
  code: number;
  message: string;
}

// 类型守卫
function isSuccess<T>(response: APIResponse<T>): response is { ok: true; data: T } {
  return response.ok === true;
}

// 使用
async function fetchUser(id: string): Promise<APIResponse<User>> {
  // ...
}

const result = await fetchUser("123");
if (isSuccess(result)) {
  console.log(result.data.name); // TypeScript 知道这是 User
}
```
