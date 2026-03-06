import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { AGENTS_DIR, LOCK_FILE } from "./constants";

const LOCK_PATH = `${homedir()}/${AGENTS_DIR}/${LOCK_FILE}`;

// Module-level cache for lock file
let lockCache: Record<string, SkillLock> | null = null;

export interface SkillLock {
  name: string;
  source: string;
  sourceType: string;
  sourceUrl: string;
  skillPath?: string;
  skillFolderHash?: string;
  pluginName?: string;
  installedAt: string;
  updatedAt: string;
}

/**
 * Load skills from a lock file path
 */
export function loadSkillsLockFromPath(lockPath: string): Record<string, SkillLock> {
  try {
    if (existsSync(lockPath)) {
      const content = readFileSync(lockPath, "utf-8");
      const data = JSON.parse(content);
      return data.skills || {};
    }
  } catch {
    // ignore
  }
  return {};
}

/**
 * Load skills from skills CLI's lock file (with caching)
 */
export function loadSkillsLock(): Record<string, SkillLock> {
  if (lockCache !== null) {
    return lockCache;
  }

  lockCache = loadSkillsLockFromPath(LOCK_PATH);
  return lockCache;
}

/**
 * Clear the lock cache (useful for testing)
 */
export function clearLockCache(): void {
  lockCache = null;
}

/**
 * Find a skill in lock file by name or source
 */
export async function findSkillInLock(query: string): Promise<SkillLock | undefined> {
  const skills = loadSkillsLock();

  // Exact match - O(1)
  if (skills[query]) {
    return skills[query];
  }

  // Fuzzy match - O(n)
  const lowerQuery = query.toLowerCase();
  for (const [name, skill] of Object.entries(skills)) {
    if (name.toLowerCase().includes(lowerQuery) || skill.source.toLowerCase().includes(lowerQuery)) {
      return skill;
    }
  }
  return undefined;
}
