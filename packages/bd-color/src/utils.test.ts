import { describe, it, expect } from "bun:test";
import { clamp, roundTo, limitRange, limitAlpha, toHex2, isNumber, lerp, easeInOut, normalizeHue } from "../src/utils";

describe("utils 工具函数", () => {
  describe("clamp", () => {
    it("应该限制值在范围内", () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it("应该处理边界值", () => {
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });
  });

  describe("roundTo", () => {
    it("应该四舍五入到指定小数位", () => {
      expect(roundTo(1.234, 2)).toBe(1.23);
      expect(roundTo(1.235, 2)).toBe(1.24);
      expect(roundTo(1.2, 0)).toBe(1);
    });

    it("应该处理负数", () => {
      expect(roundTo(-1.234, 2)).toBe(-1.23);
    });
  });

  describe("limitRange", () => {
    it("应该限制值在 0-255 范围内", () => {
      expect(limitRange(100)).toBe(100);
      expect(limitRange(-10)).toBe(0);
      expect(limitRange(300)).toBe(255);
    });

    it("应该四舍五入", () => {
      expect(limitRange(100.6)).toBe(101);
      expect(limitRange(100.4)).toBe(100);
    });

    it("应该支持自定义最大值", () => {
      expect(limitRange(50, 100)).toBe(50);
      expect(limitRange(150, 100)).toBe(100);
    });
  });

  describe("limitAlpha", () => {
    it("应该限制 alpha 在 0-1 范围内", () => {
      expect(limitAlpha(0.5)).toBe(0.5);
      expect(limitAlpha(-0.5)).toBe(0);
      expect(limitAlpha(1.5)).toBe(1);
    });
  });

  describe("toHex2", () => {
    it("应该将数字转换为 2 位十六进制", () => {
      expect(toHex2(255)).toBe("ff");
      expect(toHex2(0)).toBe("00");
      expect(toHex2(16)).toBe("10");
      expect(toHex2(15)).toBe("0f");
    });

    it("应该处理边界值", () => {
      expect(toHex2(1)).toBe("01");
      expect(toHex2(254)).toBe("fe");
    });
  });

  describe("isNumber", () => {
    it("应该识别数字", () => {
      expect(isNumber(0)).toBe(true);
      expect(isNumber(1)).toBe(true);
      expect(isNumber(-1)).toBe(true);
      expect(isNumber(3.14)).toBe(true);
    });

    it("应该拒绝非数字", () => {
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber("1")).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
      expect(isNumber({})).toBe(false);
    });
  });

  describe("lerp", () => {
    it("应该在两个值之间线性插值", () => {
      expect(lerp(0, 100, 0)).toBe(0);
      expect(lerp(0, 100, 0.5)).toBe(50);
      expect(lerp(0, 100, 1)).toBe(100);
    });

    it("应该处理负数", () => {
      expect(lerp(-50, 50, 0.5)).toBe(0);
    });
  });

  describe("easeInOut", () => {
    it("应该返回 ease-in-out 曲线值", () => {
      expect(easeInOut(0)).toBe(0);
      expect(easeInOut(0.5)).toBe(0.5);
      expect(easeInOut(1)).toBe(1);
    });

    it("应该加速然后减速", () => {
      const t1 = easeInOut(0.25);
      const t2 = easeInOut(0.75);
      // easeInOut(0.25) = 2 * 0.25 * 0.25 = 0.125
      // easeInOut(0.75) = 1 - (-1.5 + 2)^2 / 2 = 0.875
      expect(t1).toBe(0.125);
      expect(t2).toBe(0.875);
    });
  });

  describe("normalizeHue", () => {
    it("应该将角度规范化到 0-360", () => {
      expect(normalizeHue(0)).toBe(0);
      expect(normalizeHue(360)).toBe(0);
      expect(normalizeHue(720)).toBe(0);
      expect(normalizeHue(180)).toBe(180);
    });

    it("应该处理负数", () => {
      expect(normalizeHue(-90)).toBe(270);
      expect(normalizeHue(-180)).toBe(180);
      expect(normalizeHue(-360)).toBe(0);
    });
  });
});
