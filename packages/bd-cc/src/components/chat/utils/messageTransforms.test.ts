import { describe, it, expect } from "bun:test";
import { calculateDiff, createCachedDiffCalculator } from "./messageTransforms";

describe("messageTransforms", () => {
  describe("calculateDiff", () => {
    it("should return empty array for identical strings", () => {
      const result = calculateDiff("hello\nworld", "hello\nworld");
      expect(result).toEqual([]);
    });

    it("should detect added lines", () => {
      const result = calculateDiff("hello", "hello\nworld");
      expect(result).toEqual([{ type: "added", content: "world", lineNum: 2 }]);
    });

    it("should detect removed lines", () => {
      const result = calculateDiff("hello\nworld", "hello");
      expect(result).toEqual([{ type: "removed", content: "world", lineNum: 2 }]);
    });

    it("should detect both added and removed lines", () => {
      const result = calculateDiff("a\nb\nc", "a\nx\nc");
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((d) => d.type === "removed")).toBe(true);
      expect(result.some((d) => d.type === "added")).toBe(true);
    });

    it("should handle both empty strings", () => {
      const result = calculateDiff("", "");
      expect(result).toEqual([]);
    });

    it("should handle single line changes", () => {
      const result = calculateDiff("foo", "bar");
      expect(result.length).toBe(2);
    });
  });

  describe("createCachedDiffCalculator", () => {
    it("should cache results", () => {
      const calculator = createCachedDiffCalculator();
      const oldStr = "hello\nworld";
      const newStr = "hello\ntest";

      const result1 = calculator(oldStr, newStr);
      const result2 = calculator(oldStr, newStr);

      expect(result1).toBe(result2);
    });

    it("should calculate different results for different inputs", () => {
      const calculator = createCachedDiffCalculator();

      const result1 = calculator("a\nb", "a\nc");
      const result2 = calculator("x\ny", "x\nz");

      expect(result1).not.toBe(result2);
    });

    it("should handle cache size limit", () => {
      const calculator = createCachedDiffCalculator();

      for (let i = 0; i < 150; i++) {
        calculator(`old${i}`, `new${i}`);
      }

      const result = calculator("test1", "test2");
      expect(result).toBeDefined();
    });
  });
});
