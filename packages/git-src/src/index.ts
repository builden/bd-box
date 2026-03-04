#!/usr/bin/env bun

import { Command } from "commander";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { addRepo } from "./commands/add";
import { listRepos } from "./commands/ls";
import { removeRepo } from "./commands/rm";
import { searchRepos } from "./commands/query";
import { openRepo } from "./commands/open";
import { updateRepo } from "./commands/update";
import { checkOutdated } from "./commands/outdated";
import { manageTags } from "./commands/tag";
import { upgradeSelf } from "./commands/upgrade";
import { withErrorHandling, withErrorHandling1, withErrorHandling2, withErrorHandling3 } from "./lib/error";

// Find package.json by traversing up from the entry file
function findPackageJson(): string {
  let dir = dirname(process.argv[1] || __filename);
  for (let i = 0; i < 10; i++) {
    const pkgPath = join(dir, "package.json");
    if (existsSync(pkgPath)) {
      return pkgPath;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("package.json not found");
}

const packageJson = JSON.parse(readFileSync(findPackageJson(), "utf-8"));

// Create program
const program = new Command();

program.name("git-src").description("Git source code manager for AI Agents").version(packageJson.version);

// Register commands
program
  .command("add <repo>")
  .description("Add a repository (supports: react, owner/repo, https://github.com/owner/repo)")
  .option("-t, --tag <tag>", "Add tag to repository")
  .action(withErrorHandling2(async (repo: string, options: { tag?: string }) => {
    await addRepo(repo, options);
  }));

program
  .command("ls")
  .description("List all repositories")
  .option("-t, --tag <tag>", "Filter by tag")
  .option("-s, --simple", "Show simple repo name instead of URL")
  .action(withErrorHandling1(async (options: { tag?: string; simple?: boolean }) => {
    await listRepos(options);
  }));

program
  .command("rm <repo>")
  .description("Remove a repository")
  .action(withErrorHandling1(async (repo: string) => {
    await removeRepo(repo);
  }));

program
  .command("query [pattern]")
  .description("Search repositories (supports wildcards: *, ?)")
  .option("-t, --tag <tag>", "Filter by tag")
  .option("-s, --simple", "Show simple repo name instead of URL")
  .action(withErrorHandling2(async (pattern: string, options: { tag?: string; simple?: boolean }) => {
    await searchRepos(pattern || "", options);
  }));

program
  .command("open [repo]")
  .description("Open repository in editor (supports wildcards: *, ?). Without repo, opens config directory")
  .option("-a, --all", "Open all matching repositories")
  .option("-d, --dir", "Open directory instead of in editor")
  .action(withErrorHandling2(async (repo: string | undefined, options: { all?: boolean; dir?: boolean }) => {
    await openRepo(repo, { all: !!options.all, dir: !!options.dir });
  }));

program
  .command("update [repo]")
  .description("Update repositories (git pull), or re-clone with -f")
  .option("-f, --force", "Force re-clone (delete and re-download)")
  .action(withErrorHandling2(async (repo: string | undefined, options: { force?: boolean }) => {
    await updateRepo(repo || null, { force: !!options.force });
  }));

program
  .command("outdated [repo]")
  .description("Check if repositories have updates")
  .option("-t, --tag <tag>", "Filter by tag")
  .action(withErrorHandling2(async (repo: string | undefined, options: { tag?: string }) => {
    await checkOutdated(repo || null, options);
  }));

program
  .command("tag <repo> [tag]")
  .description("Manage tags for a repository (add, list, or delete)")
  .option("-d, --delete", "Delete the tag")
  .action(withErrorHandling3(async (repo: string, tag: string | undefined, options: { delete?: boolean }) => {
    await manageTags(repo, tag, { delete: !!options.delete });
  }));

program
  .command("upgrade")
  .description("Upgrade git-src to the latest version")
  .action(withErrorHandling(async () => {
    await upgradeSelf();
  }));

program.parse();
