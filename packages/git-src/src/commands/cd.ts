import pc from 'picocolors';
import { homedir } from 'os';
import { Config, Repo } from '../lib/config';

function matchRepos(repos: Repo[], pattern: string): Repo[] {
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  const regex = new RegExp(regexPattern, 'i');
  return repos.filter((r) => regex.test(r.fullName));
}

function shortenPath(p: string): string {
  return p.replace(new RegExp('^' + homedir()), '~');
}

async function selectRepo(matches: Repo[]): Promise<Repo | null> {
  const readline = await import('readline');

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log(pc.gray('\nSelect a repository:'));
    matches.forEach((repo, index) => {
      console.log(pc.white(`[${index + 1}] ${repo.fullName}`));
    });
    console.log(pc.gray('[q] Quit\n'));

    rl.question(pc.cyan('Choice: '), (answer) => {
      rl.close();

      if (answer.toLowerCase() === 'q') {
        resolve(null);
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

export async function printCd(pattern?: string): Promise<void> {
  const config = new Config();

  // git-src cd without args → print config directory
  if (!pattern) {
    console.log(shortenPath(`${homedir()}/.git-src`));
    return;
  }

  const matches = matchRepos(config.getRepos(), pattern);

  if (matches.length === 0) {
    console.error(pc.red(`No repository matching "${pattern}" found`));
    process.exit(1);
  }

  if (matches.length === 1) {
    console.log(shortenPath(matches[0].path));
    return;
  }

  // Multiple matches - show selection
  const selected = await selectRepo(matches);

  if (!selected) {
    console.log(pc.yellow('Cancelled'));
    return;
  }

  console.log(shortenPath(selected.path));
}
