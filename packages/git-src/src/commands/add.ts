import { execa } from "execa";
import ora from "ora";
import { Config, Repo } from "../lib/config";
import { existsSync, mkdirSync } from "fs";
import { homedir } from "os";

export interface ParseResult {
  owner: string;
  name: string;
  fullName: string;
  url: string;
}

export function parseRepoInput(input: string): ParseResult {
  // Handle git@ protocol: git@github.com:owner/repo.git
  const gitMatch = input.match(/git@github\.com:([^/]+)\/([^/.]+)/);
  if (gitMatch) {
    return {
      owner: gitMatch[1],
      name: gitMatch[2].replace(/\.git$/, ""),
      fullName: `${gitMatch[1]}/${gitMatch[2].replace(/\.git$/, "")}`,
      url: `https://github.com/${gitMatch[1]}/${gitMatch[2].replace(/\.git$/, "")}`,
    };
  }

  // Handle full URL: https://github.com/owner/repo
  const urlMatch = input.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
  if (urlMatch) {
    return {
      owner: urlMatch[1],
      name: urlMatch[2].replace(/\.git$/, ""),
      fullName: `${urlMatch[1]}/${urlMatch[2].replace(/\.git$/, "")}`,
      url: `https://github.com/${urlMatch[1]}/${urlMatch[2].replace(/\.git$/, "")}`,
    };
  }

  // Handle owner/repo format
  if (input.includes("/")) {
    const [owner, name] = input.split("/");
    return { owner, name, fullName: `${owner}/${name}`, url: `https://github.com/${owner}/${name}` };
  }

  // Simple repo name - assume facebook as default
  return {
    owner: "facebook",
    name: input,
    fullName: `facebook/${input}`,
    url: `https://github.com/facebook/${input}`,
  };
}

export async function addRepo(input: string, options: { tag?: string } = {}): Promise<void> {
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
    await execa("git", ["clone", "--depth", "1", parsed.url, repoPath], {
      cwd: basePath,
    });

    const repos = config.getRepos();
    const newId = String(repos.length + 1).padStart(3, "0");

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
    };

    config.addRepo(newRepo);

    spinner.succeed(`Cloned ${parsed.fullName}`);
  } catch (error) {
    spinner.fail(`Failed to clone ${parsed.fullName}`);
    throw error;
  }
}
