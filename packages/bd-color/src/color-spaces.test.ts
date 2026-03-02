import { describe, it, expect } from "bun:test";
import {
  rgbToHsl,
  hslToRgb,
  rgbToHsv,
  hsvToRgb,
  rgbToOklab,
  oklabToRgb,
  rgbToOklch,
  oklchToOklab,
  oklchToRgb,
  oklabToOklch,
} from "../src/color-spaces";

describe("color-spaces 颜色空间转换", () => {
  describe("RGB <-> HSL", () => {
    it("rgbToHsl 红色应该转换正确", () => {
      const hsl = rgbToHsl(255, 0, 0);
      expect(hsl.h).toBe(0);
      expect(hsl.s).toBe(1);
      expect(hsl.l).toBe(0.5);
    });

    it("rgbToHsl 绿色应该转换正确", () => {
      const hsl = rgbToHsl(0, 255, 0);
      expect(hsl.h).toBeCloseTo(120, 0);
      expect(hsl.s).toBe(1);
      expect(hsl.l).toBeCloseTo(0.5, 1);
    });

    it("rgbToHsl 蓝色应该转换正确", () => {
      const hsl = rgbToHsl(0, 0, 255);
      expect(hsl.h).toBeCloseTo(240, 0);
      expect(hsl.s).toBe(1);
      expect(hsl.l).toBeCloseTo(0.5, 1);
    });

    it("rgbToHsl 灰色应该转换正确", () => {
      const hsl = rgbToHsl(128, 128, 128);
      expect(hsl.h).toBe(0);
      expect(hsl.s).toBe(0);
      expect(hsl.l).toBeCloseTo(0.5, 1);
    });

    it("hslToRgb 红色应该转换正确", () => {
      const rgb = hslToRgb(0, 1, 0.5);
      expect(rgb.r).toBe(255);
      expect(rgb.g).toBe(0);
      expect(rgb.b).toBe(0);
    });

    it("hslToRgb 绿色应该转换正确", () => {
      const rgb = hslToRgb(120, 1, 0.5);
      expect(rgb.r).toBe(0);
      expect(rgb.g).toBe(255);
      expect(rgb.b).toBe(0);
    });

    it("hslToRgb 蓝色应该转换正确", () => {
      const rgb = hslToRgb(240, 1, 0.5);
      expect(rgb.r).toBe(0);
      expect(rgb.g).toBe(0);
      expect(rgb.b).toBe(255);
    });

    it("hslToRgb 灰色应该转换正确", () => {
      const rgb = hslToRgb(0, 0, 0.5);
      expect(rgb.r).toBe(128);
      expect(rgb.g).toBe(128);
      expect(rgb.b).toBe(128);
    });
  });

  describe("RGB <-> HSV", () => {
    it("rgbToHsv 红色应该转换正确", () => {
      const hsv = rgbToHsv(255, 0, 0);
      expect(hsv.h).toBe(0);
      expect(hsv.s).toBe(1);
      expect(hsv.v).toBe(1);
    });

    it("rgbToHsv 绿色应该转换正确", () => {
      const hsv = rgbToHsv(0, 255, 0);
      expect(hsv.h).toBeCloseTo(120, 0);
      expect(hsv.s).toBe(1);
      expect(hsv.v).toBe(1);
    });

    it("rgbToHsv 蓝色应该转换正确", () => {
      const hsv = rgbToHsv(0, 0, 255);
      expect(hsv.h).toBeCloseTo(240, 0);
      expect(hsv.s).toBe(1);
      expect(hsv.v).toBe(1);
    });

    it("rgbToHsv 白色应该转换正确", () => {
      const hsv = rgbToHsv(255, 255, 255);
      expect(hsv.s).toBe(0);
      expect(hsv.v).toBe(1);
    });

    it("rgbToHsv 黑色应该转换正确", () => {
      const hsv = rgbToHsv(0, 0, 0);
      expect(hsv.v).toBe(0);
    });

    it("hsvToRgb 红色应该转换正确", () => {
      const rgb = hsvToRgb(0, 1, 1);
      expect(rgb.r).toBe(255);
      expect(rgb.g).toBe(0);
      expect(rgb.b).toBe(0);
    });

    it("hsvToRgb 绿色应该转换正确", () => {
      const rgb = hsvToRgb(120, 1, 1);
      expect(rgb.r).toBe(0);
      expect(rgb.g).toBe(255);
      expect(rgb.b).toBe(0);
    });

    it("hsvToRgb 蓝色应该转换正确", () => {
      const rgb = hsvToRgb(240, 1, 1);
      expect(rgb.r).toBe(0);
      expect(rgb.g).toBe(0);
      expect(rgb.b).toBe(255);
    });
  });

  describe("RGB <-> OKLAB", () => {
    it("rgbToOklab 红色应该转换正确", () => {
      const oklab = rgbToOklab(255, 0, 0);
      expect(oklab.l).toBeGreaterThan(0);
      expect(oklab.a).toBeGreaterThan(0);
    });

    it("rgbToOklab 绿色应该转换正确", () => {
      const oklab = rgbToOklab(0, 255, 0);
      expect(oklab.l).toBeGreaterThan(0);
      expect(oklab.b).toBeGreaterThan(0);
    });

    it("rgbToOklab 蓝色应该转换正确", () => {
      const oklab = rgbToOklab(0, 0, 255);
      expect(oklab.l).toBeGreaterThan(0);
      expect(oklab.a).toBeLessThan(0);
      expect(oklab.b).toBeLessThan(0);
    });

    it("rgbToOklab 白色应该转换正确", () => {
      const oklab = rgbToOklab(255, 255, 255);
      expect(oklab.l).toBeCloseTo(1, 1);
    });

    it("rgbToOklab 黑色应该转换正确", () => {
      const oklab = rgbToOklab(0, 0, 0);
      expect(oklab.l).toBeCloseTo(0, 1);
    });

    it("oklabToRgb 红色应该转换正确", () => {
      const rgb = oklabToRgb(0.627, 0.25, 0.05);
      expect(rgb.r).toBeGreaterThan(200);
    });

    it("oklabToRgb 绿色应该转换正确", () => {
      const rgb = oklabToRgb(0.7, -0.2, 0.3);
      expect(rgb.g).toBeGreaterThan(100);
    });
  });

  describe("OKLAB <-> OKLCH", () => {
    it("oklabToOklch 应该正确转换", () => {
      const oklch = oklabToOklch(0.5, 0.1, -0.1);
      expect(oklch.l).toBeCloseTo(0.5, 1);
      expect(oklch.c).toBeGreaterThan(0);
      expect(oklch.h).toBeGreaterThan(0);
    });

    it("oklabToOklch 负色相应该正确处理", () => {
      const oklch = oklabToOklch(0.5, 0.1, 0.1);
      // 负 b 值应该产生正色相
      expect(oklch.h).toBeGreaterThan(0);
    });

    it("oklchToOklab 应该正确转换", () => {
      const oklab = oklchToOklab(0.5, 0.2, 200);
      expect(oklab.l).toBeCloseTo(0.5, 1);
      expect(oklab.a).toBeDefined();
      expect(oklab.b).toBeDefined();
    });

    it("oklchToOklab 应该限制亮度在 0-1", () => {
      const oklab = oklchToOklab(1.5, 0.2, 200);
      expect(oklab.l).toBeLessThanOrEqual(1);
    });
  });

  describe("RGB <-> OKLCH", () => {
    it("rgbToOklch 红色应该转换正确", () => {
      const oklch = rgbToOklch(255, 0, 0);
      expect(oklch.l).toBeGreaterThan(0);
      expect(oklch.c).toBeGreaterThan(0);
      expect(oklch.h).toBeGreaterThan(0);
    });

    it("rgbToOklch 绿色应该转换正确", () => {
      const oklch = rgbToOklch(0, 255, 0);
      expect(oklch.l).toBeGreaterThan(0);
      expect(oklch.h).toBeGreaterThan(100);
    });

    it("rgbToOklch 蓝色应该转换正确", () => {
      const oklch = rgbToOklch(0, 0, 255);
      expect(oklch.l).toBeGreaterThan(0);
      expect(oklch.h).toBeGreaterThan(200);
    });

    it("oklchToRgb 红色应该转换正确", () => {
      const rgb = oklchToRgb(0.5, 0.2, 20);
      expect(rgb.r).toBeGreaterThan(100);
    });

    it("oklchToRgb 绿色应该转换正确", () => {
      const rgb = oklchToRgb(0.7, 0.2, 140);
      expect(rgb.g).toBeGreaterThan(100);
    });

    it("oklchToRgb 蓝色应该转换正确", () => {
      const rgb = oklchToRgb(0.5, 0.3, 260);
      expect(rgb.b).toBeGreaterThan(100);
    });
  });
});
