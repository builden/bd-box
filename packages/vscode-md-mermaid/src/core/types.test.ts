import { describe, it, expect } from "bun:test";
import { ControlsVisibilityMode, ClickDragMode } from "./types";

describe("config", () => {
  describe("ControlsVisibilityMode", () => {
    it("should have correct values", () => {
      expect(String(ControlsVisibilityMode.Never)).toBe("never");
      expect(String(ControlsVisibilityMode.OnHoverOrFocus)).toBe("onHoverOrFocus");
      expect(String(ControlsVisibilityMode.Always)).toBe("always");
    });

    it("should have three modes", () => {
      const modes = Object.values(ControlsVisibilityMode);
      expect(modes).toHaveLength(3);
    });
  });

  describe("ClickDragMode", () => {
    it("should have correct values", () => {
      expect(String(ClickDragMode.Always)).toBe("always");
      expect(String(ClickDragMode.Alt)).toBe("alt");
      expect(String(ClickDragMode.Never)).toBe("never");
    });

    it("should have three modes", () => {
      const modes = Object.values(ClickDragMode);
      expect(modes).toHaveLength(3);
    });
  });
});
