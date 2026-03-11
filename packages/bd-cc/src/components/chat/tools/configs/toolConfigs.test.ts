import { describe, it, expect } from "bun:test";
import { getToolConfig, shouldHideToolResult } from "./toolConfigs";

describe("toolConfigs", () => {
  describe("getToolConfig", () => {
    it("should return Bash config for Bash tool", () => {
      const config = getToolConfig("Bash");
      expect(config.input.type).toBe("one-line");
      expect(config.input.style).toBe("terminal");
    });

    it("should return Read config for Read tool", () => {
      const config = getToolConfig("Read");
      expect(config.input.type).toBe("one-line");
      expect(config.input.label).toBe("Read");
    });

    it("should return Edit config for Edit tool", () => {
      const config = getToolConfig("Edit");
      expect(config.input.type).toBe("collapsible");
      expect(config.input.contentType).toBe("diff");
    });

    it("should return Write config for Write tool", () => {
      const config = getToolConfig("Write");
      expect(config.input.type).toBe("collapsible");
      expect(config.input.contentType).toBe("diff");
    });

    it("should return Grep config for Grep tool", () => {
      const config = getToolConfig("Grep");
      expect(config.input.type).toBe("one-line");
      expect(config.input.action).toBe("jump-to-results");
    });

    it("should return TodoWrite config for TodoWrite tool", () => {
      const config = getToolConfig("TodoWrite");
      expect(config.input.contentType).toBe("todo-list");
    });

    it("should return default config for unknown tool", () => {
      const config = getToolConfig("UnknownTool");
      expect(config.input.type).toBe("collapsible");
      expect(config.input.contentType).toBe("text");
    });

    it("should return Task config for Task tool", () => {
      const config = getToolConfig("Task");
      expect(config.input.type).toBe("collapsible");
      expect(config.input.contentType).toBe("markdown");
    });

    it("should return AskUserQuestion config", () => {
      const config = getToolConfig("AskUserQuestion");
      expect(config.input.contentType).toBe("question-answer");
    });
  });

  describe("shouldHideToolResult", () => {
    it("should return true when result is hidden", () => {
      // Read tool has hidden: true
      const result = shouldHideToolResult("Read", { content: "test" });
      expect(result).toBe(true);
    });

    it("should return true when hideOnSuccess and no error", () => {
      // Bash tool has hideOnSuccess: true
      const result = shouldHideToolResult("Bash", { isError: false });
      expect(result).toBe(true);
    });

    it("should return false when hideOnSuccess but has error", () => {
      const result = shouldHideToolResult("Bash", { isError: true });
      expect(result).toBe(false);
    });

    it("should return false when no result config", () => {
      const result = shouldHideToolResult("Grep", { content: "test" });
      expect(result).toBe(false);
    });

    it("should return false for default config", () => {
      const result = shouldHideToolResult("UnknownTool", { content: "test" });
      expect(result).toBe(false);
    });

    it("should return false when result is null", () => {
      const result = shouldHideToolResult("Bash", null);
      expect(result).toBe(false);
    });
  });
});
