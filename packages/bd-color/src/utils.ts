// ========================
// 工具函数
// ========================

const round = Math.round;

/** 限制数值在范围内 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** 四舍五入到指定小数位 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/** 限制 RGB 值在 0-255 */
export function limitRange(value: number, max: number = 255): number {
  return clamp(Math.round(value), 0, max);
}

/** 限制 alpha 值在 0-1 */
export function limitAlpha(value: number): number {
  return clamp(value, 0, 1);
}

/** 将数值转换为 2 位十六进制字符串 */
export function toHex2(value: number): string {
  const hex = Math.round(value).toString(16);
  return hex.length === 2 ? hex : '0' + hex;
}

/** 判断是否为数字 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/** 线性插值 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/** ease-in-out 插值 */
export function easeInOut(t: number): number {
  return t < 0.5
    ? 2 * t * t
    : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** 将角度规范化到 0-360 */
export function normalizeHue(angle: number): number {
  return ((angle % 360) + 360) % 360;
}
