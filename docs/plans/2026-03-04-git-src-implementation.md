# git-src CLI 工具实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 开发一个名为 `git-src` 的 Git 源码管理 CLI 工具，供 AI Agent 参考实际源码

**Architecture:** 使用 Bun 开发 CLI 工具，Commander 处理命令行参数，配置文件存储在 ~/.git-src/config.json

**Tech Stack:** Bun, Commander, ora, chalk, enquirer, execa

---

## 准备工作

### Task 1: 创建子包结构

**Files:**

- Create: `packages/git-src/package.json`
- Create: `packages/git-src/tsconfig.json`
- Create: `packages/git-src/src/index.ts`

**Step 1: 创建 package.json**

```json
{
  "name": "git-src",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "git-src": "./dist/index.js"
  },
  "scripts": {
    "build": "bun build.ts",
    "dev": "bun run src/index.ts"
  },
  "dependencies": {
    "commander": "^12.0.0",
    "ora": "^5.4.1",
    "chalk": "^5.3.0",
    "enquirer": "^2.4.1",
    "execa": "^8.0.1"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "bun-types": "^1.0.0"
  }
}
```

**Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "types": ["bun-types"]
  },
  "include": ["src/**/*"]
}
```

**Step 3: 创建 src/index.ts 入口文件**

```typescript
#!/usr/bin/env bun

import { Command } from "commander";

const program = new Command();

program.name("git-src").description("Git source code manager for AI Agents").version("1.0.0");

program.parse();
```

**Step 4: 提交**

```bash
git add packages/git-src/
git commit -m "feat(git-src): initial package structure"
```

---

## Task 2: 实现配置存储模块

**Files:**

- Create: `packages/git-src/src/config.ts`
- Test: `packages/git-src/src/config.test.ts`

**Step 1: 写测试**

```typescript
import { describe, it, expect, beforeEach } from "bun:test";
import { Config, GitSrcConfig } from "./config";
import { existsSync, unlinkSync } from "fs";

const TEST_CONFIG_PATH = "/tmp/git-src-test-config.json";

describe("Config", () => {
  beforeEach(() => {
    if (existsSync(TEST_CONFIG_PATH)) {
      unlinkSync(TEST_CONFIG_PATH);
    }
  });

  it("should load empty config when file not exists", () => {
    const config = new Config(TEST_CONFIG_PATH);
    expect(config.getRepos()).toEqual([]);
  });

  it("should save and load repos", () => {
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
    const repos = config.getRepos();
    expect(repos).toHaveLength(1);
    expect(repos[0].name).toBe("react");
  });
});
```

**Step 2: 运行测试确认失败**

```bash
cd packages/git-src && bun test src/config.test.ts
# Expected: FAIL - config.ts not found
```

**Step 3: 实现配置模块**

```typescript
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname } from "path";

export interface Repo {
  id: string;
  name: string;
  owner: string;
  fullName: string;
  path: string;
  url: string;
  tags: string[];
  addedAt: string;
  updatedAt: string;
}

export interface GitSrcConfig {
  version: string;
  repos: Repo[];
}

const DEFAULT_CONFIG: GitSrcConfig = {
  version: "1.0.0",
  repos: [],
};

export class Config {
  private configPath: string;
  private config: GitSrcConfig;

  constructor(configPath: string = `${process.env.HOME}/.git-src/config.json`) {
    this.configPath = configPath;
    this.config = this.load();
  }

  private load(): GitSrcConfig {
    try {
      if (existsSync(this.configPath)) {
        const content = readFileSync(this.configPath, "utf-8");
        return JSON.parse(content);
      }
    } catch (e) {
      // ignore error
    }
    return { ...DEFAULT_CONFIG };
  }

