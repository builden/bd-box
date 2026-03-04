import { describe, it, expect } from 'bun:test'
import { getShichen, getTimeZhi, SHICHEN_LIST, ZHI_LIST } from '../src/shichen'

describe('shichen 工具', () => {
  describe('getTimeZhi', () => {
    it('should get time zhi without suffix', () => {
      expect(getTimeZhi(new Date('2024-06-15 14:30:00'))).toBe('未')
    })

    it('should get zi zhi', () => {
      expect(getTimeZhi(new Date('2024-06-15 00:30:00'))).toBe('子')
    })

    it('should get hai zhi', () => {
      expect(getTimeZhi(new Date('2024-06-15 22:00:00'))).toBe('亥')
    })
  })

  describe('getShichen', () => {
    it('should get wei shichen (13:00-15:00)', () => {
      expect(getShichen(new Date('2024-06-15 14:30:00'))).toBe('未时')
    })

    it('should get zi shichen (23:00-01:00)', () => {
      expect(getShichen(new Date('2024-06-15 00:30:00'))).toBe('子时')
    })

    it('should get hai shichen (21:00-23:00)', () => {
      expect(getShichen(new Date('2024-06-15 22:00:00'))).toBe('亥时')
    })
  })

  describe('SHICHEN_LIST', () => {
    it('should have 12 items', () => {
      expect(SHICHEN_LIST).toHaveLength(12)
    })

    it('should contain all shichen', () => {
      expect(SHICHEN_LIST).toContain('子时')
      expect(SHICHEN_LIST).toContain('午时')
      expect(SHICHEN_LIST).toContain('亥时')
    })
  })

  describe('ZHI_LIST', () => {
    it('should have 12 items', () => {
      expect(ZHI_LIST).toHaveLength(12)
    })

    it('should contain all zhi', () => {
      expect(ZHI_LIST).toContain('子')
      expect(ZHI_LIST).toContain('午')
      expect(ZHI_LIST).toContain('亥')
    })

    it('should have correct order', () => {
      expect(ZHI_LIST[0]).toBe('子')
      expect(ZHI_LIST[6]).toBe('午')
      expect(ZHI_LIST[11]).toBe('亥')
    })
  })

  describe('SHICHEN_LIST', () => {
    it('should have correct order matching ZHI_LIST', () => {
      for (let i = 0; i < 12; i++) {
        expect(SHICHEN_LIST[i]).toBe(ZHI_LIST[i] + '时')
      }
    })

    it('should cover all traditional Chinese hours', () => {
      const expected = [
        '子时', '丑时', '寅时', '卯时', '辰时', '巳时',
        '午时', '未时', '申时', '酉时', '戌时', '亥时',
      ]
      expect(SHICHEN_LIST).toEqual(expected)
    })
  })

  describe('edge cases', () => {
    it('should handle exact hour boundaries', () => {
      // 子时: 23:00 - 01:00
      expect(getShichen(new Date('2024-06-15 23:00:00'))).toBe('子时')
      expect(getShichen(new Date('2024-06-15 00:59:59'))).toBe('子时')
      expect(getShichen(new Date('2024-06-15 01:00:00'))).toBe('丑时')
    })

    it('should handle all twelve shichen', () => {
      const testCases = [
        { time: '2024-06-15 01:30:00', expected: '丑时' },
        { time: '2024-06-15 03:30:00', expected: '寅时' },
        { time: '2024-06-15 05:30:00', expected: '卯时' },
        { time: '2024-06-15 07:30:00', expected: '辰时' },
        { time: '2024-06-15 09:30:00', expected: '巳时' },
        { time: '2024-06-15 11:30:00', expected: '午时' },
        { time: '2024-06-15 13:30:00', expected: '未时' },
        { time: '2024-06-15 15:30:00', expected: '申时' },
        { time: '2024-06-15 17:30:00', expected: '酉时' },
        { time: '2024-06-15 19:30:00', expected: '戌时' },
        { time: '2024-06-15 21:30:00', expected: '亥时' },
      ]

      for (const { time, expected } of testCases) {
        expect(getShichen(new Date(time))).toBe(expected)
      }
    })
  })
})
