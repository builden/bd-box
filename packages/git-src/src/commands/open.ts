import chalk from "chalk";
import { Config, Repo } from "../config";
import { execFile } from "child_process";
import { promisify } from "util";
import { dirname } from "path";

const execFileAsync = promisify(execFile);

function matchRepos(repos: Repo[], pattern: string): Repo[] {
  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  const regex = new RegExp(regexPattern, "i");
  return repos.filter((r) => regex.test(r.fullName));
}

async function openPath(path: string, openDir: boolean = false): Promise<void> {
  if (openDir) {
    // Open directory in Finder/File Explorer
    try {
      await execFileAsync("open", [path]);
    } catch {
      console.log(chalk.yellow(`Please open: ${path}`));
    }
  } else {
    // Try to open in VS Code, otherwise use system default
    try {
      await execFileAsync("code", [path]);
    } catch {
      // Fallback to open command on macOS
      try {
        await execFileAsync("open", [path]);
      } catch {
        console.log(chalk.yellow(`Please open: ${path}`));
      }
    }
  }
}

async function selectRepo(matches: Repo[]): Promise<Repo | Repo[] | null> {
  const readline = await import("readline");

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log(chalk.gray("\nSelect a repository:"));
    matches.forEach((repo, index) => {
      console.log(chalk.white(`[${index + 1}] ${repo.fullName}`));
    });
    console.log(chalk.gray("[a] Open all"));
    console.log(chalk.gray("[q] Quit\n"));

    rl.question(chalk.cyan("Choice: "), (answer) => {
      rl.close();

      if (answer.toLowerCase() === "q") {
        resolve(null);
      } else if (answer.toLowerCase() === "a") {
        resolve(matches);
      } else {
        const index = parseInt(answer, 10) - 1;
        if (index >= 0 && index < matches.length) {
          resolve(matches[index]);
        } else {
          resolve(null);
        }
      }
    });
  });
}

export async function openRepo(
  pattern?: string,
  options: { all: boolean; dir: boolean } = { all: false, dir: false },
): Promise<void> {
  const config = new Config();

  // If no pattern, open config directory
  if (!pattern) {
    const configPath = config.getConfigPath();
    const configDir = dirname(configPath);
    console.log(chalk.green(`Opening config directory...`));
    await openPath(configDir, true);
    return;
  }

  const matches = matchRepos(config.getRepos(), pattern);

  if (matches.length === 0) {
    console.error(chalk.red(`No repository matching "${pattern}" found`));
    process.exit(1);
  }

  if (matches.length === 1) {
    const repo = matches[0];
    console.log(chalk.green(`Opening ${repo.fullName}...`));
    await openPath(repo.path, options.dir);
    return;
  }

  // Multiple matches - show selection
  if (!options.all) {
    const selected = await selectRepo(matches);

    if (!selected) {
      console.log(chalk.yellow("Cancelled"));
      return;
    }

    // Check if user selected "open all"
    if (Array.isArray(selected)) {
      for (const repo of matches) {
        console.log(chalk.green(`Opening ${repo.fullName}...`));
        await openPath(repo.path, options.dir);
      }
    } else {
      console.log(chalk.green(`Opening ${selected.fullName}...`));
      await openPath(selected.path, options.dir);
    }
  } else {
    // Open all matches
    for (const repo of matches) {
      console.log(chalk.green(`Opening ${repo.fullName}...`));
      await openPath(repo.path, options.dir);
    }
  }
}
