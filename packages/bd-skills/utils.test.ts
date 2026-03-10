import { describe, it, expect } from "bun:test";
import { extractSkillName, getSourceType, formatDate } from "./src/lib/utils";

describe("utils", () => {
  describe("extractSkillName", () => {
    it("should extract skill name from github URL", () => {
      expect(extractSkillName("https://github.com/owner/my-skill")).toBe("my-skill");
    });

    it("should extract skill name from git URL", () => {
      expect(extractSkillName("https://gitlab.com/owner/my-skill.git")).toBe("my-skill");
    });

    it("should handle .git suffix", () => {
      expect(extractSkillName("owner/my-skill.git")).toBe("my-skill");
    });

    it("should handle simple name", () => {
      expect(extractSkillName("my-skill")).toBe("my-skill");
    });
  });

  describe("getSourceType", () => {
    it("should identify github URLs", () => {
      expect(getSourceType("https://github.com/owner/skill")).toBe("github");
      expect(getSourceType("github.com/owner/skill")).toBe("github");
    });

    it("should identify git URLs", () => {
      expect(getSourceType("gitlab.com/owner/skill")).toBe("github");
    });

    it("should identify local paths", () => {
      expect(getSourceType("my-local-skill")).toBe("local");
      expect(getSourceType("skill")).toBe("local");
    });
  });

  describe("formatDate", () => {
    it("should format ISO date to YYYY-MM-DD", () => {
      expect(formatDate("2024-01-15T10:30:00Z")).toBe("2024-01-15");
    });

    it("should handle already formatted date", () => {
      expect(formatDate("2024-01-15")).toBe("2024-01-15");
    });
  });
});
