import { describe, it, expect } from "bun:test";
import { upgradeSelf } from "./upgrade";

describe("upgradeSelf", () => {
  it("should export upgradeSelf function", () => {
    expect(typeof upgradeSelf).toBe("function");
  });
});
