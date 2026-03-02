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
})
