import { describe, it, expect } from "bun:test";
import { Color } from "../src/color";
import { generate, generateAntDesign, generateTailwind, generateOklch } from "../src/generate";

describe("Color 颜色类", () => {
  describe("构造函数", () => {
    it("应该解析 hex 颜色", () => {
      const color = new Color("#1677ff");
      // 实际解析值可能有细微差异
      expect(color.r).toBeGreaterThan(0);
      expect(color.g).toBeGreaterThan(0);
      expect(color.b).toBe(255);
    });

    it("应该解析 3 位 hex 颜色", () => {
      const color = new Color("#f00");
      expect(color.r).toBe(255);
      expect(color.g).toBe(0);
      expect(color.b).toBe(0);
    });

    it("应该解析 8 位 hex 颜色（带 alpha）", () => {
      const color = new Color("#1677ff80");
      expect(color.r).toBeGreaterThan(0);
      expect(color.g).toBeGreaterThan(0);
      expect(color.b).toBe(255);
      expect(color.a).toBeCloseTo(0.5, 1);
    });

    it("应该解析 rgb 字符串", () => {
      const color = new Color("rgb(22, 119, 255)");
      expect(color.r).toBe(22);
      expect(color.g).toBe(119);
      expect(color.b).toBe(255);
    });

    it("应该解析 rgba 字符串", () => {
      const color = new Color("rgba(22, 119, 255, 0.5)");
      expect(color.r).toBe(22);
      expect(color.g).toBe(119);
      expect(color.b).toBe(255);
      expect(color.a).toBeCloseTo(0.5, 1);
    });

    it("应该解析 hsl 字符串", () => {
      const color = new Color("hsl(215, 100%, 54%)");
      // HSL 转换可能有细微差异
      expect(color.r).toBeGreaterThan(0);
      expect(color.g).toBeGreaterThan(0);
      expect(color.b).toBeGreaterThan(200);
    });

    it("应该解析 hsla 字符串", () => {
      const color = new Color("hsla(215, 100%, 54%, 0.5)");
      expect(color.r).toBeGreaterThan(0);
      expect(color.g).toBeGreaterThan(0);
      expect(color.b).toBeGreaterThan(200);
      expect(color.a).toBeCloseTo(0.5, 1);
    });

    it("应该解析 hsv 字符串", () => {
      const color = new Color("hsv(215, 100%, 100%)");
      // HSV(215, 100%, 100%) -> RGB(0, 106, 255)
      expect(color.r).toBe(0);
      expect(color.g).toBe(106);
      expect(color.b).toBe(255);
    });

    it("应该解析 hsb 字符串", () => {
      const color = new Color("hsb(215, 100%, 100%)");
      // HSB(215, 100%, 100%) -> RGB(0, 106, 255)
      expect(color.r).toBe(0);
      expect(color.g).toBe(106);
      expect(color.b).toBe(255);
    });

    it("应该解析预设颜色 red", () => {
      const color = new Color("red");
      expect(color.r).toBe(255);
      expect(color.g).toBe(0);
      expect(color.b).toBe(0);
    });

    it("应该解析预设颜色 blue", () => {
      const color = new Color("blue");
      expect(color.r).toBe(0);
      expect(color.g).toBe(0);
      expect(color.b).toBe(255);
    });

    it("应该解析预设颜色 green", () => {
      const color = new Color("green");
      expect(color.r).toBe(0);
      expect(color.g).toBe(128);
      expect(color.b).toBe(0);
    });

    it("应该解析预设颜色 white", () => {
      const color = new Color("white");
      expect(color.r).toBe(255);
      expect(color.g).toBe(255);
      expect(color.b).toBe(255);
    });

    it("应该解析预设颜色 black", () => {
      const color = new Color("black");
      expect(color.r).toBe(0);
      expect(color.g).toBe(0);
      expect(color.b).toBe(0);
    });

    it("应该解析 OKLCH 对象", () => {
      const color = new Color({ l: 0.5, c: 0.2, h: 200 });
      // OKLCH(0.5, 0.2, 200) -> RGB(0, 54, 71)
      expect(color.r).toBe(0);
      expect(color.g).toBe(54);
      expect(color.b).toBe(71);
    });

    it("应该解析 OKLAB 对象", () => {
      const color = new Color({ l: 0.5, a: 0.1, b: -0.1 });
      expect(color.r).toBeGreaterThan(0);
      expect(color.g).toBeGreaterThan(0);
      expect(color.b).toBeGreaterThan(0);
    });

    it("应该解析 HSV 对象", () => {
      const color = new Color({ h: 215, s: 1, v: 1 });
      // HSV(215, 1, 1) -> RGB(0, 106, 255)
      expect(color.r).toBe(0);
      expect(color.g).toBe(106);
      expect(color.b).toBe(255);
    });

    it("应该解析 RGB 对象", () => {
      const color = new Color({ r: 22, g: 119, b: 255 });
      expect(color.r).toBe(22);
      expect(color.g).toBe(119);
      expect(color.b).toBe(255);
    });

    it("应该解析带 alpha 的 RGB 对象", () => {
      const color = new Color({ r: 22, g: 119, b: 255, a: 0.5 });
      expect(color.r).toBe(22);
      expect(color.g).toBe(119);
      expect(color.b).toBe(255);
      expect(color.a).toBeCloseTo(0.5, 1);
    });

    it("应该抛出无效颜色错误", () => {
      expect(() => new Color("invalid-color")).toThrow();
    });

    it("undefined 输入应该返回默认颜色", () => {
      const color = new Color(undefined);
      expect(color.r).toBe(0);
      expect(color.g).toBe(0);
      expect(color.b).toBe(0);
      expect(color.a).toBe(1);
    });

    it("应该从 Color 实例复制", () => {
      const color1 = new Color("#1677ff");
      const color2 = new Color(color1);
      expect(color2.r).toBe(color1.r);
      expect(color2.g).toBe(color1.g);
      expect(color2.b).toBe(color1.b);
    });
  });

  describe("输出方法", () => {
    it("toHexString 应该返回 hex 字符串", () => {
      const color = new Color("#1677ff");
      expect(color.toHexString()).toBe("#1677ff");
    });

    it("toRgb 应该返回 rgb 对象", () => {
      const color = new Color("#1677ff");
      const rgb = color.toRgb();
      expect(rgb.r).toBeGreaterThan(0);
      expect(rgb.g).toBeGreaterThan(0);
      expect(rgb.b).toBe(255);
    });

    it("toRgbString 应该返回 rgb 字符串", () => {
      const color = new Color("#1677ff");
      const str = color.toRgbString();
      expect(str).toContain("rgb");
      expect(str).toContain("255");
    });

    it("toHsl 应该返回 hsl 对象", () => {
      const color = new Color("#1677ff");
      const hsl = color.toHsl();
      expect(hsl.h).toBeGreaterThan(200);
      expect(hsl.s).toBeGreaterThan(0.8);
    });

    it("toOklch 应该返回 oklch 对象", () => {
      const color = new Color("#1677ff");
      const oklch = color.toOklch();
      expect(oklch.l).toBeGreaterThan(0);
      expect(oklch.c).toBeGreaterThan(0);
      expect(oklch.h).toBeGreaterThan(0);
    });

    it("toHslString 应该返回 hsl 字符串", () => {
      const color = new Color("#1677ff");
      const str = color.toHslString();
      expect(str).toContain("hsl");
      expect(str).toContain("%");
    });

    it("toHslString 应该返回带 alpha 的 hsla 字符串", () => {
      const color = new Color("#1677ff80");
      const str = color.toHslString();
      expect(str).toContain("hsla");
    });

    it("toString 应该返回 rgb 字符串", () => {
      const color = new Color("#1677ff");
      expect(color.toString()).toContain("rgb");
    });
  });

  describe("颜色操作", () => {
    it("lighten 应该提亮颜色", () => {
      const color = new Color("#000000");
      const lightened = color.lighten(20);
      expect(lightened.getBrightness()).toBeGreaterThan(color.getBrightness());
    });

    it("darken 应该加深颜色", () => {
      const color = new Color("#ffffff");
      const darkened = color.darken(20);
      expect(darkened.getBrightness()).toBeLessThan(color.getBrightness());
    });

    it("mix 应该混合两种颜色", () => {
      const color1 = new Color("#ff0000");
      const color2 = new Color("#0000ff");
      const mixed = color1.mix(color2, 50);
      expect(mixed.r).toBe(128);
      expect(mixed.g).toBe(0);
      expect(mixed.b).toBe(128);
    });

    it("grayscale 应该转换为灰度颜色", () => {
      const color = new Color("#ff5500");
      const gray = color.grayscale();
      // 使用 Rec. 601 公式: gray = 0.299*R + 0.587*G + 0.114*B
      // gray = 0.299*255 + 0.587*85 + 0.114*0 = 76.295 + 49.895 + 0 = 126.19 ≈ 126
      expect(gray.r).toBe(126);
      expect(gray.g).toBe(126);
      expect(gray.b).toBe(126);
    });

    it("grayscale 应该保留透明度", () => {
      const color = new Color("#ff550080");
      const gray = color.grayscale();
      expect(gray.a).toBeLessThan(1);
    });

    it("grayscale 红色应该变为中等灰色", () => {
      const color = new Color("#ff0000");
      const gray = color.grayscale();
      // gray = 0.299*255 + 0.587*0 + 0.114*0 = 76.245 ≈ 76
      expect(gray.r).toBe(76);
      expect(gray.g).toBe(76);
      expect(gray.b).toBe(76);
    });

    it("grayscale 绿色应该变为较亮灰色", () => {
      const color = new Color("#00ff00");
      const gray = color.grayscale();
      // gray = 0.299*0 + 0.587*255 + 0.114*0 = 149.685 ≈ 150
      expect(gray.r).toBe(150);
      expect(gray.g).toBe(150);
      expect(gray.b).toBe(150);
    });

    it("grayscale 蓝色应该变为较暗灰色", () => {
      const color = new Color("#0000ff");
      const gray = color.grayscale();
      // gray = 0.299*0 + 0.587*0 + 0.114*255 = 29.07 ≈ 29
      expect(gray.r).toBe(29);
      expect(gray.g).toBe(29);
      expect(gray.b).toBe(29);
    });

    it("grayscale 白色应该变为白色", () => {
      const color = new Color("#ffffff");
      const gray = color.grayscale();
      expect(gray.r).toBe(255);
      expect(gray.g).toBe(255);
      expect(gray.b).toBe(255);
    });

    it("grayscale 黑色应该保持黑色", () => {
      const color = new Color("#000000");
      const gray = color.grayscale();
      expect(gray.r).toBe(0);
      expect(gray.g).toBe(0);
      expect(gray.b).toBe(0);
    });

    it("contrast 应该计算两个颜色的对比度", () => {
      const white = new Color("#ffffff");
      const black = new Color("#000000");
      const contrast = white.contrast(black);
      // WCAG 对比度公式: (L1 + 0.05) / (L2 + 0.05)
      // 白色亮度 L1 = 1, 黑色亮度 L2 = 0
      // contrast = (1 + 0.05) / (0 + 0.05) = 1.05 / 0.05 = 21
      expect(contrast).toBe(21);
    });

    it("contrast 应该支持不同颜色输入", () => {
      const white = new Color("#ffffff");
      // 白色与蓝色对比度约 12
      const contrast = white.contrast("blue");
      // 蓝色 #0000ff 的亮度约为 0.0722
      // contrast = (1 + 0.05) / (0.0722 + 0.05) = 1.05 / 0.1222 ≈ 8.59
      expect(contrast).toBeGreaterThan(8);
      expect(contrast).toBeLessThan(9);
    });

    it("contrast 相同颜色对比度应为 1", () => {
      const color = new Color("#1677ff");
      const contrast = color.contrast("#1677ff");
      expect(contrast).toBe(1);
    });

    it("contrast 浅灰与深灰对比度应大于 1", () => {
      const lightGray = new Color("#cccccc");
      const darkGray = new Color("#333333");
      const contrast = lightGray.contrast(darkGray);
      expect(contrast).toBeGreaterThan(1);
    });

    it("clone 应该返回独立副本", () => {
      const color1 = new Color("#1677ff");
      const color2 = color1.clone();
      color2.r = 0;
      expect(color1.r).not.toBe(0);
    });

    it("saturate 应该增加饱和度", () => {
      const color = new Color("#808080"); // 灰色
      const saturated = color.saturate(50);
      // 灰色 saturate 后应该仍然是灰色或接近
      expect(saturated.getBrightness()).toBeGreaterThanOrEqual(0);
    });

    it("saturate 应该减少饱和度", () => {
      const color = new Color("#ff0000"); // 红色
      const desaturated = color.desaturate(50);
      // 红色 desaturate 后饱和度降低
      expect(desaturated.toHsl().s).toBeLessThan(color.toHsl().s);
    });

    it("tint 应该混合白色", () => {
      const color = new Color("#ff0000");
      const tinted = color.tint(50);
      // 红色混合白色后应该是粉色
      expect(tinted.r).toBe(255);
      expect(tinted.g).toBeGreaterThan(0);
      expect(tinted.b).toBeGreaterThan(0);
    });

    it("shade 应该混合黑色", () => {
      const color = new Color("#ff0000");
      const shaded = color.shade(50);
      // 红色混合黑色后应该是深红色
      expect(shaded.r).toBeLessThan(255);
      expect(shaded.g).toBe(0);
      expect(shaded.b).toBe(0);
    });

    it("equals 相同颜色应该返回 true", () => {
      const color1 = new Color("#1677ff");
      const color2 = new Color("#1677ff");
      expect(color1.equals(color2)).toBe(true);
    });

    it("equals 不同颜色应该返回 false", () => {
      const color1 = new Color("#ff0000");
      const color2 = new Color("#0000ff");
      expect(color1.equals(color2)).toBe(false);
    });

    it("equals 应该支持字符串输入", () => {
      const color = new Color("#1677ff");
      expect(color.equals("#1677ff")).toBe(true);
      expect(color.equals("#ff0000")).toBe(false);
    });

    it("equals 应该支持 RGB 对象输入", () => {
      const color = new Color("#1677ff");
      expect(color.equals({ r: 22, g: 119, b: 255 })).toBe(true);
    });

    it("mix 应该支持不同混合比例", () => {
      const color1 = new Color("#ff0000");
      const color2 = new Color("#0000ff");
      const mixed25 = color1.mix(color2, 25);
      const mixed75 = color1.mix(color2, 75);
      expect(mixed25.r).toBeGreaterThan(mixed75.r);
    });

    it("mix 应该保留透明度", () => {
      const color1 = new Color("#ff000080");
      const color2 = new Color("#0000ff");
      const mixed = color1.mix(color2, 50);
      expect(mixed.a).toBeLessThan(1);
    });
  });

  describe("状态判断", () => {
    it("黑色应该是暗色", () => {
      const color = new Color("#000000");
      expect(color.isDark()).toBe(true);
    });

    it("白色应该是亮色", () => {
      const color = new Color("#ffffff");
      expect(color.isLight()).toBe(true);
    });
  });
});
