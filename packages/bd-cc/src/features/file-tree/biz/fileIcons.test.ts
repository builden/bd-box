import { describe, it, expect } from "bun:test";
import { getFileIconData } from "./fileIcons";

describe("fileIcons", () => {
  describe("getFileIconData", () => {
    it("should return exact filename matches", () => {
      const result = getFileIconData("Dockerfile");
      expect(result.color).toContain("blue");
    });

    it("should return exact filename for package.json", () => {
      const result = getFileIconData("package.json");
      expect(result.color).toContain("green");
    });

    it("should return exact filename for README.md", () => {
      const result = getFileIconData("README.md");
      expect(result.color).toContain("blue");
    });

    it("should return exact filename for .gitignore", () => {
      const result = getFileIconData(".gitignore");
      expect(result.color).toContain("gray");
    });

    it("should handle .env prefix files", () => {
      const result = getFileIconData(".env.local");
      expect(result.color).toContain("yellow");
    });

    it("should return default for .env with unknown suffix", () => {
      const result = getFileIconData(".env.unknown");
      expect(result.color).toContain("yellow");
    });

    it("should return TypeScript icon for .ts files", () => {
      const result = getFileIconData("file.ts");
      expect(result.color).toContain("blue");
    });

    it("should return JavaScript icon for .js files", () => {
      const result = getFileIconData("file.js");
      expect(result.color).toContain("yellow");
    });

    it("should return Python icon for .py files", () => {
      const result = getFileIconData("script.py");
      expect(result.color).toContain("emerald");
    });

    it("should return JSON icon for .json files", () => {
      const result = getFileIconData("config.json");
      expect(result.color).toContain("yellow");
    });

    it("should return CSS icon for .css files", () => {
      const result = getFileIconData("style.css");
      expect(result.color).toContain("blue");
    });

    it("should return SCSS icon for .scss files", () => {
      const result = getFileIconData("style.scss");
      expect(result.color).toContain("pink");
    });

    it("should return HTML icon for .html files", () => {
      const result = getFileIconData("index.html");
      expect(result.color).toContain("orange");
    });

    it("should return image icon for .png files", () => {
      const result = getFileIconData("image.png");
      expect(result.color).toContain("purple");
    });

    it("should return video icon for .mp4 files", () => {
      const result = getFileIconData("video.mp4");
      expect(result.color).toContain("rose");
    });

    it("should return archive icon for .zip files", () => {
      const result = getFileIconData("archive.zip");
      expect(result.color).toContain("amber");
    });

    it("should be case insensitive for extension", () => {
      const result = getFileIconData("file.TS");
      expect(result.color).toContain("blue");
    });

    it("should return default icon for unknown extensions", () => {
      const result = getFileIconData("file.xyz");
      expect(result.color).toContain("muted");
    });

    it("should handle files without extension", () => {
      const result = getFileIconData("Makefile");
      expect(result.color).toContain("gray");
    });

    it("should handle docker-compose files", () => {
      const result = getFileIconData("docker-compose.yml");
      expect(result.color).toContain("blue");
    });

    it("should handle tsconfig.json", () => {
      const result = getFileIconData("tsconfig.json");
      expect(result.color).toContain("blue");
    });

    it("should handle vite.config.ts", () => {
      const result = getFileIconData("vite.config.ts");
      expect(result.color).toContain("purple");
    });
  });
});
