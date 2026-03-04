# bd-lunar dayjs 插件扩展设计

## 概述

扩展 bd-lunar 的 dayjs 插件，新增农历年、干支年及对应的"带/不带"后缀格式化 token。

## 背景

当前 dayjs-lunar-plugin 只支持 LM（农历月）、LD（农历日）、LH（时辰），需要增加农历年（LY/Ly）和干支年（LGZY/LGZy）的支持。

## 需求

| Token | 含义                   | 示例输出   |
| ----- | ---------------------- | ---------- |
| LY    | 农历年（带"年"后缀）   | 二零二四年 |
| Ly    | 农历年（不带"年"后缀） | 二零二四   |
| LM    | 农历月（带"月"后缀）   | 五月       |
| Lm    | 农历月（不带"月"后缀） | 五         |
| LD    | 农历日（带"日"后缀）   | 十五日     |
| Ld    | 农历日（不带"日"后缀） | 十五       |
| LH    | 时辰（带"时"后缀）     | 子时       |
| Lh    | 时辰（不带"时"后缀）   | 子         |
| LGZY  | 干支年（带"年"后缀）   | 甲辰年     |
| LGZy  | 干支年（不带"年"后缀） | 甲辰       |

### 测试用例需求

1. **一月到十二月的完整测试**：验证每个月都能正确格式化
2. **YYYY/LY 混用格式化**：如 `YYYY年LY月LM月LD日`

## 实现方案

### 1. 修改 types.ts

- 扩展 `LunarReplacers` 类型，添加新 token
- 扩展 `LUNAR_TOKENS` 常量

### 2. 修改 format.ts

- 更新正则表达式支持新 token
- 实现年份数字转中文的辅助函数

### 3. 修改 lunar.ts

- 扩展 `LunarInfo` 接口，添加 `yearInChinese`（农历年中文）和 `ganZhiYear`（干支年）
- 修改 `getLunarInfo` 函数获取这些信息

### 4. 修改 dayjs-lunar-plugin.ts

- 扩展 `getReplacers` 函数返回新的替换值

### 5. 修改 dayjs-lunar-plugin.test.ts

- 添加一月到十二月的测试用例
- 添加 YYYY/LY 混用格式化测试用例

## 测试用例设计

### 一月至十二月测试

```typescript
describe("format LM/Lm (农历月)", () => {
  const months = [
    { date: "2024-01-10", lm: "正月", lmNoSuffix: "正" },
    { date: "2024-02-09", lm: "二月", lmNoSuffix: "二" },
    // ... 到十二月
  ];
});
```

### 混用格式化测试

```typescript
it("should format YYYY with LY", () => {
  expect(dayjs("2024-06-15").format("YYYY年LY")).toBe("2024年二零二四年");
});
```

## 依赖

- `lunar-typescript`: 已有的农历库，提供 `getYearInChinese()` 和 `getGanZhiYear()` 方法
