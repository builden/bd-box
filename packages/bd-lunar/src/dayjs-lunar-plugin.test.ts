import { describe, it, expect } from 'bun:test'
import dayjs, { type Dayjs } from 'dayjs'
import { dayjsLunarPlugin } from '../src/dayjs-lunar-plugin'

// 扩展 dayjs
dayjs.extend(dayjsLunarPlugin)

// 添加 dayjs.lunar() 类型声明
declare module 'dayjs' {
  interface Dayjs {
    lunar: (year: number, month?: number, day?: number, hour?: number, minute?: number, second?: number) => Dayjs
  }
}

describe('dayjs-lunar-plugin', () => {
  describe('format LM/Lm (农历月)', () => {
    // LM 带"月"后缀，Lm 不带
    it('should format normal lunar month with suffix', () => {
      const result = dayjs('2024-06-15').format('LM')
      expect(result).toBe('五月')
    })

    it('should format lunar month without suffix', () => {
      const result = dayjs('2024-06-15').format('Lm')
      expect(result).toBe('五')
    })

    it('should format lunar month with leap prefix', () => {
      // 2023年闰二月
      const result = dayjs('2023-04-05').format('LM')
      expect(result).toBe('闰二月')
    })

    // 一月至十二月测试
    const monthTests = [
      { date: '2024-02-10', lm: '正月', lmNoSuffix: '正' },
      { date: '2024-03-10', lm: '二月', lmNoSuffix: '二' },
      { date: '2024-04-09', lm: '三月', lmNoSuffix: '三' },
      { date: '2024-05-08', lm: '四月', lmNoSuffix: '四' },
      { date: '2024-06-06', lm: '五月', lmNoSuffix: '五' },
      { date: '2024-07-06', lm: '六月', lmNoSuffix: '六' },
      { date: '2024-08-04', lm: '七月', lmNoSuffix: '七' },
      { date: '2024-09-03', lm: '八月', lmNoSuffix: '八' },
      { date: '2024-10-03', lm: '九月', lmNoSuffix: '九' },
      { date: '2024-11-01', lm: '十月', lmNoSuffix: '十' },
      { date: '2024-12-01', lm: '冬月', lmNoSuffix: '冬' },
      { date: '2024-12-31', lm: '腊月', lmNoSuffix: '腊' },
    ]

    monthTests.forEach(({ date, lm, lmNoSuffix }) => {
      it(`should format ${date} as LM=${lm}`, () => {
        expect(dayjs(date).format('LM')).toBe(lm)
      })
      it(`should format ${date} as Lm=${lmNoSuffix}`, () => {
        expect(dayjs(date).format('Lm')).toBe(lmNoSuffix)
      })
    })
  })

  describe('format LD/Ld (农历日)', () => {
    // LD 带"日"后缀，Ld 不带
    it('should format lunar day 1-10 with suffix', () => {
      expect(dayjs('2024-06-10').format('LD')).toBe('初五日')
      expect(dayjs('2024-06-15').format('LD')).toBe('初十日')
    })

    it('should format lunar day without suffix', () => {
      expect(dayjs('2024-06-10').format('Ld')).toBe('初五')
      expect(dayjs('2024-06-15').format('Ld')).toBe('初十')
    })

    it('should format lunar day 11-20 with suffix', () => {
      expect(dayjs('2024-06-20').format('LD')).toBe('十五日')
    })

    it('should format lunar day 21-30 with suffix', () => {
      expect(dayjs('2024-06-25').format('LD')).toBe('二十日')
    })
  })

  describe('format LH (时辰)', () => {
    it('should format zi shichen (23:00-01:00)', () => {
      expect(dayjs('2024-06-15 00:30:00').format('LH')).toBe('子时')
    })

    it('should format chou shichen (01:00-03:00)', () => {
      expect(dayjs('2024-06-15 02:00:00').format('LH')).toBe('丑时')
    })

    it('should format yin shichen (03:00-05:00)', () => {
      expect(dayjs('2024-06-15 04:00:00').format('LH')).toBe('寅时')
    })

    it('should format wei shichen (13:00-15:00)', () => {
      expect(dayjs('2024-06-15 14:30:00').format('LH')).toBe('未时')
    })

    it('should format hai shichen (21:00-23:00)', () => {
      expect(dayjs('2024-06-15 22:00:00').format('LH')).toBe('亥时')
    })
  })

  describe('format combined tokens', () => {
    it('should format LM and LD together', () => {
      const result = dayjs('2024-06-20').format('YYYY年LM月LD日')
      expect(result).toBe('2024年五月十五日')
    })

    it('should format all lunar tokens together', () => {
      const result = dayjs('2024-06-15 14:30:00').format('YYYY年LM月LD日 LH')
      expect(result).toBe('2024年五月初十日 未时')
    })

    it('should format LM without month suffix when followed by 月', () => {
      // 2024-06-15 是农历五月初十
      const result = dayjs('2024-06-15').format('LM月LD日')
      expect(result).toBe('五月初十日')
    })
  })

  describe('format LY/Ly (农历年)', () => {
    it('should format LY with year suffix', () => {
      expect(dayjs('2024-06-15').format('LY')).toBe('二〇二四年')
    })

    it('should format Ly without year suffix', () => {
      expect(dayjs('2024-06-15').format('Ly')).toBe('二〇二四')
    })

    it('should format LGZY with year suffix', () => {
      expect(dayjs('2024-06-15').format('LGZY')).toBe('甲辰年')
    })

    it('should format LGZy without year suffix', () => {
      expect(dayjs('2024-06-15').format('LGZy')).toBe('甲辰')
    })
  })

  describe('format combined tokens with LY', () => {
    it('should format YYYY with LY', () => {
      expect(dayjs('2024-06-15').format('YYYY年LY')).toBe('2024年二〇二四年')
    })

    it('should format full lunar date with LY', () => {
      expect(dayjs('2024-06-15').format('YYYY年LY年LM月LD日')).toBe('2024年二〇二四年五月初十日')
    })

    it('should format with mixed tokens', () => {
      expect(dayjs('2024-06-15 14:30:00').format('YYYY年LY年LM月LD日 Lh')).toBe('2024年二〇二四年五月初十日 未')
    })

    it('should format with LGZY', () => {
      expect(dayjs('2024-06-15').format('YYYY年LGZY年')).toBe('2024年甲辰年')
    })
  })

  describe('format with escaped brackets', () => {
    it('should preserve escaped brackets', () => {
      const result = dayjs('2024-06-15').format('[LM is] LM')
      expect(result).toBe('LM is 五月')
    })
  })

  describe('dayjs.lunar() factory', () => {
    it('should create dayjs from lunar date', () => {
      const d = dayjs.lunar(2024, 5, 15)
      expect(d.format('YYYY-MM-DD')).toBe('2024-06-20')
    })

    it('should create dayjs from lunar date with time', () => {
      const d = dayjs.lunar(2024, 5, 15, 14, 30, 0)
      expect(d.format('YYYY-MM-DD HH:mm:ss')).toBe('2024-06-20 14:30:00')
    })

    it('should handle leap month (negative month)', () => {
      // 2023年闰二月十五 -> 2023-04-05
      const d = dayjs.lunar(2023, -2, 15)
      expect(d.format('YYYY-MM-DD')).toBe('2023-04-05')
    })

    it('should create with specified month and day', () => {
      // 传入 month 和 day 参数
      const d = dayjs.lunar(2024, 1, 1)
      // 2024年正月初一 -> 2024-01-10 (根据 lunar-typescript 计算)
      expect(d.date()).toBe(10)
    })
  })

  describe('edge cases', () => {
    it('should handle invalid date', () => {
      const d = dayjs('')
      expect(d.format('LM')).toBe('Invalid Date')
    })

    it('should handle format without lunar tokens', () => {
      const result = dayjs('2024-06-15').format('YYYY-MM-DD')
      expect(result).toBe('2024-06-15')
    })

    it('should handle year-end dates', () => {
      // 2024年冬月初一
      const result = dayjs('2024-12-01').format('LM月Ld')
      expect(result).toBe('冬月初一')
    })

    it('should handle empty format string', () => {
      // dayjs 空格式返回 ISO 字符串
      const result = dayjs('2024-06-15').format('')
      expect(result).toMatch(/^2024-06-15T00:00:00/)
    })

    it('should handle Chinese New Year', () => {
      // 2024年春节: 2024-02-10
      const result = dayjs('2024-02-10').format('YYYY年LM月LD日')
      expect(result).toBe('2024年正月初一日')
    })

    it('should handle leap month format', () => {
      // 2023年闰二月十五
      const result = dayjs('2023-04-05').format('LM月LD日')
      expect(result).toBe('闰二月十五日')
    })

    it('should handle all shichen formats with getShichen', () => {
      // 验证 LH 使用了 getShichen 函数（返回带"时"后缀）
      const testCases = [
        { time: '2024-06-15 00:30:00', expected: '子时' },
        { time: '2024-06-15 02:30:00', expected: '丑时' },
        { time: '2024-06-15 04:30:00', expected: '寅时' },
        { time: '2024-06-15 06:30:00', expected: '卯时' },
        { time: '2024-06-15 08:30:00', expected: '辰时' },
        { time: '2024-06-15 10:30:00', expected: '巳时' },
        { time: '2024-06-15 12:30:00', expected: '午时' },
        { time: '2024-06-15 14:30:00', expected: '未时' },
        { time: '2024-06-15 16:30:00', expected: '申时' },
        { time: '2024-06-15 18:30:00', expected: '酉时' },
        { time: '2024-06-15 20:30:00', expected: '戌时' },
        { time: '2024-06-15 22:30:00', expected: '亥时' },
      ]

      for (const { time, expected } of testCases) {
        expect(dayjs(time).format('LH')).toBe(expected)
      }
    })

    it('should handle dayjs.lunar with default parameters', () => {
      // 只传入年份
      const d = dayjs.lunar(2024)
      expect(d.isValid()).toBe(true)
    })

    it('should handle dayjs.lunar with leap month', () => {
      // 2023年闰二月廿七
      const d = dayjs.lunar(2023, -2, 27)
      expect(d.format('YYYY-MM-DD')).toBe('2023-04-17')
    })
  })
})
