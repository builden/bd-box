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
      expect(LUNAR_TOKENS.MONTH_NO_SUFFIX).toBe('Lm')
      expect(LUNAR_TOKENS.DAY).toBe('LD')
      expect(LUNAR_TOKENS.DAY_NO_SUFFIX).toBe('Ld')
      expect(LUNAR_TOKENS.HOUR).toBe('LH')
      expect(LUNAR_TOKENS.HOUR_NO_SUFFIX).toBe('Lh')
      expect(LUNAR_TOKENS.YEAR).toBe('LY')
      expect(LUNAR_TOKENS.YEAR_NO_SUFFIX).toBe('Ly')
      expect(LUNAR_TOKENS.GANZHI_YEAR).toBe('LGZY')
      expect(LUNAR_TOKENS.GANZHI_YEAR_NO_SUFFIX).toBe('LGZy')
    })
  })

  describe('hasLunarToken', () => {
    it('should detect LM token', () => {
      expect(hasLunarToken('YYYY年LM月')).toBe(true)
    })

    it('should detect Lm token', () => {
      expect(hasLunarToken('Lm')).toBe(true)
    })

    it('should detect LD token', () => {
      expect(hasLunarToken('LD日')).toBe(true)
    })

    it('should detect Ld token', () => {
      expect(hasLunarToken('Ld')).toBe(true)
    })

    it('should detect LH token', () => {
      expect(hasLunarToken('LH时')).toBe(true)
    })

    it('should detect Lh token', () => {
      expect(hasLunarToken('Lh')).toBe(true)
    })

    it('should detect LY token', () => {
      expect(hasLunarToken('LY年')).toBe(true)
    })

    it('should detect Ly token', () => {
      expect(hasLunarToken('Ly')).toBe(true)
    })

    it('should detect LGZY token', () => {
      expect(hasLunarToken('LGZY年')).toBe(true)
    })

    it('should detect LGZy token', () => {
      expect(hasLunarToken('LGZy')).toBe(true)
    })

    it('should return false for no lunar token', () => {
      expect(hasLunarToken('YYYY-MM-DD')).toBe(false)
    })
  })

  describe('replaceLunarTokens', () => {
    it('should replace LM token', () => {
      const replacers: LunarReplacers = {
        LM: '五月', Lm: '五', LD: '初一', Ld: '初一', LH: '子时', Lh: '子',
        LY: '二零二四年', Ly: '二零二四', LGZY: '甲辰年', LGZy: '甲辰'
      }
      const result = replaceLunarTokens('LM', replacers)
      expect(result).toBe('五月')
    })

    it('should replace Lm token without suffix', () => {
      const replacers: LunarReplacers = {
        LM: '五月', Lm: '五', LD: '初一', Ld: '初一', LH: '子时', Lh: '子',
        LY: '二零二四年', Ly: '二零二四', LGZY: '甲辰年', LGZy: '甲辰'
      }
      const result = replaceLunarTokens('Lm', replacers)
      expect(result).toBe('五')
    })

    it('should replace LD token', () => {
      const replacers: LunarReplacers = {
        LM: '五月', Lm: '五', LD: '初一', Ld: '初一', LH: '子时', Lh: '子',
        LY: '二零二四年', Ly: '二零二四', LGZY: '甲辰年', LGZy: '甲辰'
      }
      const result = replaceLunarTokens('LD', replacers)
      expect(result).toBe('初一')
    })

    it('should replace LH token', () => {
      const replacers: LunarReplacers = {
        LM: '五月', Lm: '五', LD: '初一', Ld: '初一', LH: '子时', Lh: '子',
        LY: '二零二四年', Ly: '二零二四', LGZY: '甲辰年', LGZy: '甲辰'
      }
      const result = replaceLunarTokens('LH', replacers)
      expect(result).toBe('子时')
    })

    it('should replace LY token', () => {
      const replacers: LunarReplacers = {
        LM: '五月', Lm: '五', LD: '初一', Ld: '初一', LH: '子时', Lh: '子',
        LY: '二零二四年', Ly: '二零二四', LGZY: '甲辰年', LGZy: '甲辰'
      }
      const result = replaceLunarTokens('LY', replacers)
      expect(result).toBe('二零二四年')
    })

    it('should replace LGZY token', () => {
      const replacers: LunarReplacers = {
        LM: '五月', Lm: '五', LD: '初一', Ld: '初一', LH: '子时', Lh: '子',
        LY: '二零二四年', Ly: '二零二四', LGZY: '甲辰年', LGZy: '甲辰'
      }
      const result = replaceLunarTokens('LGZY', replacers)
      expect(result).toBe('甲辰年')
    })

    it('should preserve escaped brackets', () => {
      const replacers: LunarReplacers = {
        LM: '五月', Lm: '五', LD: '初一', Ld: '初一', LH: '子时', Lh: '子',
        LY: '二零二四年', Ly: '二零二四', LGZY: '甲辰年', LGZy: '甲辰'
      }
      const result = replaceLunarTokens('[LM is] LM', replacers)
      expect(result).toBe('[LM is] 五月')
    })

    it('should handle combined tokens', () => {
      // LM/LD/LH 不带后缀，需要在格式中加后缀
      const replacers: LunarReplacers = {
        LM: '五月', Lm: '五', LD: '十五', Ld: '十五', LH: '未', Lh: '未时',
        LY: '二零二四', Ly: '二零二四年', LGZY: '甲辰', LGZy: '甲辰年'
      }
      const result = replaceLunarTokens('YYYY年Lm月Ld日 Lh', replacers)
      expect(result).toBe('YYYY年五月十五日 未时')
    })

    it('should handle leap month LM token', () => {
      // Lm/Ld 不带后缀，格式中需要加后缀
      const replacers: LunarReplacers = {
        LM: '闰二月', Lm: '闰二', LD: '十五日', Ld: '十五', LH: '午时', Lh: '午',
        LY: '二零二三年', Ly: '二零二三', LGZY: '癸卯年', LGZy: '癸卯'
      }
      const result = replaceLunarTokens('Lm月Ld日', replacers)
      expect(result).toBe('闰二月十五日')
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

    it('should parse all lunar tokens', () => {
      expect(parseLunarTokens('LM月LD日LH')).toEqual(['LM', 'LD', 'LH'])
    })

    it('should parse year tokens', () => {
      expect(parseLunarTokens('LY年')).toEqual(['LY'])
    })

    it('should parse ganzhi year tokens', () => {
      expect(parseLunarTokens('LGZY年')).toEqual(['LGZY'])
    })

    it('should return all LM tokens including escaped', () => {
      expect(parseLunarTokens('[LM] LM')).toEqual(['LM', 'LM'])
    })
  })

  describe('edge cases', () => {
    it('should handle empty format string', () => {
      expect(replaceLunarTokens('', {})).toBe('')
      expect(hasLunarToken('')).toBe(false)
      expect(parseLunarTokens('')).toEqual([])
    })

    it('should keep original token when replacer key missing', () => {
      // 缺少 key，保留原始 token
      const replacers: LunarReplacers = { LM: '五月', Lm: '五' }
      // 缺少 LD，保留原始 token
      expect(replaceLunarTokens('LD', replacers)).toBe('LD')
    })

    it('should handle multiple escapes in one string', () => {
      const replacers: LunarReplacers = {
        LM: '五月', Lm: '五', LD: '十五', Ld: '十五', LH: '午时', Lh: '午',
        LY: '二零二四年', Ly: '二零二四', LGZY: '甲辰年', LGZy: '甲辰'
      }
      const result = replaceLunarTokens('[LM] [LD] LM', replacers)
      expect(result).toBe('[LM] [LD] 五月')
    })
  })
})
