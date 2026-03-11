import { describe, it, expect } from "bun:test";
import {
  decodeHtmlEntities,
  normalizeInlineCodeFences,
  unescapeWithMathProtection,
  escapeRegExp,
  formatUsageLimitText,
} from "./chatFormatting";

describe("chatFormatting", () => {
  describe("decodeHtmlEntities", () => {
    it("should decode &lt;", () => {
      expect(decodeHtmlEntities("&lt;div&gt;")).toBe("<div>");
    });

    it("should decode &gt;", () => {
      expect(decodeHtmlEntities("&gt;")).toBe(">");
    });

    it("should decode &quot;", () => {
      expect(decodeHtmlEntities("&quot;test&quot;")).toBe('"test"');
    });

    it("should decode &#39;", () => {
      expect(decodeHtmlEntities("&#39;")).toBe("'");
    });

    it("should decode &amp;", () => {
      expect(decodeHtmlEntities("&amp;&lt;")).toBe("&<");
    });

    it("should return empty string as is", () => {
      expect(decodeHtmlEntities("")).toBe("");
    });

    it("should return null as is", () => {
      expect(decodeHtmlEntities(null as any)).toBe(null);
    });
  });

  describe("normalizeInlineCodeFences", () => {
    it("should convert triple backticks to single backticks", () => {
      expect(normalizeInlineCodeFences("```js```")).toBe("`js`");
    });

    it("should handle multiple code blocks", () => {
      expect(normalizeInlineCodeFences("```js``` and ```ts```")).toBe("`js` and `ts`");
    });

    it("should return empty string as is", () => {
      expect(normalizeInlineCodeFences("")).toBe("");
    });

    it("should return null as is", () => {
      expect(normalizeInlineCodeFences(null as any)).toBe(null);
    });

    it("should handle non-string input", () => {
      expect(normalizeInlineCodeFences(123 as any)).toBe(123);
    });
  });

  describe("unescapeWithMathProtection", () => {
    it("should preserve inline math $...$", () => {
      expect(unescapeWithMathProtection("text $x^2$ text")).toBe("text $x^2$ text");
    });

    it("should preserve block math $$...$$", () => {
      expect(unescapeWithMathProtection("text $$\\sum$$ text")).toBe("text $$\\sum$$ text");
    });

    it("should unescape \\n to newline", () => {
      expect(unescapeWithMathProtection("line1\\nline2")).toBe("line1\nline2");
    });

    it("should unescape \\t to tab", () => {
      expect(unescapeWithMathProtection("col1\\tcol2")).toBe("col1\tcol2");
    });

    it("should unescape \\r to carriage return", () => {
      expect(unescapeWithMathProtection("line1\\rline2")).toBe("line1\rline2");
    });

    it("should return empty string as is", () => {
      expect(unescapeWithMathProtection("")).toBe("");
    });

    it("should return null as is", () => {
      expect(unescapeWithMathProtection(null as any)).toBe(null);
    });
  });

  describe("escapeRegExp", () => {
    it("should escape special characters", () => {
      expect(escapeRegExp("a.b*c?d")).toBe("a\\.b\\*c\\?d");
    });

    it("should escape brackets", () => {
      expect(escapeRegExp("[a]")).toBe("\\[a\\]");
    });

    it("should escape parentheses", () => {
      expect(escapeRegExp("(a)")).toBe("\\(a\\)");
    });

    it("should escape backslash", () => {
      expect(escapeRegExp("a\\b")).toBe("a\\\\b");
    });

    it("should escape caret and dollar", () => {
      expect(escapeRegExp("a^b$d")).toBe("a\\^b\\$d");
    });
  });

  describe("formatUsageLimitText", () => {
    it("should replace timestamp with formatted date (seconds)", () => {
      // 1704067200 = 2024-01-01 00:00:00 UTC
      const text = "Claude AI usage limit reached|1704067200";
      const result = formatUsageLimitText(text);
      expect(result).toContain("Claude usage limit reached");
      expect(result).toContain("1 Jan 2024");
    });

    it("should replace timestamp with formatted date (milliseconds)", () => {
      // 1704067200000 = 2024-01-01 00:00:00 UTC
      const text = "Claude AI usage limit reached|1704067200000";
      const result = formatUsageLimitText(text);
      expect(result).toContain("Claude usage limit reached");
      expect(result).toContain("1 Jan 2024");
    });

    it("should return original text when no match", () => {
      const text = "Some other message";
      expect(formatUsageLimitText(text)).toBe(text);
    });

    it("should return non-string as is", () => {
      expect(formatUsageLimitText(null as any)).toBe(null);
      expect(formatUsageLimitText(123 as any)).toBe(123);
    });
  });
});
