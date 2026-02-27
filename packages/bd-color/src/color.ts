// ========================
// Color 主类
// ========================

import { ColorInput, RGB, HSL, HSV, OKLCH, OKLAB } from './types';
import { clamp, limitRange, limitAlpha } from './utils';
import {
  rgbToHsl, hslToRgb,
  rgbToHsv, hsvToRgb,
  rgbToOklab, oklabToRgb,
  oklchToRgb,
} from './color-spaces';

// 预设颜色映射
const presetColors: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  cyan: '#00ffff',
  magenta: '#ff00ff',
  yellow: '#ffff00',
  orange: '#ffa500',
  purple: '#800080',
  gray: '#808080',
  grey: '#808080',
};

export class Color {
  r: number = 0;
  g: number = 0;
  b: number = 0;
  a: number = 1;

  // 缓存
  private _hsl?: HSL;
  private _hsv?: HSV;
  private _oklab?: OKLAB;
  private _oklch?: OKLCH;
  private _brightness?: number;
  private _luminance?: number;

  constructor(input?: ColorInput) {
    if (!input) {
      return;
    }

    if (input instanceof Color) {
      this.r = input.r;
      this.g = input.g;
      this.b = input.b;
      this.a = input.a;
      return;
    }

    if (typeof input === 'string') {
      this._parseString(input);
    } else if (this._isRgbObject(input)) {
      this._fromRgb(input);
    } else if (this._isHslObject(input)) {
      this._fromHsl(input);
    } else if (this._isHsvObject(input)) {
      this._fromHsv(input);
    } else if (this._isOklchObject(input)) {
      this._fromOklch(input);
    } else if (this._isOklabObject(input)) {
      this._fromOklab(input);
    } else {
      throw new Error(`bd-color: unsupported input ${JSON.stringify(input)}`);
    }
  }

  // ========================
  // 私有方法
  // ========================

  private _isRgbObject(obj: unknown): obj is RGB {
    return typeof obj === 'object' && obj !== null && 'r' in obj && 'g' in obj && 'b' in obj;
  }

  private _isHslObject(obj: unknown): obj is HSL {
    return typeof obj === 'object' && obj !== null && 'h' in obj && 's' in obj && 'l' in obj;
  }

  private _isHsvObject(obj: unknown): obj is HSV {
    return typeof obj === 'object' && obj !== null && 'h' in obj && 's' in obj && 'v' in obj;
  }

  private _isOklchObject(obj: unknown): obj is OKLCH {
    return typeof obj === 'object' && obj !== null && 'l' in obj && 'c' in obj && 'h' in obj;
  }

  private _isOklabObject(obj: unknown): obj is OKLAB {
    return typeof obj === 'object' && obj !== null && 'l' in obj && 'a' in obj && 'b' in obj;
  }

  private _parseString(str: string): void {
    const trimmed = str.trim().toLowerCase();

    // Hex 颜色
    if (/^#?[0-9a-f]{3,8}$/i.test(trimmed)) {
      this._fromHex(trimmed);
      return;
    }

    // rgb/rgba
    if (trimmed.startsWith('rgb')) {
      this._fromRgbString(trimmed);
      return;
    }

    // hsl/hsla
    if (trimmed.startsWith('hsl')) {
      this._fromHslString(trimmed);
      return;
    }

    // hsv/hsb
    if (trimmed.startsWith('hsv') || trimmed.startsWith('hsb')) {
      this._fromHsvString(trimmed);
      return;
    }

    // 预设颜色
    if (presetColors[trimmed]) {
      this._fromHex(presetColors[trimmed]);
      return;
    }

    throw new Error(`bd-color: cannot parse color "${str}"`);
  }

  private _fromHex(hex: string): void {
    let value = hex.replace('#', '');
    
    // 3位 hex 扩展为 6位
    if (value.length === 3) {
      value = value[0] + value[0] + value[1] + value[1] + value[2] + value[2];
    }

    this.r = parseInt(value.slice(0, 2), 16);
    this.g = parseInt(value.slice(2, 4), 16);
    this.b = parseInt(value.slice(4, 6), 16);
    this.a = value.length === 8 ? parseInt(value.slice(6, 8), 16) / 255 : 1;
  }

  private _fromRgb(rgb: RGB): void {
    this.r = limitRange(rgb.r);
    this.g = limitRange(rgb.g);
    this.b = limitRange(rgb.b);
    this.a = typeof rgb.a === 'number' ? limitAlpha(rgb.a) : 1;
  }

