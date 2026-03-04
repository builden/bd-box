import { type LunarReplacers, type LunarToken, LUNAR_TOKENS } from './types'

const LUNAR_TOKEN_PATTERN = Object.values(LUNAR_TOKENS).join('|')
const TOKEN_REGEX = new RegExp(`\\[([^\\]]+)]|${LUNAR_TOKEN_PATTERN}`, 'g')
const HAS_TOKEN_REGEX = new RegExp(LUNAR_TOKEN_PATTERN)
const PARSE_TOKEN_REGEX = new RegExp(LUNAR_TOKEN_PATTERN, 'g')

/**
 * 替换农历占位符
 *
 * 上下文感知替换：
 * - LM 后面跟着 "月" 时，使用 Lm（不带后缀）
 * - LD 后面跟着 "日" 时，使用 Ld（不带后缀）
 * - LH 后面跟着 "时" 时，使用 Lh（不带后缀）
 * - LY 后面跟着 "年" 时，使用 Ly（不带后缀）
 * - LGZY 后面跟着 "年" 时，使用 LGZy（不带后缀）
 */
export function replaceLunarTokens(format: string, replacers: LunarReplacers): string {
  let result = format
  let offset = 0

  // 使用 exec 循环来获取每个匹配的位置
  const regex = new RegExp(TOKEN_REGEX.source, 'g')
  let match: RegExpExecArray | null

  while ((match = regex.exec(format)) !== null) {
    const token = match[0]
    const index = match.index

    if (token.startsWith('[')) continue

    // 调整索引（因为 result 已经被之前的替换修改了）
    const adjustedIndex = index + offset
    const nextChar = result[adjustedIndex + token.length]

    let replacement: string

    // LM 后面跟着 "月"，使用不带后缀版本
    if (token === 'LM' && nextChar === '月') {
      replacement = replacers.Lm ?? replacers.LM ?? token
    }
    // LD 后面跟着 "日"，使用不带后缀版本
    else if (token === 'LD' && nextChar === '日') {
      replacement = replacers.Ld ?? replacers.LD ?? token
    }
    // LH 后面跟着 "时"，使用不带后缀版本
    else if (token === 'LH' && nextChar === '时') {
      replacement = replacers.Lh ?? replacers.LH ?? token
    }
    // LY 后面跟着 "年"，使用不带后缀版本
    else if (token === 'LY' && nextChar === '年') {
      replacement = replacers.Ly ?? replacers.LY ?? token
    }
    // LGZY 后面跟着 "年"，使用不带后缀版本
    else if (token === 'LGZY' && nextChar === '年') {
      replacement = replacers.LGZy ?? replacers.LGZY ?? token
    }
    else {
      replacement = replacers[token as keyof LunarReplacers] ?? token
    }

    result = result.slice(0, adjustedIndex) + replacement + result.slice(adjustedIndex + token.length)
    offset += replacement.length - token.length
  }

  return result
}

/**
 * 检查是否包含农历占位符
 */
export function hasLunarToken(format: string): boolean {
  return HAS_TOKEN_REGEX.test(format)
}

/**
 * 解析占位符类型
 */
export function parseLunarTokens(format: string): LunarToken[] {
  const tokens: LunarToken[] = []
  let match: RegExpExecArray | null
  PARSE_TOKEN_REGEX.lastIndex = 0
  while ((match = PARSE_TOKEN_REGEX.exec(format)) !== null) {
    tokens.push(match[0] as LunarToken)
  }
  return tokens
}

export { LUNAR_TOKENS }
