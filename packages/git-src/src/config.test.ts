import { describe, it, expect, beforeEach } from "bun:test";
import { Config, Repo, GitSrcConfig } from "./config";
import { existsSync, unlinkSync, mkdirSync, rmdirSync } from "fs";
import { dirname } from "path";

const TEST_DIR = "/tmp/git-src-test";
const TEST_CONFIG_PATH = `${TEST_DIR}/config.json`;

describe("Config", () => {
  beforeEach(() => {
    // Clean up test directory
    if (existsSync(TEST_CONFIG_PATH)) {
      unlinkSync(TEST_CONFIG_PATH);
    }
    if (existsSync(TEST_DIR)) {
      rmdirSync(TEST_DIR);
    }
  });

  it("should load empty config when file not exists", () => {
    const config = new Config(TEST_CONFIG_PATH);
    expect(config.getRepos()).toEqual([]);
  });

  it("should save and load repos", () => {
    const config = new Config(TEST_CONFIG_PATH);

    const testRepo: Repo = {
      id: "001",
      name: "react",
      owner: "facebook",
      fullName: "facebook/react",
      path: "/test/path",
      url: "https://github.com/facebook/react",
      tags: ["important"],
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    config.addRepo(testRepo);

    const repos = config.getRepos();
    expect(repos).toHaveLength(1);
    expect(repos[0].name).toBe("react");
    expect(repos[0].owner).toBe("facebook");
  });

  it("should find repo by fullName or name", () => {
    const config = new Config(TEST_CONFIG_PATH);

    config.addRepo({
      id: "001",
      name: "react",
      owner: "facebook",
      fullName: "facebook/react",
      path: "/test/path",
      url: "https://github.com/facebook/react",
      tags: [],
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(config.findRepo("react")).toBeDefined();
    expect(config.findRepo("facebook/react")).toBeDefined();
    expect(config.findRepo("nonexistent")).toBeUndefined();
  });

  it("should remove repo", () => {
    const config = new Config(TEST_CONFIG_PATH);

    config.addRepo({
      id: "001",
      name: "react",
      owner: "facebook",
      fullName: "facebook/react",
      path: "/test/path",
      url: "https://github.com/facebook/react",
      tags: [],
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    config.removeRepo("facebook/react");

    expect(config.getRepos()).toHaveLength(0);
  });

  it("should update repo tags", () => {
    const config = new Config(TEST_CONFIG_PATH);

    config.addRepo({
      id: "001",
      name: "react",
      owner: "facebook",
      fullName: "facebook/react",
      path: "/test/path",
      url: "https://github.com/facebook/react",
      tags: [],
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    config.updateRepo("facebook/react", { tags: ["important", "ui"] });

    const repo = config.findRepo("react");
    expect(repo?.tags).toEqual(["important", "ui"]);
  });
});
