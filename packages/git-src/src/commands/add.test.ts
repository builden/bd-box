import { describe, it, expect } from "bun:test";
import { parseRepoInput } from "./add";

describe("parseRepoInput", () => {
  it("should parse simple repo name", () => {
    const result = parseRepoInput("react");
    expect(result.owner).toBe("facebook");
    expect(result.name).toBe("react");
    expect(result.fullName).toBe("facebook/react");
  });

  it("should parse owner/repo format", () => {
    const result = parseRepoInput("vuejs/vue");
    expect(result.owner).toBe("vuejs");
    expect(result.name).toBe("vue");
    expect(result.fullName).toBe("vuejs/vue");
  });

  it("should parse GitHub URL", () => {
    const result = parseRepoInput("https://github.com/vuejs/vue");
    expect(result.owner).toBe("vuejs");
    expect(result.name).toBe("vue");
    expect(result.fullName).toBe("vuejs/vue");
  });

  it("should parse GitHub URL with .git suffix", () => {
    const result = parseRepoInput("https://github.com/vuejs/vue.git");
    expect(result.owner).toBe("vuejs");
    expect(result.name).toBe("vue");
    expect(result.fullName).toBe("vuejs/vue");
  });

  it("should parse GitHub URL with git@ protocol", () => {
    const result = parseRepoInput("git@github.com:facebook/react.git");
    expect(result.owner).toBe("facebook");
    expect(result.name).toBe("react");
    expect(result.fullName).toBe("facebook/react");
  });

  it("should handle org format with multiple slashes", () => {
    const result = parseRepoInput("microsoft/vscode");
    expect(result.owner).toBe("microsoft");
    expect(result.name).toBe("vscode");
    expect(result.fullName).toBe("microsoft/vscode");
  });
});
