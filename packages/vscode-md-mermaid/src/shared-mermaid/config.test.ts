import { describe, it, expect } from "bun:test";
import { ControlsVisibilityMode, ClickDragMode } from "../core/types";
import type { MermaidExtensionConfig } from "../core/types";

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

  describe("MermaidExtensionConfig", () => {
    it("should have correct interface properties", () => {
      const config: MermaidExtensionConfig = {
        darkModeTheme: "dark",
        lightModeTheme: "default",
        maxTextSize: 50000,
        clickDrag: ClickDragMode.Alt,
        showControls: ControlsVisibilityMode.OnHoverOrFocus,
        resizable: true,
        maxHeight: "",
      };

      expect(config.darkModeTheme).toBe("dark");
      expect(config.lightModeTheme).toBe("default");
      expect(config.maxTextSize).toBe(50000);
      expect(config.clickDrag).toBe(ClickDragMode.Alt);
      expect(config.showControls).toBe(ControlsVisibilityMode.OnHoverOrFocus);
      expect(config.resizable).toBe(true);
      expect(config.maxHeight).toBe("");
    });

    it("should allow custom maxHeight", () => {
      const config: MermaidExtensionConfig = {
        darkModeTheme: "dark",
        lightModeTheme: "default",
        maxTextSize: 50000,
        clickDrag: ClickDragMode.Alt,
        showControls: ControlsVisibilityMode.OnHoverOrFocus,
        resizable: true,
        maxHeight: "400px",
      };

      expect(config.maxHeight).toBe("400px");
    });

    it("should allow different theme options", () => {
      const themes = ["base", "forest", "dark", "default", "neutral"];
      const config: MermaidExtensionConfig = {
        darkModeTheme: "base",
        lightModeTheme: "neutral",
        maxTextSize: 50000,
        clickDrag: ClickDragMode.Always,
        showControls: ControlsVisibilityMode.Always,
        resizable: false,
        maxHeight: "80vh",
      };

      expect(themes).toContain(config.darkModeTheme);
      expect(themes).toContain(config.lightModeTheme);
    });
  });
});
