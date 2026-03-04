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

### 农历转换

```typescript
import { solarToLunar, lunarToSolar, getLunarInfo } from "@builden/bd-lunar";

// 阳历转阴历
const lunar = solarToLunar(2026, 3, 4);
console.log(lunar);
// => { year: 2026, month: 1, day: 16, isLeap: false, ... }

// 阴历转阳历
const solar = lunarToSolar(2026, 1, 16);
console.log(solar);
// => { year: 2026, month: 3, day: 4 }

// 获取农历信息
const info = getLunarInfo(new Date());
```

### 时辰计算

```typescript
import { getShichen, SHICHEN_LIST } from "@builden/bd-lunar";

// 获取当前时辰
const shichen = getShichen(new Date());
console.log(shichen);
// => "寅时"

// 十二时辰列表
console.log(SHICHEN_LIST);
// => ["子时", "丑时", "寅时", ...]
```

## 类型

详见 `dist/index.d.ts`
