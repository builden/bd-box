import { describe, it, expect } from "bun:test";
import { formatTimeAgo } from "./dateUtils";

describe("dateUtils", () => {
  describe("formatTimeAgo", () => {
    it("should return 'Just now' for recent dates", () => {
      const now = new Date();
      const recentDate = new Date(now.getTime() - 30 * 1000).toISOString();
      expect(formatTimeAgo(recentDate, now, undefined)).toBe("Just now");
    });

    it("should return '1 min ago' for 1 minute ago", () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();
      expect(formatTimeAgo(oneMinuteAgo, now, undefined)).toBe("1 min ago");
    });

    it("should return 'X mins ago' for minutes within an hour", () => {
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
      expect(formatTimeAgo(tenMinutesAgo, now, undefined)).toBe("10 mins ago");
    });

    it("should return '1 hour ago' for 1 hour ago", () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      expect(formatTimeAgo(oneHourAgo, now, undefined)).toBe("1 hour ago");
    });

    it("should return 'X hours ago' for hours within a day", () => {
      const now = new Date();
      const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString();
      expect(formatTimeAgo(fiveHoursAgo, now, undefined)).toBe("5 hours ago");
    });

    it("should return '1 day ago' for 1 day ago", () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      expect(formatTimeAgo(oneDayAgo, now, undefined)).toBe("1 day ago");
    });

    it("should return 'X days ago' for days within a week", () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatTimeAgo(threeDaysAgo, now, undefined)).toBe("3 days ago");
    });

    it("should return locale date for older dates", () => {
      const now = new Date();
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const result = formatTimeAgo(twoWeeksAgo, now, undefined);
      expect(result).not.toContain("ago");
    });

    it("should return 'Unknown' for invalid date", () => {
      expect(formatTimeAgo("invalid-date", new Date(), undefined)).toBe("Unknown");
    });

    it("should use translation function when provided", () => {
      const t = (key: string) => {
        if (key === "time.justNow") return "刚刚";
        return key;
      };
      const now = new Date();
      const recentDate = new Date(now.getTime() - 30 * 1000).toISOString();
      expect(formatTimeAgo(recentDate, now, t as any)).toBe("刚刚");
    });
  });
});
