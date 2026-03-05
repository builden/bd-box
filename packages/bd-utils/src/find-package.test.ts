import { describe, it, expect } from "bun:test";
import { findPackageJson } from "./find-package";

describe("findPackageJson", () => {
  it("should find package.json in parent directories", () => {
    const result = findPackageJson();
    expect(result).toContain("package.json");
    expect(result.endsWith("package.json")).toBe(true);
  });
});
