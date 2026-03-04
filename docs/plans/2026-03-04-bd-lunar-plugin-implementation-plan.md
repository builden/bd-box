# bd-lunar dayjs 插件扩展实现计划

> **For Claude:** REQUIRED SUB-SKILL: 使用 superpowers:subagent-driven-development 或逐个任务执行

**目标：** 扩展 dayjs-lunar-plugin，新增农历年(LY/Ly)、干支年(LGZY/LGZy)及不带后缀的 token

**架构：** 扩展 LunarReplacers 类型，更新 format.ts 正则和替换逻辑，修改 lunar.ts 获取农历年中文和干支年

**技术栈：** TypeScript, dayjs, lunar-typescript

---

### Task 1: 更新 types.ts - 添加新 token 类型

**文件：**
- 修改: `packages/bd-lunar/src/types.ts`

**Step 1: 添加新 token 类型**

```typescript
// 在 LUNAR_TOKENS 中添加
export const LUNAR_TOKENS = {
  MONTH: 'LM',
  MONTH_SUFFIX:_NO 'Lm',
  DAY: 'LD',
  DAY_NO_SUFFIX: 'Ld',
  HOUR: 'LH',
  HOUR_NO_SUFFIX: 'Lh',
  YEAR: 'LY',
  YEAR_NO_SUFFIX: 'Ly',
  GANZHI_YEAR: 'LGZY',
  GANZHI_YEAR_NO_SUFFIX: 'LGZy',
} as const

// 扩展 LunarReplacers 类型
export type LunarReplacers = {
  LM: string
  Lm: string
  LD: string
  Ld: string
  LH: string
  Lh: string
  LY: string
  Ly: string
  LGZY: string
  LGZy: string
}
```

**Step 2: 运行测试确认没有破坏现有功能**

```bash
cd packages/bd-lunar && bun test
```

**Step 3: 提交**

```bash
git add packages/bd-lunar/src/types.ts
git commit -m "feat(bd-lunar): 添加新 token 类型定义"
```

---

### Task 2: 更新 lunar.ts - 获取农历年中文和干支年

**文件：**
- 修改: `packages/bd-lunar/src/lunar.ts`

**Step 1: 添加年份转中文的辅助函数**

```typescript
const DIGIT_TO_CHINESE = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']

function numberToChinese(num: number): string {
  return String(num).split('').map(d => DIGIT_TO_CHINESE[parseInt(d)]).join('')
}
```

**Step 2: 扩展 LunarInfo 接口**

```typescript
export interface LunarInfo {
  // ... 现有字段
  yearInChinese: string   // 如 "二零二四"
  ganZhiYear: string      // 如 "甲辰"
}
```

**Step 3: 修改 getLunarInfo 函数**

```typescript
export function getLunarInfo(date: Date): LunarInfo {
  const solar = Solar.fromDate(date)
  const lunar = solar.getLunar()

  return {
    year: lunar.getYear(),
    month: lunar.getMonth(),
    day: lunar.getDay(),
    monthInChinese: lunar.getMonthInChinese(),
    dayInChinese: lunar.getDayInChinese(),
    timeZhi: lunar.getTimeZhi(),
    timeInGanZhi: lunar.getTimeInGanZhi(),
    yearInChinese: lunar.getYearInChinese(),
    ganZhiYear: lunar.getGanZhiYear(),
  }
}
```

**Step 4: 运行测试确认没有破坏现有功能**

```bash
cd packages/bd-lunar && bun test
```

**Step 5: 提交**

```bash
git add packages/bd-lunar/src/lunar.ts
git commit -m "feat(bd-lunar): 添加农历年中文和干支年支持"
```

---

### Task 3: 更新 format.ts - 支持新 token 替换

**文件：**
- 修改: `packages/bd-lunar/src/format.ts`

**Step 1: 更新正则表达式**

```typescript
const LUNAR_TOKEN_PATTERN = 'LM|Lm|LD|Ld|LH|Lh|LY|Ly|LGZY|LGZy'
```

**Step 2: 运行测试确认**

```bash
cd packages/bd-lunar && bun test
```

**Step 3: 提交**

```bash
git add packages/bd-lunar/src/format.ts
git commit -m "feat(bd-lunar): 更新 format.ts 支持新 token"
```

---

### Task 4: 更新 dayjs-lunar-plugin.ts - 扩展 getReplacers

**文件：**
- 修改: `packages/bd-lunar/src/dayjs-lunar-plugin.ts`

**Step 1: 扩展 getReplacers 函数**

```typescript
function getReplacers(instance: Dayjs): LunarReplacers {
  const lunar = getLunarInfo(instance.toDate())
  return {
    LM: lunar.monthInChinese,
    Lm: lunar.monthInChinese.replace('月', ''),
    LD: lunar.dayInChinese,
    Ld: lunar.dayInChinese.replace('日', ''),
    LH: getShichen(instance.toDate()),
    Lh: getShichen(instance.toDate()).replace('时', ''),
    LY: lunar.yearInChinese + '年',
    Ly: lunar.yearInChinese,
    LGZY: lunar.ganZhiYear + '年',
    LGZy: lunar.ganZhiYear,
  }
}
```

