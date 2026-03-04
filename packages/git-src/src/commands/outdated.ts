import chalk from "chalk";
import { execa } from "execa";
import { Config, Repo } from "../lib/config";

export async function checkOutdated(repoName: string | null, options: { tag?: string } = {}): Promise<void> {
  const config = new Config();
  let repos = repoName ? ([config.findRepo(repoName!)].filter(Boolean) as Repo[]) : config.getRepos();

  // Filter by tag if specified
  if (options.tag) {
    repos = repos.filter((r) => r.tags.includes(options.tag!));
  }

  if (repos.length === 0 && repoName) {
    console.error(chalk.red(`Repository "${repoName}" not found`));
    process.exit(1);
  }

  if (repos.length === 0) {
    console.log(chalk.yellow("No repositories to check."));
    return;
  }

  const results: { repo: Repo; hasUpdates: boolean }[] = [];

  for (const repo of repos) {
    try {
      // Try to fetch and see if there are changes
      await execa("git", ["fetch", "--dry-run"], { cwd: repo.path });
      // If no error, there might be updates (can't reliably detect with --dry-run)
      results.push({ repo, hasUpdates: false }); // Default to no updates
    } catch {
      // If there's an error, assume there are updates
      results.push({ repo, hasUpdates: true });
    }
  }

  // Also check for actual new commits
  for (const result of results) {
    try {
      const { stdout } = await execa("git", ["rev-list", "--count", "@{u}..HEAD"], {
        cwd: result.repo.path,
      });
      const localCommits = parseInt(stdout, 10);
      if (localCommits > 0) {
        result.hasUpdates = false; // We have more commits than remote
      }
    } catch {
      // No upstream configured or other error
    }
  }

  // Check if behind remote
  for (const result of results) {
    try {
      const { stdout } = await execa("git", ["rev-list", "--count", "HEAD..@{u}"], {
        cwd: result.repo.path,
      });
      const remoteCommits = parseInt(stdout, 10);
      result.hasUpdates = remoteCommits > 0;
    } catch {
      // No upstream configured
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
