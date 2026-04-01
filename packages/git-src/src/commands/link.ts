import pc from 'picocolors';
import { Config } from '../lib/config';
import { existsSync, mkdirSync, symlinkSync } from 'fs';
import { join } from 'path';

export async function linkRepo(repoName: string, config?: Config): Promise<void> {
  const configInstance = config || new Config();
  const repo = configInstance.findRepo(repoName);

  if (!repo) {
    throw new Error(`Repository "${repoName}" not found`);
  }

  const cwd = process.cwd();
  const linkDir = join(cwd, '.git-src', repo.owner);
  const linkPath = join(linkDir, repo.name);

  // Check if already linked in config
  if (repo.linkedPaths.includes(linkPath)) {
    throw new Error(`Already linked at ${linkPath}`);
  }

  // Create directory
  if (!existsSync(linkDir)) {
    mkdirSync(linkDir, { recursive: true });
  }

  // Create symlink
  symlinkSync(repo.path, linkPath);
  configInstance.addLinkedPath(repo.fullName, linkPath);
  console.log(pc.green(`Linked ${repo.fullName} → ${linkPath}`));
}
