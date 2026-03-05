import { describe, it, expect } from "bun:test";
import { open } from "./open";

describe("open", () => {
  it("should export open function", () => {
    expect(typeof open).toBe("function");
  });

  it("should accept target URL string", () => {
    // 简单验证函数签名
    expect(open.length).toBeGreaterThanOrEqual(1);
  });
});
