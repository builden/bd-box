import pc from "picocolors";
import Table from "cli-table3";
import { Repo } from "./config";
import { getRelativeTime, getRepoSize, getRepoVersion } from "./utils";

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
    console.log(pc.yellow("No repositories found."));
    return;
  }

  // Sort by owner then by repo name
  filtered.sort((a, b) => {
    if (a.owner !== b.owner) return a.owner.localeCompare(b.owner);
    return a.name.localeCompare(b.name);
  });

  // Create table with cli-table3
  const table = new Table({
    head: [pc.gray("#"), pc.gray("REPO"), pc.gray("SIZE"), pc.gray("VERSION"), pc.gray("UPDATED"), pc.gray("TAGS")],
    truncate: "",
  });

  for (let i = 0; i < filtered.length; i++) {
    const repo = filtered[i];
    const size = await getRepoSize(repo.path);
    const version = await getRepoVersion(repo.path);
    const updated = getRelativeTime(repo.updatedAt);
    const tags = repo.tags.join(", ") || "-";
    // Display repo: simple mode shows name, otherwise shows URL as blue link
    const repoDisplay = options.simple ? repo.fullName : pc.underline(pc.blue(repo.url));

    table.push([String(i + 1), repoDisplay, size, version, updated, tags]);
  }

  console.log(pc.gray(`Found ${filtered.length} repository(s):\n`));
  console.log(table.toString());
  console.log(pc.gray(`\n[${filtered.length} repos]`));
}
