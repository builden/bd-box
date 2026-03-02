import { describe, it, expect } from 'bun:test'
import { getShichen, SHICHEN_LIST, ZHI_LIST } from '../src/shichen'

describe('shichen 工具', () => {
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
  })
})
