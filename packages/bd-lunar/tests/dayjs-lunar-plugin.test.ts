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
  describe('format LM (农历月)', () => {
    it('should format normal lunar month', () => {
      const result = dayjs('2024-06-15').format('LM')
      expect(result).toBe('五')
    })

    it('should format lunar month with leap prefix', () => {
      // 2023年闰二月
      const result = dayjs('2023-04-05').format('LM')
      expect(result).toBe('闰二')
    })
  })

  describe('format LD (农历日)', () => {
    it('should format lunar day 1-10', () => {
      expect(dayjs('2024-06-10').format('LD')).toBe('初五')
      expect(dayjs('2024-06-15').format('LD')).toBe('初十')
    })

    it('should format lunar day 11-20', () => {
      expect(dayjs('2024-06-20').format('LD')).toBe('十五')
    })

    it('should format lunar day 21-30', () => {
      expect(dayjs('2024-06-25').format('LD')).toBe('二十')
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
  })

  describe('format with escaped brackets', () => {
    it('should preserve escaped brackets', () => {
      const result = dayjs('2024-06-15').format('[LM is] LM')
      expect(result).toBe('LM is 五')
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
      const result = dayjs('2024-12-01').format('LM月LD')
      expect(result).toBe('冬月初一')
    })
  })
})
