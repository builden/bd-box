// ========================
// 颜色空间转换
// ========================

import { RGB, HSL, HSV, OKLCH, OKLAB } from './types';
import { clamp } from './utils';

// ========================
// RGB <-> HSL
// ========================

/**
 * RGB 转 HSL
 */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    case b:
      h = ((r - g) / d + 4) / 6;
      break;
  }

  return { h: h * 360, s, l };
}

/**
 * HSL 转 RGB
 */
export function hslToRgb(h: number, s: number, l: number): RGB {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 1);
  l = clamp(l, 0, 1);

  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

  const hueToRgb = (p: number, q: number, t: number): number => {
    t = ((t % 1) + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hueToRgb(p, q, h / 360 + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, h / 360) * 255),
    b: Math.round(hueToRgb(p, q, h / 360 - 1 / 3) * 255),
  };
}

// ========================
// RGB <-> HSV
// ========================

/**
 * RGB 转 HSV
 */
export function rgbToHsv(r: number, g: number, b: number): HSV {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  const v = max;
  const s = max === 0 ? 0 : d / max;

  let h = 0;
  if (max !== min) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s, v };
}

/**
 * HSV 转 RGB
 */
export function hsvToRgb(h: number, s: number, v: number): RGB {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 1);
  v = clamp(v, 0, 1);

  const i = Math.floor(h / 60);
  const f = h / 60 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r = 0, g = 0, b = 0;

  switch (i % 6) {
    case 0:
      r = v; g = t; b = p;
      break;
    case 1:
      r = q; g = v; b = p;
      break;
    case 2:
      r = p; g = v; b = t;
      break;
    case 3:
      r = p; g = q; b = v;
      break;
    case 4:
      r = t; g = p; b = v;
      break;
    case 5:
      r = v; g = p; b = q;
      break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// ========================
// RGB <-> OKLAB
// ========================

/**
 * RGB 转 OKLAB
 * 参考: https://github.com/oklab/oklab
 */
export function rgbToOklab(r: number, g: number, b: number): OKLAB {
  // 线性化 RGB
  const linearR = r / 255;
  const linearG = g / 255;
  const linearB = b / 255;

  const l = 0.4122214708 * linearR + 0.5363325363 * linearG + 0.0514459929 * linearB;
  const m = 0.2119034982 * linearR + 0.6806995451 * linearG + 0.1073969566 * linearB;
  const s = 0.0883024619 * linearR + 0.2817188376 * linearG + 0.6299787005 * linearB;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return {
    l: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  };
}

/**
 * OKLAB 转 RGB
 */
export function oklabToRgb(l: number, a: number, bVal: number): RGB {
  const l_ = l + 0.3963377774 * a + 0.2158037573 * bVal;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * bVal;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * bVal;

  const l2 = l_ * l_ * l_;
  const m2 = m_ * m_ * m_;
  const s2 = s_ * s_ * s_;

  const r = +4.0767416621 * l2 - 3.3077115913 * m2 + 0.2309699292 * s2;
  const g = -1.2684380046 * l2 + 2.6097574011 * m2 - 0.3413193965 * s2;
  const b = -0.0041960863 * l2 - 0.7034186147 * m2 + 1.7076147010 * s2;

  return {
    r: clamp(Math.round(r * 255), 0, 255),
    g: clamp(Math.round(g * 255), 0, 255),
    b: clamp(Math.round(b * 255), 0, 255),
  };
}

// ========================
// OKLAB <-> OKLCH
// ========================

/**
 * OKLAB 转 OKLCH
 */
export function oklabToOklch(l: number, a: number, b: number): OKLCH {
  const h = Math.atan2(b, a) * (180 / Math.PI);
  const c = Math.sqrt(a * a + b * b);
  return {
    l: clamp(l, 0, 1),
    c: clamp(c, 0, 0.5),  // OKLCH chroma 通常不超过 0.5
    h: h < 0 ? h + 360 : h,
  };
}

/**
 * OKLCH 转 OKLAB
 */
export function oklchToOklab(l: number, c: number, h: number): OKLAB {
  const hRad = (h * Math.PI) / 180;
  return {
    l: clamp(l, 0, 1),
    a: c * Math.cos(hRad),
    b: c * Math.sin(hRad),
  };
}

// ========================
// RGB <-> OKLCH (便捷方法)
// ========================

/**
 * RGB 转 OKLCH
 */
export function rgbToOklch(r: number, g: number, b: number): OKLCH {
  const lab = rgbToOklab(r, g, b);
  return oklabToOklch(lab.l, lab.a, lab.b);
}

/**
 * OKLCH 转 RGB
 */
export function oklchToRgb(l: number, c: number, h: number): RGB {
  const lab = oklchToOklab(l, c, h);
  return oklabToRgb(lab.l, lab.a, lab.b);
}
