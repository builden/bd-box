import pc from "picocolors";
import { execa } from "execa";
import { Config } from "../lib/config";

export async function removeRepo(repoName: string): Promise<void> {
  const config = new Config();
  const repo = config.findRepo(repoName);

  if (!repo) {
    console.error(pc.red(`Repository "${repoName}" not found`));
    process.exit(1);
  }

  console.log(`Removing ${repo.fullName}...`);

  try {
    // Remove from filesystem
    await execa("rm", ["-rf", repo.path]);

    // Remove from config
    config.removeRepo(repo.fullName);

    console.log(`Removed ${repo.fullName}`);
  } catch (error) {
    console.error(`Failed to remove ${repo.fullName}`);
    throw error;
  }
}
