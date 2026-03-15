import { describe, it, expect } from "bun:test";
import {
  filterFileTree,
  collectExpandedDirectoryPaths,
  formatFileSize,
  formatRelativeTime,
  isImageFile,
} from "./fileTreeUtils";

describe("fileTreeUtils", () => {
  describe("filterFileTree", () => {
    const createNode = (name: string, type: "file" | "directory", children?: any[]): any => ({
      name,
      path: `/${name}`,
      type,
      children,
    });

    it("should return empty array for empty input", () => {
      expect(filterFileTree([], "test")).toEqual([]);
    });

    it("should filter by name case-insensitively", () => {
      const items = [createNode("ReadMe", "file"), createNode("App.tsx", "file")];
      const result = filterFileTree(items, "read");
      expect(result.length).toBe(1);
      expect(result[0].name).toBe("ReadMe");
    });

    it("should include parent when child matches", () => {
      const items = [
        {
          name: "src",
          path: "/src",
          type: "directory" as const,
          children: [createNode("App.tsx", "file")],
        },
      ];
      const result = filterFileTree(items, "app");
      expect(result.length).toBe(1);
      expect(result[0].name).toBe("src");
      expect(result[0].children?.length).toBe(1);
    });

    it("should return empty array when no matches", () => {
      const items = [createNode("App.tsx", "file")];
      const result = filterFileTree(items, "xyz");
      expect(result).toEqual([]);
    });
  });

  describe("collectExpandedDirectoryPaths", () => {
    it("should return empty array for empty input", () => {
      expect(collectExpandedDirectoryPaths([])).toEqual([]);
    });

    it("should collect paths from nested directories", () => {
      const items = [
        {
          name: "src",
          path: "/src",
          type: "directory" as const,
          children: [
            {
              name: "components",
              path: "/src/components",
              type: "directory" as const,
              children: [{ name: "App.tsx", path: "/src/components/App.tsx", type: "file" as const }],
            },
          ],
        },
      ];
      const result = collectExpandedDirectoryPaths(items);
      expect(result).toContain("/src");
      expect(result).toContain("/src/components");
    });

    it("should not include empty directories", () => {
      const items = [
        {
          name: "empty",
          path: "/empty",
          type: "directory" as const,
          children: [],
        },
      ];
      const result = collectExpandedDirectoryPaths(items);
      expect(result).toEqual([]);
    });
  });

  describe("formatFileSize", () => {
    it("should return 0 B for undefined", () => {
      expect(formatFileSize(undefined)).toBe("0 B");
    });

    it("should return 0 B for zero", () => {
      expect(formatFileSize(0)).toBe("0 B");
    });

    it("should format bytes", () => {
      expect(formatFileSize(500)).toBe("500 B");
    });

    it("should format kilobytes", () => {
      expect(formatFileSize(1024)).toBe("1 KB");
      expect(formatFileSize(1536)).toBe("1.5 KB");
    });

    it("should format megabytes", () => {
      expect(formatFileSize(1048576)).toBe("1 MB");
      expect(formatFileSize(1572864)).toBe("1.5 MB");
    });

    it("should format gigabytes", () => {
      expect(formatFileSize(1073741824)).toBe("1 GB");
    });
  });

  describe("formatRelativeTime", () => {
    const t = (key: string) => key;

    it("should return dash for undefined date", () => {
      expect(formatRelativeTime(undefined, t as any)).toBe("-");
    });

    it("should return just now for recent dates", () => {
      const now = new Date().toISOString();
      expect(formatRelativeTime(now, t as any)).toBe("fileTree.justNow");
    });

    it("should return minutes ago for dates within an hour", () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      expect(formatRelativeTime(tenMinutesAgo, t as any)).toBe("fileTree.minAgo");
    });

    it("should return hours ago for dates within a day", () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(twoHoursAgo, t as any)).toBe("fileTree.hoursAgo");
    });

    it("should return days ago for dates within a month", () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(fiveDaysAgo, t as any)).toBe("fileTree.daysAgo");
    });

    it("should return locale date for older dates", () => {
      const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      const result = formatRelativeTime(twoMonthsAgo, t as any);
      expect(result).not.toBe("fileTree.daysAgo");
    });
  });

  describe("isImageFile", () => {
    it("should return true for image extensions", () => {
      expect(isImageFile("photo.png")).toBe(true);
      expect(isImageFile("photo.jpg")).toBe(true);
      expect(isImageFile("photo.jpeg")).toBe(true);
      expect(isImageFile("photo.gif")).toBe(true);
      expect(isImageFile("photo.webp")).toBe(true);
      expect(isImageFile("photo.svg")).toBe(true);
    });

    it("should return false for non-image extensions", () => {
      expect(isImageFile("document.txt")).toBe(false);
      expect(isImageFile("script.js")).toBe(false);
      expect(isImageFile("style.css")).toBe(false);
    });

    it("should handle uppercase extensions", () => {
      expect(isImageFile("photo.PNG")).toBe(true);
      expect(isImageFile("photo.JPG")).toBe(true);
    });

    it("should return false for files without extension", () => {
      expect(isImageFile("README")).toBe(false);
    });
  });
});
