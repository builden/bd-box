#!/usr/bin/env bun

import { Command } from "commander";
import { addRepo } from "./commands/add";
import { listRepos } from "./commands/ls";
import { removeRepo } from "./commands/rm";
import { searchRepos } from "./commands/query";
import { openRepo } from "./commands/open";
import { updateRepo } from "./commands/update";
import { checkOutdated } from "./commands/outdated";
import { manageTags } from "./commands/tag";
import { upgradeSelf } from "./commands/upgrade";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";

// Find package.json by traversing up from the entry file
function findPackageJson(): string {
  let dir = dirname(process.argv[1]);
  // Limit traversal depth to avoid infinite loop
  for (let i = 0; i < 10; i++) {
    const pkgPath = join(dir, "package.json");
    if (existsSync(pkgPath)) {
      return pkgPath;
    }
    // Go up one level
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("package.json not found");
}

const packageJson = JSON.parse(readFileSync(findPackageJson(), "utf-8"));

const program = new Command();

program.name("git-src").description("Git source code manager for AI Agents").version(packageJson.version);

program
  .command("add <repo>")
  .description("Add a repository (supports: react, owner/repo, https://github.com/owner/repo)")
  .option("-t, --tag <tag>", "Add tag to repository")
  .action(async (repo: string, options: { tag?: string }) => {
    try {
      await addRepo(repo, options);
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });

program
  .command("ls")
  .description("List all repositories")
  .option("-t, --tag <tag>", "Filter by tag")
  .option("-s, --simple", "Show simple repo name instead of URL")
  .action(async (options: { tag?: string; simple?: boolean }) => {
    try {
      await listRepos(options);
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });

program
  .command("rm <repo>")
  .description("Remove a repository")
  .action(async (repo: string) => {
    try {
      await removeRepo(repo);
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });

program
  .command("query [pattern]")
  .description("Search repositories (supports wildcards: *, ?)")
  .option("-t, --tag <tag>", "Filter by tag")
  .option("-s, --simple", "Show simple repo name instead of URL")
  .action(async (pattern: string, options: { tag?: string; simple?: boolean }) => {
    try {
      await searchRepos(pattern || "", options);
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });

program
  .command("open [repo]")
  .description("Open repository in editor (supports wildcards: *, ?). Without repo, opens config directory")
  .option("-a, --all", "Open all matching repositories")
  .option("-d, --dir", "Open directory instead of in editor")
  .action(async (repo: string | undefined, options: { all?: boolean; dir?: boolean }) => {
    try {
      await openRepo(repo, { all: !!options.all, dir: !!options.dir });
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });

program
  .command("update [repo]")
  .description("Update repositories (git pull), or re-clone with -f")
  .option("-f, --force", "Force re-clone (delete and re-download)")
  .action(async (repo: string | undefined, options: { force?: boolean }) => {
    try {
      await updateRepo(repo || null, { force: !!options.force });
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });

program
  .command("outdated [repo]")
  .description("Check if repositories have updates")
  .option("-t, --tag <tag>", "Filter by tag")
  .action(async (repo: string | undefined, options: { tag?: string }) => {
    try {
      await checkOutdated(repo || null, options);
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });

program
  .command("tag <repo> [tag]")
  .description("Manage tags for a repository (add, list, or delete)")
  .option("-d, --delete", "Delete the tag")
  .action(async (repo: string, tag: string | undefined, options: { delete?: boolean }) => {
    try {
      await manageTags(repo, tag, { delete: !!options.delete });
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });

program
  .command("upgrade")
  .description("Upgrade git-src to the latest version")
  .action(async () => {
    try {
      await upgradeSelf();
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });

program.parse();
