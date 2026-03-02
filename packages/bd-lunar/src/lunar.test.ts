import { describe, it, expect } from 'bun:test'
import {
  getLunarInfo,
  lunarToSolar,
  solarToLunar,
  type LunarInfo,
} from '../src/lunar'

describe('lunar 工具', () => {
  describe('getLunarInfo', () => {
    it('should get lunar info from date', () => {
      const info = getLunarInfo(new Date('2024-06-15'))
      expect(info.year).toBe(2024)
      expect(info.month).toBe(5)
      expect(info.day).toBe(10)
      expect(info.monthInChinese).toBe('五')
      expect(info.dayInChinese).toBe('初十')
    })

    it('should get leap month info', () => {
      // 2023年闰二月
      const info = getLunarInfo(new Date('2023-04-05'))
      expect(info.monthInChinese).toBe('闰二')
    })

    it('should get time info', () => {
      const info = getLunarInfo(new Date('2024-06-15 14:30:00'))
      expect(info.timeZhi).toBe('未')
      expect(info.timeInGanZhi).toBe('癸未')
    })
  })

  describe('lunarToSolar', () => {
    it('should convert lunar to solar', () => {
      const date = lunarToSolar(2024, 5, 15)
      expect(date.getFullYear()).toBe(2024)
      expect(date.getMonth()).toBe(5) // 6月 (0-indexed)
      expect(date.getDate()).toBe(20)
    })

    it('should handle leap month', () => {
      const date = lunarToSolar(2023, -2, 15)
      expect(date.getFullYear()).toBe(2023)
      expect(date.getMonth()).toBe(3) // 4月
      expect(date.getDate()).toBe(5)
    })

    it('should handle time parameters', () => {
      const date = lunarToSolar(2024, 5, 15, 14, 30, 45)
      expect(date.getHours()).toBe(14)
      expect(date.getMinutes()).toBe(30)
      expect(date.getSeconds()).toBe(45)
    })
  })

  describe('solarToLunar', () => {
    it('should convert solar to lunar', () => {
      const info = solarToLunar(new Date('2024-06-15'))
      expect(info.year).toBe(2024)
      expect(info.month).toBe(5)
      expect(info.day).toBe(10)
    })

    it('should be inverse of lunarToSolar', () => {
      const original = new Date('2024-06-15 14:30:00')
      const lunar = solarToLunar(original)
      const back = lunarToSolar(lunar.year, lunar.month, lunar.day, 14, 30, 0)
      expect(back.getDate()).toBe(original.getDate())
    })
  })

  describe('edge cases', () => {
    it('should handle Chinese New Year', () => {
      // 2024年春节: 2024-02-10
      const info = getLunarInfo(new Date('2024-02-10'))
      expect(info.year).toBe(2024)
      expect(info.month).toBe(1)
      expect(info.day).toBe(1)
      expect(info.monthInChinese).toBe('正')
      expect(info.dayInChinese).toBe('初一')
    })

    it('should handle Chinese New Year Eve', () => {
      // 2024年除夕: 2024-02-09 农历是2023年腊月三十
      const info = getLunarInfo(new Date('2024-02-09'))
      expect(info.year).toBe(2023)
      expect(info.month).toBe(12)
      expect(info.dayInChinese).toBe('三十')
    })

    it('should handle year-end date', () => {
      // 2024年12月31日是农历2024年腊月初一
      const info = getLunarInfo(new Date('2024-12-31'))
      expect(info.year).toBe(2024)
      expect(info.monthInChinese).toBe('腊')
      expect(info.dayInChinese).toBe('初一')
    })

    it('should handle midnight', () => {
      const info = getLunarInfo(new Date('2024-06-15 00:00:00'))
      expect(info.timeZhi).toBe('子')
    })

    it('should handle noon', () => {
      const info = getLunarInfo(new Date('2024-06-15 12:00:00'))
      expect(info.timeZhi).toBe('午')
    })

    it('should handle all twelve shichen hours', () => {
      // 测试所有12个时辰
      const times = [
        { time: '00:30:00', expectedZhi: '子' },
        { time: '02:30:00', expectedZhi: '丑' },
        { time: '04:30:00', expectedZhi: '寅' },
        { time: '06:30:00', expectedZhi: '卯' },
        { time: '08:30:00', expectedZhi: '辰' },
        { time: '10:30:00', expectedZhi: '巳' },
        { time: '12:30:00', expectedZhi: '午' },
        { time: '14:30:00', expectedZhi: '未' },
        { time: '16:30:00', expectedZhi: '申' },
        { time: '18:30:00', expectedZhi: '酉' },
        { time: '20:30:00', expectedZhi: '戌' },
        { time: '22:30:00', expectedZhi: '亥' },
      ]

      for (const { time, expectedZhi } of times) {
        const info = getLunarInfo(new Date(`2024-06-15 ${time}`))
        expect(info.timeZhi).toBe(expectedZhi)
      }
    })
  })
})
