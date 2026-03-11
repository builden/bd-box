import { describe, it, expect } from "bun:test";
import {
  getAllChangedFiles,
  getChangedFileCount,
  hasChangedFiles,
  getStatusLabel,
  getStatusBadgeClass,
} from "./gitPanelUtils";

describe("gitPanelUtils", () => {
  describe("getAllChangedFiles", () => {
    it("should return empty array for null", () => {
      expect(getAllChangedFiles(null)).toEqual([]);
    });

    it("should return empty array for empty status", () => {
      expect(getAllChangedFiles({})).toEqual([]);
    });

    it("should return all changed files from all groups", () => {
      const gitStatus = {
        modified: ["file1.ts", "file2.ts"],
        added: ["newFile.ts"],
        deleted: ["deletedFile.ts"],
        untracked: ["untracked.ts"],
      };
      const result = getAllChangedFiles(gitStatus);
      expect(result.length).toBeGreaterThanOrEqual(4);
      expect(result).toContain("file1.ts");
      expect(result).toContain("file2.ts");
      expect(result).toContain("newFile.ts");
      expect(result).toContain("deletedFile.ts");
      expect(result).toContain("untracked.ts");
    });

    it("should handle partial status groups", () => {
      const gitStatus = {
        modified: ["file1.ts"],
      };
      const result = getAllChangedFiles(gitStatus);
      expect(result).toEqual(["file1.ts"]);
    });
  });

  describe("getChangedFileCount", () => {
    it("should return 0 for null", () => {
      expect(getChangedFileCount(null)).toBe(0);
    });

    it("should return 0 for empty status", () => {
      expect(getChangedFileCount({})).toBe(0);
    });

    it("should return correct count", () => {
      const gitStatus = {
        modified: ["file1.ts", "file2.ts"],
        added: ["newFile.ts"],
      };
      expect(getChangedFileCount(gitStatus)).toBe(3);
    });
  });

  describe("hasChangedFiles", () => {
    it("should return false for null", () => {
      expect(hasChangedFiles(null)).toBe(false);
    });

    it("should return false for empty status", () => {
      expect(hasChangedFiles({})).toBe(false);
    });

    it("should return true when there are changed files", () => {
      const gitStatus = { modified: ["file1.ts"] };
      expect(hasChangedFiles(gitStatus)).toBe(true);
    });
  });

  describe("getStatusLabel", () => {
    it("should return label for M (modified)", () => {
      expect(getStatusLabel("M")).toBe("Modified");
    });

    it("should return label for A (added)", () => {
      expect(getStatusLabel("A")).toBe("Added");
    });

    it("should return label for D (deleted)", () => {
      expect(getStatusLabel("D")).toBe("Deleted");
    });

    it("should return label for U (untracked)", () => {
      expect(getStatusLabel("U")).toBe("Untracked");
    });

    it("should return status code for unknown status", () => {
      expect(getStatusLabel("X")).toBe("X");
    });
  });

  describe("getStatusBadgeClass", () => {
    it("should return class for M (modified)", () => {
      const result = getStatusBadgeClass("M");
      expect(result).toContain("yellow");
    });

    it("should return class for A (added)", () => {
      const result = getStatusBadgeClass("A");
      expect(result).toContain("green");
    });

    it("should return class for D (deleted)", () => {
      const result = getStatusBadgeClass("D");
      expect(result).toContain("red");
    });

    it("should return default class for unknown status", () => {
      const result = getStatusBadgeClass("X");
      expect(result).toContain("muted");
    });
  });
});
