# @builden/bd-lunar

农历工具包，提供阳历阴历转换、时辰计算等功能。

## 安装

```bash
npm install @builden/bd-lunar
```

## 功能

### dayjs 插件

```typescript
import dayjs from "dayjs";
import lunarPlugin from "@builden/bd-lunar";

dayjs.extend(lunarPlugin);

dayjs().format("YYYY年M月D日");
// => "2026年3月4日"
```

#### 格式化 Token

| Token | 含义 | 示例输出 |
|-------|------|----------|
| `LY` | 农历年（带"年"后缀） | 二〇二六年 |
| `Ly` | 农历年（不带"年"后缀） | 二〇二六 |
| `LM` | 农历月（带"月"后缀） | `Lm` | 农历月（ 五月 |
|不带"月"后缀） | 五 |
| `LD` | 农历日（带"日"后缀） | 十五日 |
| `Ld` | 农历日（不带"日"后缀） | 十五 |
| `LH` | 时辰（带"时"后缀） | 寅时 |
| `Lh` | 时辰（不带"时"后缀） | 寅 |
| `LGZY` | 干支年（带"年"后缀） | 丙辰年 |
| `LGZy` | 干支年（不带"年"后缀） | 丙辰 |

**上下文感知**：当 token 后面跟着对应的后缀时，会自动使用不带后缀的版本，避免重复：

```typescript
dayjs('2024-06-15').format('YYYY年LM月LD日')
// => "2024年五月十五日" （不是 "2024年五月月十五日"）

dayjs('2024-06-15').format('YYYY年LY年')
// => "2024年二〇二四年" （不是 "2024年二〇二四年年"）
```

**完整示例**：

```typescript
dayjs('2024-06-15 14:30:00').format('YYYY年LY年LM月LD日 Lh')
// => "2024年二〇二四年五月初十日 未"

dayjs('2024-06-15').format('YYYY年LGZY年')
// => "2024年甲辰年"
```

#### dayjs.lunar() 工厂方法

```typescript
// 创建农历日期
const d = dayjs.lunar(2024, 5, 15);  // 农历2024年五月十五
d.format('YYYY-MM-DD');
// => "2024-06-20"

// 闰月支持（负数月份）
const leap = dayjs.lunar(2023, -2, 15);  // 2023年闰二月十五
leap.format('YYYY-MM-DD');
// => "2023-04-05"
```

### 农历转换

```typescript
import { solarToLunar, lunarToSolar, getLunarInfo } from "@builden/bd-lunar";

// 阳历转阴历（getLunarInfo 的别名，两者等价）
const info = solarToLunar(new Date('2026-03-04'));
// 或
const info2 = getLunarInfo(new Date('2026-03-04'));

// 返回字段说明
console.log(info);
// => {
//   year: 2026,           // 农历年
//   month: 1,            // 农历月（1-12，负数表示闰月）
//   day: 16,             // 农历日（1-30）
//   yearInChinese: '二〇二六',  // 农历年中文
//   ganZhiYear: '丙辰',  // 干支年
//   monthInChinese: '正月',     // 农历月中文（含闰前缀）
//   dayInChinese: '十六',      // 农历日中文
//   timeZhi: '寅',       // 时辰地支
//   timeInGanZhi: '甲寅' // 时辰天干地支
// }

// 阴历转阳历
const solar = lunarToSolar(2026, 1, 16);
console.log(solar);
// => Date 对象

// 阴历转阳历（带时间）
const solarWithTime = lunarToSolar(2026, 1, 16, 14, 30, 0);
console.log(solarWithTime);
// => Date 对象
```

**注意**：`solarToLunar` / `getLunarInfo` 只接受 `Date` 对象参数，不支持传年月日数字。

### 时辰计算

```typescript
import { getShichen, getTimeZhi, SHICHEN_LIST } from "@builden/bd-lunar";

// 获取当前时辰（带"时"后缀）
const shichen = getShichen(new Date());
console.log(shichen);
// => "寅时"

// 获取当前时辰地支（不带"时"后缀）
const zhi = getTimeZhi(new Date());
console.log(zhi);
// => "寅"

// 十二时辰列表
console.log(SHICHEN_LIST);
// => ["子时", "丑时", "寅时", ...]
```

## 类型

详见 `dist/index.d.ts`
