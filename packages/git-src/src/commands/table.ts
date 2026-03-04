import chalk from "chalk";
import Table from "cli-table3";
import { execa } from "execa";
import { Repo } from "../config";

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

async function getRepoSize(path: string): Promise<string> {
  try {
    const { stdout } = await execa("du", ["-sh", path]);
    return stdout.split("\t")[0];
  } catch {
    return "N/A";
  }
}

async function getRepoVersion(path: string): Promise<string> {
  try {
    const { stdout } = await execa("git", ["describe", "--tags", "--always"], { cwd: path });
    return stdout.trim() || "N/A";
  } catch {
    return "N/A";
  }
}

export interface RenderTableOptions {
  tag?: string;
  simple?: boolean;
}

export async function renderTable(repos: Repo[], options: RenderTableOptions = {}): Promise<void> {
  // Filter by tag if specified
  let filtered = repos;
  if (options.tag) {
    filtered = repos.filter((r) => r.tags.includes(options.tag!));
  }

  if (filtered.length === 0) {
    console.log(chalk.yellow("No repositories found."));
    return;
  }

  // Sort by owner then by repo name
  filtered.sort((a, b) => {
    if (a.owner !== b.owner) return a.owner.localeCompare(b.owner);
    return a.name.localeCompare(b.name);
  });

  // Create table with cli-table3
  const table = new Table({
    head: [
      chalk.gray("#"),
      chalk.gray("REPO"),
      chalk.gray("SIZE"),
      chalk.gray("VERSION"),
      chalk.gray("UPDATED"),
      chalk.gray("TAGS"),
    ],
    truncate: "",
  });

  for (let i = 0; i < filtered.length; i++) {
    const repo = filtered[i];
    const size = await getRepoSize(repo.path);
    const version = await getRepoVersion(repo.path);
    const updated = getRelativeTime(repo.updatedAt);
    const tags = repo.tags.join(", ") || "-";
    // Display repo: simple mode shows name, otherwise shows URL as blue link
    const repoDisplay = options.simple ? repo.fullName : chalk.blue.underline(repo.url);

    table.push([String(i + 1), repoDisplay, size, version, updated, tags]);
  }

  console.log(chalk.gray(`Found ${filtered.length} repository(s):\n`));
  console.log(table.toString());
  console.log(chalk.gray(`\n[${filtered.length} repos]`));
}
