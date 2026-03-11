import { describe, it, expect } from "bun:test";
import { sanitizeFileName, stripPrdExtension, ensurePrdExtension, createDefaultPrdName } from "./fileName";

describe("fileName utils", () => {
  describe("sanitizeFileName", () => {
    it("should remove invalid characters", () => {
      expect(sanitizeFileName("file<name>.txt")).toBe("filename.txt");
      expect(sanitizeFileName("file:name.txt")).toBe("filename.txt");
      expect(sanitizeFileName('file"name.txt')).toBe("filename.txt");
      expect(sanitizeFileName("file/name.txt")).toBe("filename.txt");
      expect(sanitizeFileName("file\\name.txt")).toBe("filename.txt");
      expect(sanitizeFileName("file|name.txt")).toBe("filename.txt");
      expect(sanitizeFileName("file?name.txt")).toBe("filename.txt");
      expect(sanitizeFileName("file*name.txt")).toBe("filename.txt");
    });

    it("should keep valid characters", () => {
      expect(sanitizeFileName("valid-file_name.txt")).toBe("valid-file_name.txt");
      expect(sanitizeFileName("file123.txt")).toBe("file123.txt");
    });

    it("should handle empty string", () => {
      expect(sanitizeFileName("")).toBe("");
    });
  });

  describe("stripPrdExtension", () => {
    it("should remove .txt extension", () => {
      expect(stripPrdExtension("document.txt")).toBe("document");
    });

    it("should remove .md extension", () => {
      expect(stripPrdExtension("document.md")).toBe("document");
    });

    it("should be case insensitive", () => {
      expect(stripPrdExtension("document.TXT")).toBe("document");
      expect(stripPrdExtension("document.MD")).toBe("document");
    });

    it("should keep file name without extension", () => {
      expect(stripPrdExtension("document")).toBe("document");
    });
  });

  describe("ensurePrdExtension", () => {
    it("should add .txt to file without extension", () => {
      expect(ensurePrdExtension("document")).toBe("document.txt");
    });

    it("should keep .txt extension", () => {
      expect(ensurePrdExtension("document.txt")).toBe("document.txt");
    });

    it("should keep .md extension", () => {
      expect(ensurePrdExtension("document.md")).toBe("document.md");
    });

    it("should add .txt to file with unknown extension", () => {
      expect(ensurePrdExtension("document.json")).toBe("document.json.txt");
    });
  });

  describe("createDefaultPrdName", () => {
    it("should create prd name with ISO date", () => {
      const date = new Date("2024-06-15T12:00:00Z");
      expect(createDefaultPrdName(date)).toBe("prd-2024-06-15");
    });

    it("should use local date", () => {
      const date = new Date("2024-01-01T23:00:00Z");
      const result = createDefaultPrdName(date);
      expect(result).toMatch(/^prd-2024-/);
    });
  });
});
