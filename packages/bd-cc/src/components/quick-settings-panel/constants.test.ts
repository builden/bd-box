import { describe, it, expect } from "bun:test";
import {
  HANDLE_POSITION_STORAGE_KEY,
  WHISPER_MODE_STORAGE_KEY,
  DEFAULT_HANDLE_POSITION,
  HANDLE_POSITION_MIN,
  HANDLE_POSITION_MAX,
  DRAG_THRESHOLD_PX,
  SETTING_ROW_CLASS,
  TOGGLE_ROW_CLASS,
  CHECKBOX_CLASS,
  TOOL_DISPLAY_TOGGLES,
  VIEW_OPTION_TOGGLES,
  INPUT_SETTING_TOGGLES,
  WHISPER_OPTIONS,
  VIBE_MODE_ALIASES,
} from "./constants";

describe("quick-settings-panel constants", () => {
  describe("Storage keys", () => {
    it("should have correct handle position storage key", () => {
      expect(HANDLE_POSITION_STORAGE_KEY).toBe("quickSettingsHandlePosition");
    });

    it("should have correct whisper mode storage key", () => {
      expect(WHISPER_MODE_STORAGE_KEY).toBe("whisperMode");
    });
  });

  describe("Position constants", () => {
    it("should have default handle position", () => {
      expect(DEFAULT_HANDLE_POSITION).toBe(50);
    });

    it("should have minimum handle position", () => {
      expect(HANDLE_POSITION_MIN).toBe(10);
    });

    it("should have maximum handle position", () => {
      expect(HANDLE_POSITION_MAX).toBe(90);
    });

    it("should have drag threshold", () => {
      expect(DRAG_THRESHOLD_PX).toBe(5);
    });
  });

  describe("CSS classes", () => {
    it("should have setting row class", () => {
      expect(SETTING_ROW_CLASS).toContain("flex");
      expect(SETTING_ROW_CLASS).toContain("items-center");
    });

    it("should have toggle row class", () => {
      expect(TOGGLE_ROW_CLASS).toContain("cursor-pointer");
    });

    it("should have checkbox class", () => {
      expect(CHECKBOX_CLASS).toContain("rounded");
      expect(CHECKBOX_CLASS).toContain("border-gray-300");
    });
  });

  describe("Tool display toggles", () => {
    it("should have autoExpandTools toggle", () => {
      const toggle = TOOL_DISPLAY_TOGGLES.find((t) => t.key === "autoExpandTools");
      expect(toggle).toBeDefined();
      expect(toggle?.labelKey).toBe("quickSettings.autoExpandTools");
    });

    it("should have showRawParameters toggle", () => {
      const toggle = TOOL_DISPLAY_TOGGLES.find((t) => t.key === "showRawParameters");
      expect(toggle).toBeDefined();
    });

    it("should have showThinking toggle", () => {
      const toggle = TOOL_DISPLAY_TOGGLES.find((t) => t.key === "showThinking");
      expect(toggle).toBeDefined();
    });
  });

  describe("View option toggles", () => {
    it("should have autoScrollToBottom toggle", () => {
      const toggle = VIEW_OPTION_TOGGLES.find((t) => t.key === "autoScrollToBottom");
      expect(toggle).toBeDefined();
    });
  });

  describe("Input setting toggles", () => {
    it("should have sendByCtrlEnter toggle", () => {
      const toggle = INPUT_SETTING_TOGGLES.find((t) => t.key === "sendByCtrlEnter");
      expect(toggle).toBeDefined();
    });
  });

  describe("Whisper options", () => {
    it("should have default option", () => {
      const option = WHISPER_OPTIONS.find((o) => o.value === "default");
      expect(option).toBeDefined();
      expect(option?.titleKey).toContain("default");
    });

    it("should have prompt option", () => {
      const option = WHISPER_OPTIONS.find((o) => o.value === "prompt");
      expect(option).toBeDefined();
    });

    it("should have vibe option", () => {
      const option = WHISPER_OPTIONS.find((o) => o.value === "vibe");
      expect(option).toBeDefined();
    });
  });

  describe("Vibe mode aliases", () => {
    it("should include vibe", () => {
      expect(VIBE_MODE_ALIASES).toContain("vibe");
    });

    it("should include instructions", () => {
      expect(VIBE_MODE_ALIASES).toContain("instructions");
    });

    it("should include architect", () => {
      expect(VIBE_MODE_ALIASES).toContain("architect");
    });
  });
});
