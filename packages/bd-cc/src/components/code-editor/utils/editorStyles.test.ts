import { describe, it, expect } from "bun:test";
import { getEditorLoadingStyles, getEditorStyles } from "./editorStyles";

describe("editorStyles", () => {
  describe("getEditorLoadingStyles", () => {
    it("should return dark mode styles when isDarkMode is true", () => {
      const styles = getEditorLoadingStyles(true);
      expect(styles).toContain("#111827");
    });

    it("should return light mode styles when isDarkMode is false", () => {
      const styles = getEditorLoadingStyles(false);
      expect(styles).toContain("#ffffff");
    });

    it("should include code-editor-loading class", () => {
      const styles = getEditorLoadingStyles(true);
      expect(styles).toContain(".code-editor-loading");
    });

    it("should include hover styles", () => {
      const styles = getEditorLoadingStyles(true);
      expect(styles).toContain(":hover");
    });
  });

  describe("getEditorStyles", () => {
    it("should return dark mode styles when isDarkMode is true", () => {
      const styles = getEditorStyles(true);
      expect(styles).toContain("rgba(239, 68, 68, 0.15)");
      expect(styles).toContain("#1e1e1e");
    });

    it("should return light mode styles when isDarkMode is false", () => {
      const styles = getEditorStyles(false);
      expect(styles).toContain("rgba(255, 235, 235, 1)");
      expect(styles).toContain("#f5f5f5");
    });

    it("should include cm-deletedChunk styles", () => {
      const styles = getEditorStyles(true);
      expect(styles).toContain(".cm-deletedChunk");
    });

    it("should include cm-insertedChunk styles", () => {
      const styles = getEditorStyles(true);
      expect(styles).toContain(".cm-insertedChunk");
    });

    it("should include minimap styles", () => {
      const styles = getEditorStyles(true);
      expect(styles).toContain(".cm-gutter.cm-gutter-minimap");
    });

    it("should include toolbar panel styles", () => {
      const styles = getEditorStyles(true);
      expect(styles).toContain(".cm-editor-toolbar-panel");
    });

    it("should include diff navigation button styles", () => {
      const styles = getEditorStyles(true);
      expect(styles).toContain(".cm-diff-nav-btn");
    });

    it("should include toolbar button styles", () => {
      const styles = getEditorStyles(true);
      expect(styles).toContain(".cm-toolbar-btn");
    });
  });
});
