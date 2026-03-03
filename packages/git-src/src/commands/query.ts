import chalk from "chalk";
import { Config } from "../config";

export async function searchRepos(pattern: string, options: { tag?: string } = {}): Promise<void> {
  const config = new Config();
  let repos = config.getRepos();

  // Filter by tag if specified
  if (options.tag) {
    repos = repos.filter((r) => r.tags.includes(options.tag!));
  }

  // Filter by pattern (supports wildcards)
  if (pattern) {
    // Convert glob pattern to regex: * -> .*, ? -> ., others escaped
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&") // Escape special regex chars except * and ?
      .replace(/\*/g, ".*") // * -> .*
      .replace(/\?/g, "."); // ? -> .
    const regex = new RegExp(regexPattern, "i");
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
