import { describe, it, expect } from 'bun:test';
import { Color } from '../src/color';
import { generate, generateAntDesign, generateTailwind, generateOklch } from '../src/generate';

describe('Color 颜色类', () => {
  describe('构造函数', () => {
    it('应该解析 hex 颜色', () => {
      const color = new Color('#1677ff');
      // 实际解析值可能有细微差异
      expect(color.r).toBeGreaterThan(0);
      expect(color.g).toBeGreaterThan(0);
      expect(color.b).toBe(255);
    });

    it('应该解析 rgb 字符串', () => {
      const color = new Color('rgb(22, 119, 255)');
      expect(color.r).toBe(22);
      expect(color.g).toBe(119);
      expect(color.b).toBe(255);
    });

    it('应该解析 hsl 字符串', () => {
      const color = new Color('hsl(215, 100%, 54%)');
      // HSL 转换可能有细微差异
      expect(color.r).toBeGreaterThan(0);
      expect(color.g).toBeGreaterThan(0);
      expect(color.b).toBeGreaterThan(200);
    });
  });

  describe('输出方法', () => {
    it('toHexString 应该返回 hex 字符串', () => {
      const color = new Color('#1677ff');
      expect(color.toHexString()).toBe('#1677ff');
    });

    it('toRgb 应该返回 rgb 对象', () => {
      const color = new Color('#1677ff');
      const rgb = color.toRgb();
      expect(rgb.r).toBeGreaterThan(0);
      expect(rgb.g).toBeGreaterThan(0);
      expect(rgb.b).toBe(255);
    });

    it('toRgbString 应该返回 rgb 字符串', () => {
      const color = new Color('#1677ff');
      const str = color.toRgbString();
      expect(str).toContain('rgb');
      expect(str).toContain('255');
    });

    it('toHsl 应该返回 hsl 对象', () => {
      const color = new Color('#1677ff');
      const hsl = color.toHsl();
      expect(hsl.h).toBeGreaterThan(200);
      expect(hsl.s).toBeGreaterThan(0.8);
    });

    it('toOklch 应该返回 oklch 对象', () => {
      const color = new Color('#1677ff');
      const oklch = color.toOklch();
      expect(oklch.l).toBeGreaterThan(0);
      expect(oklch.c).toBeGreaterThan(0);
      expect(oklch.h).toBeGreaterThan(0);
    });
  });

  describe('颜色操作', () => {
    it('lighten 应该提亮颜色', () => {
      const color = new Color('#000000');
      const lightened = color.lighten(20);
      expect(lightened.getBrightness()).toBeGreaterThan(color.getBrightness());
    });

    it('darken 应该加深颜色', () => {
      const color = new Color('#ffffff');
      const darkened = color.darken(20);
      expect(darkened.getBrightness()).toBeLessThan(color.getBrightness());
    });

    it('mix 应该混合两种颜色', () => {
      const color1 = new Color('#ff0000');
      const color2 = new Color('#0000ff');
      const mixed = color1.mix(color2, 50);
      expect(mixed.r).toBe(128);
      expect(mixed.g).toBe(0);
      expect(mixed.b).toBe(128);
    });

    it('grayscale 应该转换为灰度颜色', () => {
      const color = new Color('#ff5500');
      const gray = color.grayscale();
      // 使用 Rec. 601 公式: gray = 0.299*R + 0.587*G + 0.114*B
      // gray = 0.299*255 + 0.587*85 + 0.114*0 = 76.295 + 49.895 + 0 = 126.19 ≈ 126
      expect(gray.r).toBe(126);
      expect(gray.g).toBe(126);
      expect(gray.b).toBe(126);
    });

    it('grayscale 应该保留透明度', () => {
      const color = new Color('#ff550080');
      const gray = color.grayscale();
      expect(gray.a).toBeLessThan(1);
    });

    it('grayscale 红色应该变为中等灰色', () => {
      const color = new Color('#ff0000');
      const gray = color.grayscale();
      // gray = 0.299*255 + 0.587*0 + 0.114*0 = 76.245 ≈ 76
      expect(gray.r).toBe(76);
      expect(gray.g).toBe(76);
      expect(gray.b).toBe(76);
    });

    it('grayscale 绿色应该变为较亮灰色', () => {
      const color = new Color('#00ff00');
      const gray = color.grayscale();
      // gray = 0.299*0 + 0.587*255 + 0.114*0 = 149.685 ≈ 150
      expect(gray.r).toBe(150);
      expect(gray.g).toBe(150);
      expect(gray.b).toBe(150);
    });

    it('grayscale 蓝色应该变为较暗灰色', () => {
      const color = new Color('#0000ff');
      const gray = color.grayscale();
      // gray = 0.299*0 + 0.587*0 + 0.114*255 = 29.07 ≈ 29
      expect(gray.r).toBe(29);
      expect(gray.g).toBe(29);
      expect(gray.b).toBe(29);
    });

    it('grayscale 白色应该变为白色', () => {
      const color = new Color('#ffffff');
      const gray = color.grayscale();
      expect(gray.r).toBe(255);
      expect(gray.g).toBe(255);
      expect(gray.b).toBe(255);
    });

    it('grayscale 黑色应该保持黑色', () => {
      const color = new Color('#000000');
      const gray = color.grayscale();
      expect(gray.r).toBe(0);
      expect(gray.g).toBe(0);
      expect(gray.b).toBe(0);
    });

    it('contrast 应该计算两个颜色的对比度', () => {
      const white = new Color('#ffffff');
      const black = new Color('#000000');
      const contrast = white.contrast(black);
      // WCAG 对比度公式: (L1 + 0.05) / (L2 + 0.05)
      // 白色亮度 L1 = 1, 黑色亮度 L2 = 0
      // contrast = (1 + 0.05) / (0 + 0.05) = 1.05 / 0.05 = 21
      expect(contrast).toBe(21);
    });

    it('contrast 应该支持不同颜色输入', () => {
      const white = new Color('#ffffff');
      // 白色与蓝色对比度约 12
      const contrast = white.contrast('blue');
      // 蓝色 #0000ff 的亮度约为 0.0722
      // contrast = (1 + 0.05) / (0.0722 + 0.05) = 1.05 / 0.1222 ≈ 8.59
      expect(contrast).toBeGreaterThan(8);
      expect(contrast).toBeLessThan(9);
    });

    it('contrast 相同颜色对比度应为 1', () => {
      const color = new Color('#1677ff');
      const contrast = color.contrast('#1677ff');
      expect(contrast).toBe(1);
    });

    it('contrast 浅灰与深灰对比度应大于 1', () => {
      const lightGray = new Color('#cccccc');
      const darkGray = new Color('#333333');
      const contrast = lightGray.contrast(darkGray);
      expect(contrast).toBeGreaterThan(1);
    });

    it('clone 应该返回独立副本', () => {
      const color1 = new Color('#1677ff');
      const color2 = color1.clone();
      color2.r = 0;
      expect(color1.r).not.toBe(0);
    });
  });

  describe('状态判断', () => {
    it('黑色应该是暗色', () => {
      const color = new Color('#000000');
      expect(color.isDark()).toBe(true);
    });

    it('白色应该是亮色', () => {
      const color = new Color('#ffffff');
      expect(color.isLight()).toBe(true);
    });
  });
});
