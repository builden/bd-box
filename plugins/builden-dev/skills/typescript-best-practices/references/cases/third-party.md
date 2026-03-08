# 扩展无类型第三方库

当使用没有类型定义的第三方库时，使用 `declare module` 扩展类型。

## 目录

- [基础扩展模式](#基础扩展模式)
- [扩展已有模块](#扩展已有模块)
- [全局声明](#全局声明)
- [从实例推断类型](#从实例推断类型)

## 基础扩展模式

### 扩展已有模块

```typescript
// types/mermaid.d.ts
declare module "mermaid" {
  export interface MermaidConfig {
    theme?: "default" | "neutral" | "dark" | "base";
    startOnLoad?: boolean;
    securityLevel?: "strict" | "loose" | "antiscript";
    [key: string]: unknown; // 允许额外配置
  }

  export function initialize(config: MermaidConfig): void;
  export function render(id: string, text: string): Promise<{ svg: string }>;
}
```

### 添加缺少的导出

```typescript
// types/lodash-extend.d.ts
declare module "lodash" {
  export function chunk<T>(array: T[], size: number): T[][];
  export function flattenDeep<T>(array: any[]): T[];
}
```

## 完整类型定义示例

### 为 API 库添加类型

```typescript
// types/axios-extended.d.ts
declare module "axios" {
  export interface AxiosRequestConfig<D = any> {
    url?: string;
    method?: Method;
    baseURL?: string;
    transformRequest?: TransformRequest | TransformRequest[];
    transformResponse?: TransformResponse | TransformResponse[];
    headers?: AxiosRequestHeaders;
    params?: any;
    paramsSerializer?: (params: any) => string;
    data?: D;
    timeout?: number;
    timeoutErrorMessage?: string;
    withCredentials?: boolean;
    adapter?: AxiosAdapter;
    auth?: AxiosBasicCredentials;
    responseType?: ResponseType;
    responseEncoding?: string | false;
    xsrfCookieName?: string;
    xsrfHeaderName?: string;
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
    onDownloadProgress?: (progressEvent: AxiosProgressEvent) => void;
    maxContentLength?: number;
    validateStatus?: ((status: number) => boolean) | null;
    maxBodyLength?: number;
    maxRedirects?: number;
    socketPath?: string | null;
    httpAgent?: any;
    httpsAgent?: any;
    cancelToken?: CancelToken;
    decompress?: boolean;
    transitional?: TransitionalOptions;
    signal?: AbortSignal;
    insecureHTTPParser?: boolean;
  }
}
```

### unknown + 守卫策略

对于复杂的第三方库，先用 `unknown` 声明，后续逐步细化：

```typescript
// types/complex-lib.d.ts
declare module "complex-lib" {
  // 用 unknown 声明，后续用守卫窄化
  export function init(config: unknown): void;
  export function execute(action: unknown): unknown;

  // 或者用 any 作为临时方案，后续替换
  // export function init(config: any): void;
}
```

## 渐进式类型增强

### Step 1: 基础声明

```typescript
// types/my-lib.d.ts
declare module "my-lib" {
  export function doSomething(input: unknown): unknown;
}
```

### Step 2: 添加类型守卫

```typescript
// utils/my-lib-guards.ts
interface MyLibConfig {
  apiKey: string;
  timeout?: number;
}

export function isMyLibConfig(value: unknown): value is MyLibConfig {
  return value !== null && typeof value === "object" && "apiKey" in value && typeof (value as any).apiKey === "string";
}
```

### Step 3: 完善类型定义

```typescript
// types/my-lib.d.ts (更新版本)
declare module "my-lib" {
  export interface MyLibConfig {
    apiKey: string;
    timeout?: number;
    retry?: number;
  }

  export interface MyLibResult {
    success: boolean;
    data?: unknown;
    error?: string;
  }

  export function doSomething(config: MyLibConfig): Promise<MyLibResult>;
}
```
