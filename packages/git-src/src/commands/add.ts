import { execa } from 'execa';
import ora from 'ora';
import pc from 'picocolors';
import { Config, Repo } from '../lib/config';
import { parseRepoInput } from '../lib/utils';
import { existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { linkRepo } from './link';

export async function addRepo(input: string, options: { tag?: string; link?: boolean } = {}): Promise<void> {
  const parsed = parseRepoInput(input);
  const config = new Config();

  // Check if already exists
  const existing = config.findRepo(parsed.fullName);
  if (existing) {
    console.log(`Repository ${parsed.fullName} already exists at ${existing.path}`);
    return;
  }

  const basePath = `${homedir()}/.git-src`;
  const ownerPath = `${basePath}/${parsed.owner}`;
  const repoPath = `${ownerPath}/${parsed.name}`;

  // Create owner directory if not exists
  if (!existsSync(ownerPath)) {
    mkdirSync(ownerPath, { recursive: true });
  }

  const spinner = ora(`Cloning ${parsed.fullName}...`).start();

  try {
    await execa('git', ['clone', '--depth', '1', parsed.url, repoPath], {
      cwd: basePath,
    });

    const repos = config.getRepos();
    const newId = String(repos.length + 1).padStart(3, '0');

    const tags = options.tag ? [options.tag] : [];
    const newRepo: Repo = {
      id: newId,
      name: parsed.name,
      owner: parsed.owner,
      fullName: parsed.fullName,
      path: repoPath,
      url: parsed.url,
      tags,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      linkedPaths: [],
    };

    config.addRepo(newRepo);

    spinner.succeed(`Cloned ${parsed.fullName}`);

    // link option
    if (options.link) {
      try {
        await linkRepo(parsed.fullName, config);
      } catch {
        console.log(pc.yellow(`Warning: link failed, repository added but not linked`));
      }
    }
  } catch (error) {
    spinner.fail(`Failed to clone ${parsed.fullName}`);
    throw error;
  }
}
