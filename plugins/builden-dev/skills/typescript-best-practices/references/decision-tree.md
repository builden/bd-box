# 类型决策树

根据具体场景选择合适的类型解决方案。

## 目录

- [选择原则](#选择原则)
- [第三方库场景](#第三方库场景)
- [类型提取场景](#类型提取场景)
- [类型安全场景](#类型安全场景)

## 选择原则

```
1. 第三方库无类型？
   → declare module 扩展 + unknown

2. 复杂嵌套对象？
   → 递归类型 (DeepReadonly/Partial)

3. 多个可能类型？
   → 联合类型 + discriminated unions

4. 需要从现有类型提取部分？
   → Pick, Omit, Extract

5. 需要从函数提取返回类型？
   → ReturnType<typeof fn>

6. 需要防止原始类型混淆？
   → Branded Types

7. 都不确定，但需要安全处理？
   → unknown + 类型守卫
```

## 第三方库场景

| 场景             | 解决方案                     |
| ---------------- | ---------------------------- |
| 库完全没有类型   | `declare module` + `unknown` |
| 库有部分类型     | 安装 `@types/xxx`            |
| 需要扩展已有类型 | `declare module` 合并        |

## 类型提取场景

| 场景             | 解决方案                            |
| ---------------- | ----------------------------------- |
| 提取函数返回类型 | `ReturnType<typeof fn>`             |
| 提取函数参数     | `Parameters<typeof fn>`             |
| 提取数组元素     | `T extends (infer U)[] ? U : never` |
| 提取对象属性     | `Pick<T, K>` 或 `T[K]`              |

## 类型安全场景

| 场景         | 解决方案             |
| ------------ | -------------------- |
| 处理外部输入 | `unknown` + 类型守卫 |
| 防止类型混淆 | Branded Types        |
| 深度只读     | `DeepReadonly<T>`    |
| 深度可选     | `DeepPartial<T>`     |
