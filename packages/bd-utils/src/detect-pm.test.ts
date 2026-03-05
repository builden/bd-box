import { describe, it, expect } from "bun:test";
import { detectPackageManager } from "./detect-pm";

describe("detectPackageManager", () => {
  it("should be a function", () => {
    expect(typeof detectPackageManager).toBe("function");
  });
});
