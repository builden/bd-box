import { describe, it, expect } from "bun:test";
import { getRelativeTime, findPackageJson, getPackageJsonVersion } from "./utils";
import { existsSync } from "fs";
import { resolve } from "path";

describe("getRelativeTime", () => {
  it("should return 'just now' for current time", () => {
    const now = new Date().toISOString();
    expect(getRelativeTime(now)).toBe("just now");
  });

  it("should return minutes ago", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(getRelativeTime(fiveMinutesAgo)).toBe("5m ago");
  });

  it("should return hours ago", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(getRelativeTime(twoHoursAgo)).toBe("2h ago");
  });

  it("should return days ago", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(getRelativeTime(threeDaysAgo)).toBe("3d ago");
  });

  it("should handle exactly 1 minute", () => {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    expect(getRelativeTime(oneMinuteAgo)).toBe("1m ago");
  });

  it("should handle exactly 1 hour", () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(getRelativeTime(oneHourAgo)).toBe("1h ago");
  });

  it("should handle exactly 1 day", () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(getRelativeTime(oneDayAgo)).toBe("1d ago");
  });
});

describe("findPackageJson", () => {
  it("should find package.json in current directory", () => {
    const pkgPath = findPackageJson();
    expect(pkgPath).toContain("package.json");
    expect(existsSync(pkgPath)).toBe(true);
  });

  it("should return absolute path", () => {
    const pkgPath = findPackageJson();
    expect(resolve(pkgPath)).toBe(pkgPath);
  });
});

describe("getPackageJsonVersion", () => {
  it("should return version string", () => {
    const version = getPackageJsonVersion();
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("should return correct version for git-src package", () => {
    const version = getPackageJsonVersion();
    expect(version).toBe("1.0.2");
  });
});
