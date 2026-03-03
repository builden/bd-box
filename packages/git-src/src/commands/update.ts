import chalk from "chalk";
import { execa } from "execa";
import { Config, Repo } from "../config";

export async function updateRepo(
  repoName: string | null,
  options: { force: boolean } = { force: false },
): Promise<void> {
  const config = new Config();
  const repos = repoName ? ([config.findRepo(repoName!)].filter(Boolean) as Repo[]) : config.getRepos();

  if (repos.length === 0 && repoName) {
    console.error(chalk.red(`Repository "${repoName}" not found`));
    process.exit(1);
  }

  if (repos.length === 0) {
    console.log(chalk.yellow("No repositories to update."));
    return;
  }

  for (const repo of repos) {
    console.log(`Updating ${repo.fullName}...`);

    try {
      if (options.force) {
        // Force clone - remove and re-clone
        console.log(`Force updating ${repo.fullName}...`);
        await execa("rm", ["-rf", repo.path]);
        await execa("git", ["clone", "--depth", "1", repo.url, repo.path]);
      } else {
        // Git pull
        await execa("git", ["pull"], { cwd: repo.path });
      }

      config.updateRepo(repo.fullName, {});

      console.log(`Updated ${repo.fullName}`);
    } catch {
      console.error(`Failed to update ${repo.fullName}`);
    }
  }
}