**Step 2: 运行测试确认**

```bash
cd packages/bd-lunar && bun test
```

**Step 3: 提交**

```bash
git add packages/bd-lunar/src/dayjs-lunar-plugin.ts
git commit -m "feat(bd-lunar): 扩展 getReplacers 支持新 token"
```

---

### Task 5: 添加一月到十二月的测试用例

**文件：**
- 修改: `packages/bd-lunar/src/dayjs-lunar-plugin.test.ts`

**Step 1: 添加 LM/Lm 一月至十二月测试**

```typescript
describe('format LM/Lm (农历月)', () => {
  const monthTests = [
    { date: '2024-01-10', lm: '正月', lmNoSuffix: '正' },    // 202
    { date4年正月: '2024-02-09', lm: '二月', lmNoSuffix: '二' },    // 2024年二月
    { date: '2024-03-10', lm: '三月', lmNoSuffix: '三' },    // 2024年三月
    { date: '2024-04-09', lm: '四月', lmNoSuffix: '四' },    // 2024年四月
    { date: '2024-05-09', lm: '五月', lmNoSuffix: '五' },    // 2024年五月
    { date: '2024-06-06', lm: '六月', lmNoSuffix: '六' },    // 2024年六月
    { date: '2024-07-06', lm: '七月', lmNoSuffix: '七' },    // 2024年七月
    { date: '2024-08-04', lm: '八月', lmNoSuffix: '八' },    // 2024年八月
    { date: '2024-09-03', lm: '九月', lmNoSuffix: '九' },    // 2024年九月
    { date: '2024-10-03', lm: '十月', lmNoSuffix: '十' },    // 2024年十月
    { date: '2024-11-01', lm: '冬月', lmNoSuffix: '冬' },    // 2024年冬月
    { date: '2024-12-01', lm: '腊月', lmNoSuffix: '腊' },    // 2024年腊月
  ]

  monthTests.forEach(({ date, lm, lmNoSuffix }) => {
    it(`should format ${date} as ${lm}`, () => {
      expect(dayjs(date).format('LM')).toBe(lm)
    })
    it(`should format ${date} as ${lmNoSuffix} without suffix`, () => {
      expect(dayjs(date).format('Lm')).toBe(lmNoSuffix)
    })
  })
})
```

**Step 2: 运行测试确认**

```bash
cd packages/bd-lunar && bun test
```

**Step 3: 提交**

```bash
git add packages/bd-lunar/src/dayjs-lunar-plugin.test.ts
git commit -m "test(bd-lunar): 添加一月到十二月 LM/Lm 测试"
```

---

### Task 6: 添加 YYYY/LY 混用格式化测试

**文件：**
- 修改: `packages/bd-lunar/src/dayjs-lunar-plugin.test.ts`

**Step 1: 添加混用测试用例**

```typescript
describe('format LY/Ly (农历年)', () => {
  it('should format LY with year suffix', () => {
    expect(dayjs('2024-06-15').format('LY')).toBe('二零二四年')
  })

  it('should format Ly without year suffix', () => {
    expect(dayjs('2024-06-15').format('Ly')).toBe('二零二四')
  })

  it('should format LGZY with year suffix', () => {
    expect(dayjs('2024-06-15').format('LGZY')).toBe('甲辰年')
  })

  it('should format LGZy without year suffix', () => {
    expect(dayjs('2024-06-15').format('LGZy')).toBe('甲辰')
  })
})

describe('format combined tokens', () => {
  it('should format YYYY with LY', () => {
    expect(dayjs('2024-06-15').format('YYYY年LY')).toBe('2024年二零二四年')
  })

  it('should format full lunar date', () => {
    expect(dayjs('2024-06-15').format('YYYY年LY年LM月LD日')).toBe('2024年二零二四年五月十五日')
  })

  it('should format with mixed tokens', () => {
    expect(dayjs('2024-06-15 14:30:00').format('YYYY年LY年LM月LD日 Lh')).toBe('2024年二零二四年五月十五日 未')
  })
})
```

**Step 2: 运行测试确认**

```bash
cd packages/bd-lunar && bun test
```

**Step 3: 提交**

```bash
git add packages/bd-lunar/src/dayjs-lunar-plugin.test.ts
git commit -m "test(bd-lunar): 添加 LY/LGZY 混用格式化测试"
```

---

### Task 7: 运行全部测试并验证

**Step 1: 运行全部测试**

```bash
cd packages/bd-lunar && bun test
```

**Step 2: 运行构建**

```bash
cd packages/bd-lunar && bun run build
```

**Step 3: 最终提交**

```bash
git add -A && git commit -m "feat(bd-lunar): 扩展 dayjs 插件，支持 LY/Ly/LM/Lm/LD/Ld/LH/Lh/LGZY/LGZy"
```

---

## 执行选项

**Plan complete and saved to `docs/plans/2026-03-04-bd-lunar-dayjs-plugin-extension-design.md`.**

两个执行选项：

1. **Subagent-Driven (当前会话)** - 每个任务派一个新 subagent，任务间审查，快速迭代

2. **逐个任务执行** - 我在当前会话中逐个执行任务

选择哪个方式？
