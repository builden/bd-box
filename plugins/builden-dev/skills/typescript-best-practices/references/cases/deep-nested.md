# 深度嵌套对象处理

用递归类型处理任意深度的嵌套对象。

## DeepReadonly - 深度只读

### 基础实现

```typescript
type DeepReadonly<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

interface Config {
  server: {
    host: string;
    port: number;
    ssl: {
      enabled: boolean;
      cert: string;
    };
  };
  database: {
    url: string;
    pool: {
      min: number;
      max: number;
    };
  };
}

type ReadonlyConfig = DeepReadonly<Config>;
// 所有嵌套属性都变成 readonly
```

### 效果

```typescript
const config: ReadonlyConfig = {
  server: {
    host: "localhost",
    port: 8080,
    ssl: {
      enabled: true,
      cert: "/path/to/cert",
    },
  },
  database: {
    url: "postgres://localhost",
    pool: { min: 1, max: 10 },
  },
};

// 编译错误！属性是只读的
// config.server.host = 'other'; // Error
// config.database.pool.min = 0; // Error
```

## DeepPartial - 深度可选

### 基础实现

```typescript
type DeepPartial<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;
```

### 应用场景

```typescript
interface User {
  profile: {
    name: string;
    address: {
      city: string;
      country: string;
    };
  };
  settings: {
    theme: string;
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
}

// 用于更新用户信息 - 所有字段都是可选的
type UserUpdate = DeepPartial<User>;

const update1: UserUpdate = {
  // 只更新 name
  profile: {
    name: "New Name",
    // city, country 不需要
  },
};

const update2: UserUpdate = {
  // 只更新通知设置
  settings: {
    notifications: {
      email: false,
      // push 不需要
    },
  },
};
```

## 组合模式

### DeepRequired - 深度必填

```typescript
type DeepRequired<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
    ? { [K in keyof T]-?: DeepRequired<T[K]> }
    : T;

// 可选变必填
type RequiredConfig = DeepRequired<DeepPartial<Config>>;
```

### DeepNonNullable - 深度非空

```typescript
type DeepNonNullable<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
    ? { [K in keyof T]: DeepNonNullable<NonNullable<T[K]>> }
    : NonNullable<T>;

interface NullableConfig {
  server: {
    host: string | null;
    port: number | undefined;
  };
  database: {
    url: string | null;
  };
}

type NonNullConfig = DeepNonNullable<NullableConfig>;
// string (排除 null 和 undefined)
```

## 带函数处理

### 保留函数类型

```typescript
type DeepReadonlyWithFn<T> = T extends (...args: any[]) => any
  ? T // 保留函数
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonlyWithFn<T[K]> }
    : T;

interface ServiceConfig {
  init: () => void;
  handlers: {
    onSuccess: (data: string) => void;
    onError: (error: Error) => void;
  };
}

type FrozenService = DeepReadonlyWithFn<ServiceConfig>;

// 函数仍然可以调用
const service: FrozenService = {
  init: () => console.log("init"),
  handlers: {
    onSuccess: (data) => console.log(data),
    onError: (err) => console.error(err),
  },
};

// 但不能修改
// service.handlers.onSuccess = () => {}; // Error
```

## 深度限制

### 限制递归深度

```typescript
// 限制深度避免性能问题
type DeepReadonlyLimited<T, Depth extends number = 5> = Depth extends 0
  ? T
  : T extends (...args: any[]) => any
    ? T
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonlyLimited<T[K], [-1, 0, 1, 2, 3, 4][Depth]> }
      : T;

type Config = {
  a: {
    b: {
      c: {
        d: string;
      };
    };
  };
};

type Limited = DeepReadonlyLimited<Config, 2>;

// 只深度 2 层
// {
//   readonly a: {
//     readonly b: {
//       c: { d: string } // 超过深度限制，不递归
//     }
//   }
// }
```

## 实际应用

### 配置合并

DeepPartial<T> = T```typescript
type extends (...args: any[]) => any
? T
: T extends object
? { [K in keyof T]?: DeepPartial<T[K]> }
: T;

function deepMerge<T extends object>(target: T, source: DeepPartial<T>): T {
const result = { ...target };

for (const key in source) {
const sourceValue = source[key];
const targetValue = result[key];

    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      targetValue &&
      typeof targetValue === 'object'
    ) {
      (result as any)[key] = deepMerge(targetValue, sourceValue as any);
    } else if (sourceValue !== undefined) {
      (result as any)[key] = sourceValue;
    }

}

return result;
}

// 使用
const defaultConfig = {
server: {
host: 'localhost',
port: 8080,
ssl: { enabled: true }
},
database: {
url: 'localhost',
pool: { min: 1, max: 10 }
}
};

const userConfig: DeepPartial<typeof defaultConfig> = {
server: {
port: 3000
}
};

const merged = deepMerge(defaultConfig, userConfig);

````

### 配置验证

```typescript
type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

interface Schema {
  server: {
    host: string;
    port: number;
  };
  database: {
    url: string;
  };
}

type UserConfig = DeepPartial<Schema>;

function validate(config: UserConfig): string[] {
  const errors: string[] = [];

  if (!config.server?.host) {
    errors.push('server.host is required');
  }

  if (!config.server?.port) {
    errors.push('server.port is required');
  }

  return errors;
}
````
