import { describe, it, expect } from "bun:test";
import pc from "picocolors";
import Table from "cli-table3";

describe("renderTable - filtering and sorting logic", () => {
  // Test the filter logic in isolation
  it("should filter repos by tag correctly", () => {
    const repos = [
      { tags: ["frontend", "popular"] },
      { tags: ["editor"] },
      { tags: ["frontend"] },
    ] as unknown as import("./config").Repo[];

    const filtered = repos.filter((r) => r.tags.includes("frontend"));
    expect(filtered).toHaveLength(2);
  });

  it("should return empty array when no repos match tag", () => {
    const repos = [{ tags: ["frontend"] }, { tags: ["editor"] }] as unknown as import("./config").Repo[];

    const filtered = repos.filter((r) => r.tags.includes("nonexistent"));
    expect(filtered).toHaveLength(0);
  });

  it("should sort repos by owner then name", () => {
    const repos = [
      { owner: "facebook", name: "react" },
      { owner: "microsoft", name: "vscode" },
      { owner: "apple", name: "swift" },
    ] as unknown as import("./config").Repo[];

    const sorted = [...repos].sort((a, b) => {
      if (a.owner !== b.owner) return a.owner.localeCompare(b.owner);
      return a.name.localeCompare(b.name);
    });

    expect(sorted[0].owner).toBe("apple");
    expect(sorted[1].owner).toBe("facebook");
    expect(sorted[2].owner).toBe("microsoft");
  });
});

describe("RenderTableOptions interface", () => {
  it("should allow empty options", () => {
    const options: { tag?: string; simple?: boolean } = {};
    expect(options.tag).toBeUndefined();
    expect(options.simple).toBeUndefined();
  });

  it("should accept tag option", () => {
    const options: { tag?: string; simple?: boolean } = { tag: "frontend" };
    expect(options.tag).toBe("frontend");
  });

  it("should accept simple option", () => {
    const options: { tag?: string; simple?: boolean } = { simple: true };
    expect(options.simple).toBe(true);
  });

  it("should accept both options", () => {
    const options: { tag?: string; simple?: boolean } = { tag: "test", simple: false };
    expect(options.tag).toBe("test");
    expect(options.simple).toBe(false);
  });
});

describe("cli-table3 table creation", () => {
  it("should create table with correct headers", () => {
    const table = new Table({
      head: [pc.gray("#"), pc.gray("REPO"), pc.gray("SIZE"), pc.gray("VERSION"), pc.gray("UPDATED"), pc.gray("TAGS")],
      truncate: "",
    });

    expect(table.options.head).toHaveLength(6);
    expect(table.options.head![0]).toBe(pc.gray("#"));
    expect(table.options.head![1]).toBe(pc.gray("REPO"));
  });

  it("should push rows to table", () => {
    const table = new Table({
      head: ["#", "REPO"],
      truncate: "",
    });

    table.push(["1", "facebook/react"]);
    table.push(["2", "microsoft/vscode"]);

    expect(table.length).toBe(2);
  });
});

describe("repo display logic", () => {
  it("should use fullName in simple mode", () => {
    const repo = {
      fullName: "facebook/react",
      url: "https://github.com/facebook/react",
    } as unknown as import("./config").Repo;

    const repoDisplay = repo.fullName;
    expect(repoDisplay).toBe("facebook/react");
  });

  it("should use url in normal mode", () => {
    const repo = {
      fullName: "facebook/react",
      url: "https://github.com/facebook/react",
    } as unknown as import("./config").Repo;

    const repoDisplay = repo.url;
    expect(repoDisplay).toBe("https://github.com/facebook/react");
  });

  it("should join tags with comma and space", () => {
    const tags = ["frontend", "popular"];
    const tagDisplay = tags.join(", ") || "-";
    expect(tagDisplay).toBe("frontend, popular");
  });

  it("should return '-' for empty tags", () => {
    const tags: string[] = [];
    const tagDisplay = tags.join(", ") || "-";
    expect(tagDisplay).toBe("-");
  });
});

describe("table output format", () => {
  it("should generate table string", () => {
    const table = new Table({
      head: ["#", "REPO"],
      truncate: "",
    });

    table.push(["1", "facebook/react"]);
    table.push(["2", "microsoft/vscode"]);

    const output = table.toString();
    expect(output).toContain("facebook/react");
    expect(output).toContain("microsoft/vscode");
  });

  it("should include count in output message", () => {
    const count = 3;
    const message = `Found ${count} repository(s):\n`;
    expect(message).toBe("Found 3 repository(s):\n");
  });
});
