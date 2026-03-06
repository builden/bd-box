import pc from "picocolors";
import { homedir } from "os";
import { execa } from "execa";
import Table from "cli-table3";
import { SkillLock, loadSkillsLock, loadSkillsLockFromPath } from "../lib/lock";

/**
 * Parse skill path to extract target path
 */
function parseSkillPath(skillPath: string): string {
  const folder = skillPath.split("/")[0];
  return `${folder}/${skillPath
    .split("/")
    .slice(1)
    .join("/")
    .replace(/\/SKILL\.md$/, "")}`;
}

/**
 * Get latest folder hash from GitHub (with caching)
 */
const hashCache = new Map<string, { tree: unknown[] } | null>();

async function getLatestFolderHash(sourceUrl: string, skillPath: string): Promise<string | null> {
  const target = parseSkillPath(skillPath);

  // Check cache first
  if (hashCache.has(sourceUrl)) {
    const cached = hashCache.get(sourceUrl);
    if (!cached) return null;

    for (const item of cached.tree) {
      const itemPath = (item as { path: string }).path;
      if (itemPath === target || itemPath.startsWith(target + "/")) {
        return (item as { sha: string }).sha;
      }
    }
    return null;
  }

  try {
    const match = sourceUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
    if (!match) {
      hashCache.set(sourceUrl, null);
      return null;
    }

    const [, owner, repo] = match;
    const ref = "main";

    const { stdout } = await execa("curl", [
      "--noproxy",
      "*",
      "-s",
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`,
    ]);

    const data = JSON.parse(stdout);
    if (!data.tree) {
      hashCache.set(sourceUrl, null);
      return null;
    }

    // Cache parsed tree object directly
    hashCache.set(sourceUrl, { tree: data.tree });

    for (const item of data.tree) {
      const itemPath = (item as { path: string }).path;
      if (itemPath === target || itemPath.startsWith(target + "/")) {
        return (item as { sha: string }).sha;
      }
    }

    return null;
  } catch {
    hashCache.set(sourceUrl, null);
    return null;
  }
}

/**
 * Format date to relative time
 */
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

/**
 * Display skills in table format
 */
function displayTable(
  skills: Array<{ name: string; current: string; latest: string | null; installed: string }>,
): void {
  const table = new Table({
    head: [pc.cyan("Skill"), pc.cyan("Status"), pc.cyan("Last Updated")],
    colWidths: [30, 15, 20],
  });

  for (const skill of skills) {
    const status =
      skill.latest === null
        ? pc.yellow("unknown")
        : skill.current === skill.latest
          ? pc.green("up-to-date")
          : pc.red("outdated");

    table.push([skill.name, status, skill.installed]);
  }

  console.log(table.toString());
}

/**
 * Check for outdated skills - custom implementation with table output
 */
export async function checkOutdated(global: boolean = false): Promise<void> {
  console.log(pc.cyan("Checking for skill updates...\n"));

  let skills: Record<string, SkillLock>;
  let skillsPath: string;

  if (global) {
    // Check global ~/.agents directory
    skills = loadSkillsLock();
    skillsPath = `${homedir()}/.agents`;
  } else {
    // Check current project
    const cwd = process.cwd();
    const projectSkillsDir = `${cwd}/skills`;
    skills = loadSkillsLockFromPath(`${cwd}/.skill-lock.json`);
    skillsPath = projectSkillsDir;

    if (Object.keys(skills).length === 0) {
      console.log(pc.yellow("No skills found in current project."));
      console.log(pc.gray("Use 'bd-skills outdated -g' to check global ~/.agents directory."));
      return;
    }
  }

  if (Object.keys(skills).length === 0) {
    console.log(pc.yellow("No skills found."));
    console.log(pc.gray("Use 'bd-skills add <source>' to add skills."));
    return;
  }

  const results: Array<{
    name: string;
    current: string;
    latest: string | null;
    installed: string;
  }> = [];

  console.log(pc.gray(`Checking ${Object.keys(skills).length} skill(s) in ${skillsPath}...\n`));

  // Parallel fetch for all skills with hash
  const skillsWithHash = Object.entries(skills).filter(([, skill]) => skill.skillFolderHash);
  const skillsWithoutHash = Object.entries(skills).filter(([, skill]) => !skill.skillFolderHash);

  // Process skills without hash first
  for (const [name, skill] of skillsWithoutHash) {
    results.push({
      name,
      current: "N/A",
      latest: null,
      installed: formatRelativeTime(skill.installedAt),
    });
  }

  // Parallel fetch for skills with hash
  const hashResults = await Promise.all(
    skillsWithHash.map(async ([name, skill]) => {
      const latestHash = await getLatestFolderHash(skill.sourceUrl, skill.skillPath || "");
      const currentHash = skill.skillFolderHash ?? "";
      return {
        name,
        current: currentHash.slice(0, 7),
        latest: latestHash?.slice(0, 7) || null,
        installed: formatRelativeTime(skill.installedAt),
      };
    }),
  );

  results.push(...hashResults);

  displayTable(results);

  const outdated = results.filter((r) => r.latest !== null && r.current !== r.latest).length;
  const unknown = results.filter((r) => r.latest === null).length;

  if (outdated > 0) {
    console.log(pc.yellow(`${outdated} skill(s) have updates available.`));
    console.log(pc.gray("Run 'bd-skills add <skill> -g' to update."));
  } else if (unknown > 0) {
    console.log(pc.yellow(`${unknown} skill(s) cannot be checked automatically.`));
  } else {
    console.log(pc.green("All skills are up to date."));
  }
}
