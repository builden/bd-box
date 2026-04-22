import pc from 'picocolors';
import { execa } from 'execa';
import { Config } from '../lib/config';
import { existsSync, rmSync } from 'fs';
import { dirname } from 'path';
import { parseRepoInput } from '../lib/utils';

export async function removeRepo(repoInput: string): Promise<void> {
  const config = new Config();

  // 1. 先尝试直接查找
  let repo = config.findRepo(repoInput);

  // 2. 如果找不到，尝试解析 URL 后再查找
  if (!repo) {
    const parsed = parseRepoInput(repoInput);
    repo = config.findRepo(parsed.fullName);
  }

  if (!repo) {
    console.error(pc.red(`Repository "${repoInput}" not found`));
    process.exit(1);
  }

  console.log(`Removing ${repo.fullName}...`);

  try {
    // 1. 删除所有 linkedPaths 中的 symlink
    for (const linkPath of repo.linkedPaths) {
      if (existsSync(linkPath)) {
        rmSync(linkPath);
        console.log(`Removed symlink: ${linkPath}`);

        // 尝试删除父目录（如为空）
        const parentDir = dirname(linkPath);
        try {
          const dirContents = (await import('fs')).readdirSync(parentDir);
          if (dirContents.length === 0) {
            rmSync(parentDir);
            console.log(`Removed empty directory: ${parentDir}`);
          }
        } catch {
          // ignore - directory not empty or other error
        }
      }
    }

    // 2. 删除仓库本身
    await execa('rm', ['-rf', repo.path]);

    // 3. 从配置移除
    config.removeRepo(repo.fullName);

    console.log(pc.green(`Removed ${repo.fullName}`));
  } catch (error) {
    console.error(`Failed to remove ${repo.fullName}`);
    throw error;
  }
}
