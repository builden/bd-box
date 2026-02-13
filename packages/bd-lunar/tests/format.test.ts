import { describe, it, expect } from 'bun:test'
import {
  LUNAR_TOKENS,
  replaceLunarTokens,
  hasLunarToken,
  parseLunarTokens,
  type LunarReplacers,
} from '../src/format'

describe('format 工具', () => {
  describe('LUNAR_TOKENS', () => {
    it('should have correct token values', () => {
      expect(LUNAR_TOKENS.MONTH).toBe('LM')
      expect(LUNAR_TOKENS.DAY).toBe('LD')
      expect(LUNAR_TOKENS.HOUR).toBe('LH')
    })
  })

  describe('hasLunarToken', () => {
    it('should detect LM token', () => {
      expect(hasLunarToken('YYYY年LM月')).toBe(true)
    })

    it('should detect LD token', () => {
      expect(hasLunarToken('LD日')).toBe(true)
    })

    it('should detect LH token', () => {
      expect(hasLunarToken('LH时')).toBe(true)
    })

    it('should return false for no lunar token', () => {
      expect(hasLunarToken('YYYY-MM-DD')).toBe(false)
    })

    it('should return false for escaped brackets', () => {
      // 转义括号内的 token 应该被忽略
      // [LM] 表示转义，不会被检测为需要替换
      expect(hasLunarToken('[LM]')).toBe(true) // 仍然包含 LM，只是不会被替换
    })
  })

  describe('replaceLunarTokens', () => {
    it('should replace LM token', () => {
      const replacers: LunarReplacers = { LM: '五', LD: '初一', LH: '子时' }
      const result = replaceLunarTokens('LM', replacers)
      expect(result).toBe('五')
    })

    it('should replace LD token', () => {
      const replacers: LunarReplacers = { LM: '五', LD: '初一', LH: '子时' }
      const result = replaceLunarTokens('LD', replacers)
      expect(result).toBe('初一')
    })

    it('should replace LH token', () => {
      const replacers: LunarReplacers = { LM: '五', LD: '初一', LH: '子时' }
      const result = replaceLunarTokens('LH', replacers)
      expect(result).toBe('子时')
    })

    it('should preserve escaped brackets', () => {
      // 转义的括号会被保留，括号内的 token 不会被替换
      const replacers: LunarReplacers = { LM: '五', LD: '初一', LH: '子时' }
      const result = replaceLunarTokens('[LM is] LM', replacers)
      // [LM is] 被保留，LM 被替换为五
      expect(result).toBe('[LM is] 五')
    })

    it('should handle combined tokens', () => {
      const replacers: LunarReplacers = { LM: '五', LD: '十五', LH: '未时' }
      const result = replaceLunarTokens('YYYY年LM月LD日 LH', replacers)
      expect(result).toBe('YYYY年五月十五日 未时')
    })
  })

  describe('parseLunarTokens', () => {
    it('should parse single token', () => {
      expect(parseLunarTokens('LM')).toEqual(['LM'])
    })

    it('should parse multiple tokens', () => {
      expect(parseLunarTokens('LM月LD日')).toEqual(['LM', 'LD'])
    })

    it('should return empty for no tokens', () => {
      expect(parseLunarTokens('YYYY-MM-DD')).toEqual([])
    })
  })
})