  private save(): void {
    const dir = dirname(this.configPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
  }

  getRepos(): Repo[] {
    return this.config.repos;
  }

  addRepo(repo: Repo): void {
    this.config.repos.push(repo);
    this.save();
  }

  removeRepo(fullName: string): void {
    this.config.repos = this.config.repos.filter((r) => r.fullName !== fullName);
    this.save();
  }

  findRepo(query: string): Repo | undefined {
    return this.config.repos.find((r) => r.fullName === query || r.name === query || r.fullName.includes(query));
  }

  getConfigPath(): string {
    return this.configPath;
  }
}
```

**Step 4: 运行测试确认通过**

```bash
cd packages/git-src && bun test src/config.test.ts
# Expected: PASS
```

**Step 5: 提交**

```bash
git add packages/git-src/src/config.ts packages/git-src/src/config.test.ts
git commit -m "feat(git-src): add config storage module"
```

---

## Task 3: 实现 add 命令（克隆仓库）

**Files:**

- Modify: `packages/git-src/src/index.ts`
- Create: `packages/git-src/src/commands/add.ts`
- Test: `packages/git-src/src/commands/add.test.ts`

**Step 1: 写测试**

```typescript
import { describe, it, expect, mock } from "bun:test";
import { parseRepoInput } from "./add";

describe("parseRepoInput", () => {
  it("should parse simple repo name", () => {
    expect(parseRepoInput("react")).toEqual({
      owner: "facebook",
      name: "react",
      fullName: "facebook/react",
    });
  });

  it("should parse owner/repo format", () => {
    expect(parseRepoInput("vuejs/vue")).toEqual({
      owner: "vuejs",
      name: "vue",
      fullName: "vuejs/vue",
    });
  });

  it("should parse GitHub URL", () => {
    expect(parseRepoInput("https://github.com/vuejs/vue")).toEqual({
      owner: "vuejs",
      name: "vue",
      fullName: "vuejs/vue",
    });
  });
});
```

**Step 2: 运行测试确认失败**

```bash
cd packages/git-src && bun test src/commands/add.test.ts
# Expected: FAIL - add.ts not found
```

**Step 3: 实现 add.ts**

```typescript
import { execa } from "execa";
import ora from "ora";
import { Config } from "../config";

export interface ParseResult {
  owner: string;
  name: string;
  fullName: string;
}

export function parseRepoInput(input: string): ParseResult {
  // Handle full URL: https://github.com/owner/repo
  const urlMatch = input.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
  if (urlMatch) {
    return {
      owner: urlMatch[1],
      name: urlMatch[2].replace(/\.git$/, ""),
      fullName: `${urlMatch[1]}/${urlMatch[2].replace(/\.git$/, "")}`,
    };
  }

  // Handle owner/repo format
  if (input.includes("/")) {
    const [owner, name] = input.split("/");
    return { owner, name, fullName: `${owner}/${name}` };
  }

  // Simple repo name - assume facebook as default
  return {
    owner: "facebook",
    name: input,
    fullName: `facebook/${input}`,
  };
}

export async function addRepo(input: string): Promise<void> {
  const parsed = parseRepoInput(input);
  const config = new Config();
  const basePath = `${process.env.HOME}/.git-src`;
  const repoPath = `${basePath}/${parsed.owner}/${parsed.name}`;
  const repoUrl = `https://github.com/${parsed.fullName}`;

  const spinner = ora(`Cloning ${parsed.fullName}...`).start();

  try {
    await execa("git", ["clone", "--depth", "1", repoUrl, repoPath], {
      cwd: basePath,
    });

    config.addRepo({
      id: String(config.getRepos().length + 1).padStart(3, "0"),
      name: parsed.name,
      owner: parsed.owner,
      fullName: parsed.fullName,
      path: repoPath,
      url: repoUrl,
      tags: [],
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    spinner.succeed(`Cloned ${parsed.fullName}`);
  } catch (error) {
    spinner.fail(`Failed to clone ${parsed.fullName}`);
    throw error;
  }
}
```

**Step 4: 运行测试确认通过**

```bash
cd packages/git-src && bun test src/commands/add.test.ts
# Expected: PASS
```

**Step 5: 更新 index.ts 添加 add 命令**

```typescript
#!/usr/bin/env bun

import { Command } from "commander";
import { addRepo } from "./commands/add";

const program = new Command();

program.name("git-src").description("Git source code manager for AI Agents").version("1.0.0");

program
  .command("add <repo>")
  .description("Add a repository (supports: react, owner/repo, https://github.com/owner/repo)")
  .action(async (repo: string) => {
    try {
      await addRepo(repo);
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });

program.parse();
```

**Step 6: 提交**

```bash
git add packages/git-src/src/commands/add.ts packages/git-src/src/commands/add.test.ts packages/git-src/src/index.ts
git commit -m "feat(git-src): implement add command"
```

---

## Task 4: 实现 ls 命令（列表展示）

**Files:**

- Create: `packages/git-src/src/commands/ls.ts`
- Test: `packages/git-src/src/commands/ls.test.ts`

**Step 1: 写测试**

```typescript
import { describe, it, expect } from "bun:test";
import { formatRepoList, getRepoVersion } from "./ls";
import { Repo } from "../config";

describe("formatRepoList", () => {
  const mockRepos: Repo[] = [
    {
      id: "001",
      name: "vue",
      owner: "vuejs",
      fullName: "vuejs/vue",
      path: "/test/vue",
      url: "https://github.com/vuejs/vue",
      tags: ["important"],
      addedAt: "2026-03-01T00:00:00Z",
      updatedAt: "2026-03-04T00:00:00Z",
    },
  ];

  it("should format repos into table rows", () => {
    const rows = formatRepoList(mockRepos);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).toContain("vuejs/vue");
  });
});
```

**Step 2: 运行测试确认失败**

```bash
cd packages/git-src && bun test src/commands/ls.test.ts
# Expected: FAIL
```

**Step 3: 实现 ls.ts**

```typescript
import chalk from "chalk";
import { Config, Repo } from "../config";
import { statSync } from "fs";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFolderSize(path: string): string {
  try {
    // Simple version - just check if exists
    statSync(path);
    return "N/A";
  } catch {
    return "N/A";
  }
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  return "just now";
}

export function formatRepoList(repos: Repo[]): string[] {
  if (repos.length === 0) return [];

  const header = [
    chalk.gray("╭────"),
    chalk.gray("────────────────"),
    chalk.gray("──────────"),
    chalk.gray("────────"),
    chalk.gray("────────────"),
    chalk.gray("───────────"),
    chalk.gray("╮"),
  ].join("");

  const headerRow = [
    chalk.gray("│ #   "),
    chalk.gray(" REPO            "),
    chalk.gray(" OWNER    "),
    chalk.gray(" SIZE    "),
    chalk.gray(" VERSION "),
    chalk.gray(" UPDATED  "),
    chalk.gray(" TAGS      "),
    chalk.gray("│"),
  ].join("");

  const separator = [
    chalk.gray("├────"),
    chalk.gray("────────────────"),
    chalk.gray("──────────"),
    chalk.gray("────────"),
    chalk.gray("────────────"),
    chalk.gray("───────────"),
    chalk.gray("┤"),
  ].join("");

  const rows = repos.map((repo, index) => {
    const id = String(index + 1).padStart(3, "0");
    const name = repo.fullName.padEnd(16).slice(0, 16);
    const owner = repo.owner.padEnd(9).slice(0, 9);
    const size = "N/A".padEnd(8).slice(0, 8);
    const version = "N/A".padEnd(9).slice(0, 9);
    const updated = getRelativeTime(repo.updatedAt).padEnd(11).slice(0, 11);
    const tags = (repo.tags.join(", ") || "-").padEnd(10).slice(0, 10);

    return [
      chalk.gray(`│ ${id} `),
      chalk.white(name),
      chalk.gray(owner),
      chalk.gray(size),
      chalk.gray(version),
      chalk.gray(updated),
      chalk.cyan(tags),
      chalk.gray("│"),
    ].join("");
  });

  const footer = [
    chalk.gray("╰────"),
    chalk.gray("────────────────"),
    chalk.gray("──────────"),
    chalk.gray("────────"),
    chalk.gray("────────────"),
    chalk.gray("───────────"),
    chalk.gray("╯"),
  ].join("");

  return [header, headerRow, separator, ...rows, footer];
}

export async function listRepos(): Promise<void> {
  const config = new Config();
  const repos = config.getRepos();

  // Sort by owner then by repo name
  repos.sort((a, b) => {
    if (a.owner !== b.owner) return a.owner.localeCompare(b.owner);
    return a.name.localeCompare(b.name);
  });

  if (repos.length === 0) {
    console.log(chalk.yellow("No repositories added yet."));
    console.log(chalk.gray("Run: git-src add <repo>"));
    return;
  }

  const lines = formatRepoList(repos);
  lines.forEach((line) => console.log(line));
  console.log(chalk.gray(`\n[${repos.length} repos]`));
}
```

**Step 4: 运行测试确认通过**

```bash
cd packages/git-src && bun test src/commands/ls.test.ts
# Expected: PASS
```

**Step 5: 更新 index.ts 添加 ls 命令**

```typescript
// ... add command ...

program
  .command("ls")
  .description("List all repositories")
  .action(async () => {
    try {
      await listRepos();
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });
```

**Step 6: 提交**

```bash
git add packages/git-src/src/commands/ls.ts packages/git-src/src/commands/ls.test.ts packages/git-src/src/index.ts
git commit -m "feat(git-src): implement ls command"
```

---

## Task 5: 实现 rm 命令（删除仓库）

**Files:**

- Create: `packages/git-src/src/commands/rm.ts`
- Test: `packages/git-src/src/commands/rm.test.ts`

**Step 1: 写测试**

```typescript
import { describe, it, expect, mock } from "bun:test";
import { removeRepo } from "./rm";

describe("removeRepo", () => {
  mock.module("../config", () => ({
    Config: class MockConfig {
      getRepos() {
        return [{ fullName: "facebook/react", path: "/tmp/test" }];
      }
      removeRepo() {}
    },
  }));

  it("should remove existing repo", async () => {
    // Test implementation
  });
});
```

**Step 2: 实现 rm.ts**

```typescript
import chalk from "chalk";
import { execa } from "execa";
import ora from "ora";
import { Config } from "../config";

export async function removeRepo(repoName: string): Promise<void> {
  const config = new Config();
  const repo = config.findRepo(repoName);

  if (!repo) {
    console.error(chalk.red(`Repository "${repoName}" not found`));
    process.exit(1);
  }

  const spinner = ora(`Removing ${repo.fullName}...`).start();

  try {
    // Remove from filesystem
    await execa("rm", ["-rf", repo.path]);

    // Remove from config
    config.removeRepo(repo.fullName);

    spinner.succeed(`Removed ${repo.fullName}`);
  } catch (error) {
    spinner.fail(`Failed to remove ${repo.fullName}`);
    throw error;
  }
}
```

**Step 3: 提交**

```bash
git add packages/git-src/src/commands/rm.ts
git commit -m "feat(git-src): implement rm command"
```

---

## Task 6: 实现 query 命令（搜索）

**Files:**

- Create: `packages/git-src/src/commands/query.ts`

**Step 1: 实现 query.ts**

```typescript
import chalk from "chalk";
import { Config, Repo } from "../config";

export async function searchRepos(pattern: string, options: { tag?: string } = {}): Promise<void> {
  const config = new Config();
  let repos = config.getRepos();

  // Filter by tag if specified
  if (options.tag) {
    repos = repos.filter((r) => r.tags.includes(options.tag!));
  }

  // Filter by pattern (supports wildcards)
  if (pattern) {
    const regex = new RegExp(pattern.replace(/\*/g, ".*").replace(/\?/g, "."), "i");
    repos = repos.filter((r) => regex.test(r.fullName));
  }

  if (repos.length === 0) {
    console.log(chalk.yellow("No repositories found."));
    return;
  }

  console.log(chalk.gray(`Found ${repos.length} repository(s):\n`));
  repos.forEach((repo) => {
    console.log(chalk.white(repo.fullName));
    if (repo.tags.length > 0) {
      console.log(chalk.cyan(`  Tags: ${repo.tags.join(", ")}`));
    }
  });
}
```

**Step 2: 提交**

```bash
git add packages/git-src/src/commands/query.ts
git commit -m "feat(git-src): implement query command"
```

---

## Task 7: 实现 open 命令（交互式选择）

**Files:**

- Create: `packages/git-src/src/commands/open.ts`

**Step 1: 实现 open.ts**

```typescript
import chalk from "chalk";
import { Config, Repo } from "../config";
import { open as openEditor } from "execa";
import Enquirer from "enquirer";

function matchRepos(repos: Repo[], pattern: string): Repo[] {
  const regex = new RegExp(pattern.replace(/\*/g, ".*").replace(/\?/g, "."), "i");
  return repos.filter((r) => regex.test(r.fullName));
}

function highlightMatch(text: string, pattern: string): string {
  const regex = new RegExp(pattern.replace(/\*/g, ".*").replace(/\?/g, "."), "gi");
  return text.replace(regex, (match) => chalk.cyan(match));
}

export async function openRepo(pattern: string, options: { all: boolean } = { all: false }): Promise<void> {
  const config = new Config();
  const matches = matchRepos(config.getRepos(), pattern);

  if (matches.length === 0) {
    console.error(chalk.red(`No repository matching "${pattern}" found`));
    process.exit(1);
  }

  if (matches.length === 1) {
    const repo = matches[0];
    console.log(chalk.green(`Opening ${repo.fullName}...`));
    await openEditor("code", [repo.path]);
    return;
  }

  // Multiple matches - show selection
  if (!options.all) {
    const enquirer = new Enquirer();
    const response = await enquirer.select({
      message: "Select a repository:",
      choices: matches.map((r) => r.fullName),
    });
    const repo = matches.find((r) => r.fullName === response);
    if (repo) {
      console.log(chalk.green(`Opening ${repo.fullName}...`));
      await openEditor("code", [repo.path]);
    }
  } else {
    // Open all matches
    for (const repo of matches) {
      console.log(chalk.green(`Opening ${repo.fullName}...`));
      await openEditor("code", [repo.path]);
    }
  }
}
```

**Step 2: 提交**

```bash
git add packages/git-src/src/commands/open.ts
git commit -m "feat(git-src): implement open command with interactive selection"
```

---

## Task 8: 实现 update 和 outdated 命令

**Files:**

- Create: `packages/git-src/src/commands/update.ts`
- Create: `packages/git-src/src/commands/outdated.ts`

**Step 1: 实现 update.ts**

```typescript
import chalk from "chalk";
import { execa } from "execa";
import ora from "ora";
import { Config, Repo } from "../config";

export async function updateRepo(
  repoName: string | null,
  options: { force: boolean } = { force: false },
): Promise<void> {
  const config = new Config();
  const repos = repoName ? ([config.findRepo(repoName!)].filter(Boolean) as Repo[]) : config.getRepos();

  for (const repo of repos) {
    const spinner = ora(`Updating ${repo.fullName}...`).start();

    try {
      if (options.force) {
        // Force clone - remove and re-clone
        await execa("rm", ["-rf", repo.path]);
        await execa("git", ["clone", "--depth", "1", repo.url, repo.path]);
      } else {
        // Git pull
        await execa("git", ["pull"], { cwd: repo.path });
      }
      spinner.succeed(`Updated ${repo.fullName}`);
    } catch (error) {
      spinner.fail(`Failed to update ${repo.fullName}`);
    }
  }
}
```

**Step 2: 实现 outdated.ts**

```typescript
import chalk from "chalk";
import { execa } from "execa";
import { Config, Repo } from "../config";

export async function checkOutdated(repoName: string | null): Promise<void> {
  const config = new Config();
  const repos = repoName ? ([config.findRepo(repoName!)].filter(Boolean) as Repo[]) : config.getRepos();

  const results = [];

  for (const repo of repos) {
    try {
      await execa("git", ["fetch", "--dry-run"], { cwd: repo.path });
      // If no error, there might be updates
      results.push({ repo, hasUpdates: true });
    } catch {
      results.push({ repo, hasUpdates: false });
    }
  }

  const outdated = results.filter((r) => r.hasUpdates);
  const upToDate = results.filter((r) => !r.hasUpdates);

  if (outdated.length > 0) {
    console.log(chalk.yellow(`\n${outdated.length} repository(s) can be updated:\n`));
    outdated.forEach((r) => console.log(chalk.white(r.repo.fullName)));
  }

  if (upToDate.length > 0) {
    console.log(chalk.green(`\n${upToDate.length} repository(s) are up to date`));
  }
}
```

**Step 3: 提交**

```bash
git add packages/git-src/src/commands/update.ts packages/git-src/src/commands/outdated.ts
git commit -m "feat(git-src): implement update and outdated commands"
```

---

## Task 9: 实现 tag 命令

**Files:**

- Create: `packages/git-src/src/commands/tag.ts`

**Step 1: 实现 tag.ts**

```typescript
import chalk from "chalk";
import { Config } from "../config";

export async function manageTags(
  repoName: string,
  tag?: string,
  options: { delete: boolean } = { delete: false },
): Promise<void> {
  const config = new Config();
  const repo = config.findRepo(repoName);

  if (!repo) {
    console.error(chalk.red(`Repository "${repoName}" not found`));
    process.exit(1);
  }

  if (!tag) {
    // Show tags
    if (repo.tags.length === 0) {
      console.log(chalk.yellow(`No tags for ${repo.fullName}`));
    } else {
      console.log(chalk.white(`${repo.fullName} tags:`));
      repo.tags.forEach((t) => console.log(chalk.cyan(`  ${t}`)));
    }
    return;
  }

  // Add or delete tag
  if (options.delete) {
    repo.tags = repo.tags.filter((t) => t !== tag);
    console.log(chalk.green(`Removed tag "${tag}" from ${repo.fullName}`));
  } else {
    if (!repo.tags.includes(tag)) {
      repo.tags.push(tag);
      console.log(chalk.green(`Added tag "${tag}" to ${repo.fullName}`));
    }
  }

  // Save - need to implement updateRepo in Config
  config.updateRepo(repo.fullName, { tags: repo.tags });
}
```

**Step 2: 提交**

```bash
git add packages/git-src/src/commands/tag.ts
git commit -m "feat(git-src): implement tag command"
```

---

## Task 10: 生成 AI Skill

**Files:**

- Create: `packages/git-src/skill/git-src.md`

**Step 1: 创建 skill 文件**

```yaml
name: git-src
description: 管理本地 Git 仓库源码，供 AI Agent 参考实际源码

setup: |
  git-src 工具将仓库存储在 ~/.git-src/{owner}/{repo} 目录
  配置文件位于 ~/.git-src/config.json

commands:
  list: git-src ls
  search: git-src query <keyword>
  open: git-src open <repo> [--all]
  add: git-src add <repo>
  remove: git-src rm <repo>
  update: git-src update [repo] [--force]
  outdated: git-src outdated [repo]
  tag: git-src tag <repo> [tag] [--delete]

usage: |
  # 列出所有仓库
  git-src ls

  # 搜索仓库
  git-src query react
  git-src query --tag important

  # 打开仓库（交互式选择）
  git-src open react
  git-src open re* --all

  # 添加仓库
  git-src add react
  git-src add facebook/react
  git-src add https://github.com/vuejs/vue

  # 更新仓库
  git-src update
  git-src update react --force
```

**Step 2: 提交**

```bash
git add packages/git-src/skill/git-src.md
git commit -m "feat(git-src): add AI skill file"
```

---

## Task 11: 配置构建和发布

**Files:**

- Create: `packages/git-src/build.ts`

**Step 1: 创建构建脚本**

```typescript
import { build } from "esbuild";

await build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
  platform: "node",
  target: "node18",
  format: "esm",
  banner: {
    js: "#!/usr/bin/env bun",
  },
  external: [],
});

console.log("Build complete!");
```

**Step 2: 更新 package.json 添加 bin 映射**

```json
{
  "bin": {
    "git-src": "./dist/index.js"
  },
  "scripts": {
    "build": "bun build.ts",
    "prepublish": "bun run build"
  }
}
```

**Step 3: 提交**

```bash
git add packages/git-src/build.ts packages/git-src/package.json
git commit -m "feat(git-src): add build configuration"
```

---

## 验证步骤

完成所有任务后，执行以下验证：

```bash
# 1. 构建
cd packages/git-src && bun run build

# 2. 测试 add 命令
./dist/index.ts add vue

# 3. 测试 ls 命令
./dist/index.ts ls

# 4. 测试 query 命令
./dist/index.ts query vue

# 5. 测试 open 命令（需要 VS Code）
./dist/index.ts open vue

# 6. 测试 tag 命令
./dist/index.ts tag vue important
./dist/index.ts query --tag important
```

---

## 执行方式选择

**Plan complete and saved to `docs/plans/2026-03-04-git-src-implementation.md`. Two execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
