import { describe, it, expect, beforeEach } from "bun:test";
import { getClaudeSettings, CLAUDE_SETTINGS_KEY, safeLocalStorage } from "./chatStorage";

describe("chatStorage", () => {
  beforeEach(() => {
    // Clear localStorage using the implemented clear
    const keys = Object.keys(localStorage);
    keys.forEach((key) => localStorage.removeItem(key));
  });

  describe("getClaudeSettings", () => {
    it("should return default settings when no stored settings", () => {
      const settings = getClaudeSettings();

      expect(settings.allowedTools).toEqual([]);
      expect(settings.disallowedTools).toEqual([]);
      expect(settings.skipPermissions).toBe(false);
      expect(settings.projectSortOrder).toBe("name");
    });

    it("should return stored settings when available", () => {
      const storedSettings = {
        allowedTools: ["tool1", "tool2"],
        disallowedTools: ["tool3"],
        skipPermissions: true,
        projectSortOrder: "date" as const,
      };
      localStorage.setItem(CLAUDE_SETTINGS_KEY, JSON.stringify(storedSettings));

      const settings = getClaudeSettings();

      expect(settings.allowedTools).toEqual(["tool1", "tool2"]);
      expect(settings.disallowedTools).toEqual(["tool3"]);
      expect(settings.skipPermissions).toBe(true);
      expect(settings.projectSortOrder).toBe("date");
    });

    it("should use default for missing allowedTools", () => {
      localStorage.setItem(CLAUDE_SETTINGS_KEY, JSON.stringify({ projectSortOrder: "date" }));

      const settings = getClaudeSettings();

      expect(settings.allowedTools).toEqual([]);
    });

    it("should use default for malformed allowedTools", () => {
      localStorage.setItem(CLAUDE_SETTINGS_KEY, JSON.stringify({ allowedTools: "not-array" }));

      const settings = getClaudeSettings();

      expect(settings.allowedTools).toEqual([]);
    });

    it("should use default when stored data is invalid JSON", () => {
      localStorage.setItem(CLAUDE_SETTINGS_KEY, "invalid-json");

      const settings = getClaudeSettings();

      expect(settings.allowedTools).toEqual([]);
    });
  });

  describe("safeLocalStorage", () => {
    it("should set and get item", () => {
      safeLocalStorage.setItem("testKey", "testValue");
      const result = safeLocalStorage.getItem("testKey");
      expect(result).toBe("testValue");
    });

    it("should remove item", () => {
      safeLocalStorage.setItem("testKey", "testValue");
      safeLocalStorage.removeItem("testKey");
      const result = safeLocalStorage.getItem("testKey");
      expect(result).toBeNull();
    });
  });
});
