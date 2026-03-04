import chalk from "chalk";
import { Config } from "../lib/config";

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
    if (!repo.tags.includes(tag)) {
      console.log(chalk.yellow(`Tag "${tag}" not found for ${repo.fullName}`));
      return;
    }
    repo.tags = repo.tags.filter((t) => t !== tag);
    config.updateRepo(repo.fullName, { tags: repo.tags });
    console.log(chalk.green(`Removed tag "${tag}" from ${repo.fullName}`));
  } else {
    if (repo.tags.includes(tag)) {
      console.log(chalk.yellow(`Tag "${tag}" already exists for ${repo.fullName}`));
      return;
    }
    repo.tags.push(tag);
    config.updateRepo(repo.fullName, { tags: repo.tags });
    console.log(chalk.green(`Added tag "${tag}" to ${repo.fullName}`));
  }
}