  private _fromHsl(hsl: HSL): void {
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    this.r = rgb.r;
    this.g = rgb.g;
    this.b = rgb.b;
    this.a = typeof hsl.a === 'number' ? limitAlpha(hsl.a) : 1;
  }

  private _fromHsv(hsv: HSV): void {
    const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
    this.r = rgb.r;
    this.g = rgb.g;
    this.b = rgb.b;
    this.a = typeof hsv.a === 'number' ? limitAlpha(hsv.a) : 1;
  }

  private _fromOklch(oklch: OKLCH): void {
    const rgb = oklchToRgb(oklch.l, oklch.c, oklch.h);
    this.r = rgb.r;
    this.g = rgb.g;
    this.b = rgb.b;
    this.a = typeof oklch.a === 'number' ? limitAlpha(oklch.a) : 1;
  }

  private _fromOklab(oklab: OKLAB): void {
    const rgb = oklabToRgb(oklab.l, oklab.a, oklab.b);
    this.r = rgb.r;
    this.g = rgb.g;
    this.b = rgb.b;
    this.a = typeof oklab.alpha === 'number' ? limitAlpha(oklab.alpha) : 1;
  }

  private _fromRgbString(str: string): void {
    const match = str.replace(/^[^(]*\((.*)/, '$1').replace(/\).*/, '').match(/[\d.]+/g);
    if (!match) throw new Error(`bd-color: invalid rgb string`);
    
    this.r = limitRange(parseFloat(match[0]));
    this.g = limitRange(parseFloat(match[1]));
    this.b = limitRange(parseFloat(match[2]));
    this.a = match[3] ? limitAlpha(parseFloat(match[3])) : 1;
  }

  private _fromHslString(str: string): void {
    const match = str.replace(/^[^(]*\((.*)/, '$1').replace(/\).*/, '').match(/[\d.]+%?/g);
    if (!match) throw new Error(`bd-color: invalid hsl string`);
    
    const h = parseFloat(match[0]);
    const s = match[1]?.includes('%') ? parseFloat(match[1]) / 100 : parseFloat(match[1]);
    const l = match[2]?.includes('%') ? parseFloat(match[2]) / 100 : parseFloat(match[2]);
    
    const rgb = hslToRgb(h, clamp(s, 0, 1), clamp(l, 0, 1));
    this.r = rgb.r;
    this.g = rgb.g;
    this.b = rgb.b;
    this.a = match[3] ? limitAlpha(parseFloat(match[3])) : 1;
  }

  private _fromHsvString(str: string): void {
    const match = str.replace(/^[^(]*\((.*)/, '$1').replace(/\).*/, '').match(/[\d.]+%?/g);
    if (!match) throw new Error(`bd-color: invalid hsv string`);
    
    const h = parseFloat(match[0]);
    const s = match[1]?.includes('%') ? parseFloat(match[1]) / 100 : parseFloat(match[1]);
    const v = match[2]?.includes('%') ? parseFloat(match[2]) / 100 : parseFloat(match[2]);
    
    const rgb = hsvToRgb(h, clamp(s, 0, 1), clamp(v, 0, 1));
    this.r = rgb.r;
    this.g = rgb.g;
    this.b = rgb.b;
    this.a = match[3] ? limitAlpha(parseFloat(match[3])) : 1;
  }

  private _invalidateCache(): void {
    this._hsl = undefined;
    this._hsv = undefined;
    this._oklab = undefined;
    this._oklch = undefined;
    this._brightness = undefined;
    this._luminance = undefined;
  }

  private _create(input: ColorInput): Color {
    return new Color(input);
  }

  // ========================
  // 输出方法
  // ========================

  toHexString(): string {
    const r = limitRange(this.r).toString(16).padStart(2, '0');
    const g = limitRange(this.g).toString(16).padStart(2, '0');
    const b = limitRange(this.b).toString(16).padStart(2, '0');
    const a = this.a < 1 ? limitRange(Math.round(this.a * 255)).toString(16).padStart(2, '0') : '';
    return `#${r}${g}${b}${a}`;
  }

  toRgb(): RGB {
    return {
      r: limitRange(this.r),
      g: limitRange(this.g),
      b: limitRange(this.b),
      a: this.a,
    };
  }

  toRgbString(): string {
    const r = limitRange(this.r);
    const g = limitRange(this.g);
    const b = limitRange(this.b);
    return this.a < 1 ? `rgba(${r},${g},${b},${this.a})` : `rgb(${r},${g},${b})`;
  }

  toHsl(): HSL {
    if (!this._hsl) {
      this._hsl = rgbToHsl(this.r, this.g, this.b);
      this._hsl.a = this.a;
    }
    return this._hsl;
  }

  toHslString(): string {
    const { h, s, l } = this.toHsl();
    const hRound = Math.round(h);
    const sRound = Math.round(s * 100);
    const lRound = Math.round(l * 100);
    return this.a < 1 ? `hsla(${hRound},${sRound}%,${lRound}%,${this.a})` : `hsl(${hRound},${sRound}%,${lRound}%)`;
  }

  toHsv(): HSV {
    if (!this._hsv) {
      this._hsv = rgbToHsv(this.r, this.g, this.b);
      this._hsv.a = this.a;
    }
    return this._hsv;
  }

  toOklab(): OKLAB {
    if (!this._oklab) {
      this._oklab = rgbToOklab(this.r, this.g, this.b);
      this._oklab.alpha = this.a;
    }
    return this._oklab;
  }

  toOklch(): OKLCH {
    if (!this._oklch) {
      const oklab = this.toOklab();
      this._oklch = oklabToOklch(oklab.l, oklab.a, oklab.b);
      this._oklch.a = this.a;
    }
    return this._oklch;
  }

  toString(): string {
    return this.toRgbString();
  }

  // ========================
  // 颜色操作
  // ========================

  clone(): Color {
    const color = new Color(this);
    return color;
  }

  lighten(amount: number = 10): Color {
    const hsl = this.toHsl();
    hsl.l = clamp(hsl.l + amount / 100, 0, 1);
    return this._create(hsl);
  }

  darken(amount: number = 10): Color {
    const hsl = this.toHsl();
    hsl.l = clamp(hsl.l - amount / 100, 0, 1);
    return this._create(hsl);
  }

  saturate(amount: number = 10): Color {
    const hsl = this.toHsl();
    hsl.s = clamp(hsl.s + amount / 100, 0, 1);
    return this._create(hsl);
  }

  desaturate(amount: number = 10): Color {
    const hsl = this.toHsl();
    hsl.s = clamp(hsl.s - amount / 100, 0, 1);
    return this._create(hsl);
  }

  mix(color: ColorInput, amount: number = 50): Color {
    const other = new Color(color);
    const p = amount / 100;
    
    return this._create({
      r: Math.round(this.r + (other.r - this.r) * p),
      g: Math.round(this.g + (other.g - this.g) * p),
      b: Math.round(this.b + (other.b - this.b) * p),
      a: this.a + (other.a - this.a) * p,
    });
  }

  tint(amount: number = 10): Color {
    return this.mix({ r: 255, g: 255, b: 255 }, amount);
  }

  shade(amount: number = 10): Color {
    return this.mix({ r: 0, g: 0, b: 0 }, amount);
  }

  /**
   * 转换为灰度颜色
   * 使用 Rec. 601 亮度公式: gray = 0.299*R + 0.587*G + 0.114*B
   */
  grayscale(): Color {
    const gray = Math.round(0.299 * this.r + 0.587 * this.g + 0.114 * this.b);
    return this._create({ r: gray, g: gray, b: gray, a: this.a });
  }

  // ========================
  // 状态判断
  // ========================

  isDark(): boolean {
    return this.getBrightness() < 128;
  }

  isLight(): boolean {
    return this.getBrightness() >= 128;
  }

  equals(other: Color): boolean {
    return (
      this.r === other.r &&
      this.g === other.g &&
      this.b === other.b &&
      this.a === other.a
    );
  }

  // ========================
  // 便捷方法
  // ========================

  getBrightness(): number {
    if (this._brightness === undefined) {
      this._brightness = (this.r * 299 + this.g * 587 + this.b * 114) / 1000;
    }
    return this._brightness;
  }

  getLuminance(): number {
    if (this._luminance === undefined) {
      const adjustGamma = (c: number) => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      this._luminance = 0.2126 * adjustGamma(this.r) + 0.7152 * adjustGamma(this.g) + 0.0722 * adjustGamma(this.b);
    }
    return this._luminance;
  }

  /**
   * 计算与另一个颜色的对比度 (WCAG 标准)
   * @param color - 另一个颜色
   * @returns 对比度比率 (1-21)
   * 
   * @example
   * new Color('#ffffff').contrast(new Color('#000000')) // 21
   * new Color('#ffffff').contrast(new Color('blue'))    // 12
   */
  contrast(color: ColorInput): number {
    const other = new Color(color);
    const l1 = this.getLuminance();
    const l2 = other.getLuminance();
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }
}

export default Color;
