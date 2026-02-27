import { type LunarReplacers, type LunarToken } from './types'

const TOKEN_REGEX = /\[([^\]]+)]|LM|LD|LH/g
const HAS_TOKEN_REGEX = /LM|LD|LH/

/**
 * 替换农历占位符
 */
export function replaceLunarTokens(format: string, replacers: LunarReplacers): string {
  return format.replace(TOKEN_REGEX, (match) => {
    if (match.startsWith('[')) return match
    return replacers[match as keyof LunarReplacers] ?? match
  })
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
  const regex = /LM|LD|LH/g
  while ((match = regex.exec(format)) !== null) {
    tokens.push(match[0] as LunarToken)
  }
  return tokens
}

export { LUNAR_TOKENS }
