import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import {
  sanitizeRepoUrl,
  ensureDir,
  readJsonConfig,
  writeJsonConfig,
  getGitRemoteUrl,
  removeDir,
  mkTempDir,
  parseYamlFrontmatter,
} from '../git';

const SKILLS_DIR = path.join(os.homedir(), '.claude', 'skills');
const SKILLS_CONFIG_PATH = path.join(os.homedir(), '.claude-code-ui', 'skills.json');

export interface SkillManifest {
  name: string;
  description?: string;
  allowedTools?: string;
}

export interface SkillInfo {
  name: string;
  displayName: string;
  description: string;
  allowedTools: string;
  enabled: boolean;
  dirName: string;
  repoUrl: string | null;
  isSymlink: boolean;
  sourcePath: string | null;
}

export function getSkillsDir(): string {
  ensureDir(SKILLS_DIR);
  return SKILLS_DIR;
}

export function getSkillsConfig(): Record<string, { enabled?: boolean }> {
  return readJsonConfig<Record<string, { enabled?: boolean }>>(SKILLS_CONFIG_PATH, {});
}

export function saveSkillsConfig(config: Record<string, { enabled?: boolean }>) {
  writeJsonConfig(SKILLS_CONFIG_PATH, config);
}

function parseSkillMarkdown(manifestPath: string): SkillManifest | null {
  try {
    const frontMatter = parseYamlFrontmatter(fs.readFileSync(manifestPath, 'utf-8'));
    if (!frontMatter || !frontMatter.name) return null;

    return {
      name: frontMatter.name,
      description: frontMatter.description || '',
      allowedTools: frontMatter.allowedTools || '',
    };
  } catch {
    return null;
  }
}

export function scanSkills(): SkillInfo[] {
  const skillsDir = getSkillsDir();
  const config = getSkillsConfig();
  const skills: SkillInfo[] = [];

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  } catch {
    return skills;
  }

  for (const entry of entries) {
    // Skip files and hidden directories
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
    if (entry.name.startsWith('.')) continue;

    const entryPath = path.join(skillsDir, entry.name);
    const manifestPath = path.join(entryPath, 'SKILL.md');

    if (!fs.existsSync(manifestPath)) continue;

    const manifest = parseSkillMarkdown(manifestPath);
    if (!manifest) continue;

    // Determine actual source path (follow symlinks)
    let sourcePath: string | null = null;
    let isSymlink = false;
    try {
      if (entry.isSymbolicLink()) {
        isSymlink = true;
        sourcePath = fs.realpathSync(entryPath);
      }
    } catch {
      /* ignore */
    }

    // Try to read git remote URL
    let repoUrl: string | null = null;
    const gitDir = entry.isSymbolicLink() && sourcePath ? path.join(sourcePath, '.git') : path.join(entryPath, '.git');

    try {
      if (fs.existsSync(gitDir)) {
        const gitConfigPath = path.join(gitDir, 'config');
        if (fs.existsSync(gitConfigPath)) {
          const gitConfig = fs.readFileSync(gitConfigPath, 'utf-8');
          const match = gitConfig.match(/url\s*=\s*(.+)/);
          if (match) {
            repoUrl = match[1].trim().replace(/\.git$/, '');
            if (repoUrl.startsWith('git@')) {
              repoUrl = repoUrl.replace(/^git@([^:]+):/, 'https://$1/');
            }
            repoUrl = sanitizeRepoUrl(repoUrl);
          }
        }
      }
    } catch {
      /* ignore */
    }

    skills.push({
      name: manifest.name,
      displayName: manifest.name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      description: manifest.description || '',
      allowedTools: manifest.allowedTools || '',
      enabled: config[manifest.name]?.enabled !== false,
      dirName: entry.name,
      repoUrl,
      isSymlink,
      sourcePath,
    });
  }

  return skills;
}

export function getSkillDir(name: string): string | null {
  const skills = scanSkills();
  const skill = skills.find((s) => s.name === name);
  if (!skill) return null;
  return path.join(getSkillsDir(), skill.dirName);
}

export async function installSkillFromGit(url: string): Promise<SkillInfo> {
  return new Promise((resolve, reject) => {
    if (typeof url !== 'string' || !url.trim()) {
      return reject(new Error('Invalid URL: must be a non-empty string'));
    }
    if (url.startsWith('-')) {
      return reject(new Error('Invalid URL: must not start with "-"'));
    }

    const urlClean = url.replace(/\.git$/, '').replace(/\/$/, '');
    const repoName = urlClean.split('/').pop();

    if (!repoName || !/^[a-zA-Z0-9_.-]+$/.test(repoName)) {
      return reject(new Error('Could not determine a valid directory name from the URL'));
    }

    const skillsDir = getSkillsDir();
    const targetDir = path.resolve(skillsDir, repoName);

    if (!targetDir.startsWith(skillsDir + path.sep)) {
      return reject(new Error('Invalid skill directory path'));
    }

    if (fs.existsSync(targetDir)) {
      return reject(new Error(`Skill directory "${repoName}" already exists`));
    }

    const tempDir = fs.mkdtempSync(path.join(skillsDir, `.tmp-${repoName}-`));

    const cleanupTemp = () => {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {}
    };

    const finalize = () => {
      try {
        fs.renameSync(tempDir, targetDir);
      } catch (err) {
        cleanupTemp();
        return reject(new Error(`Failed to move skill into place: ${(err as Error).message}`));
      }

      const manifestPath = path.join(targetDir, 'SKILL.md');
      const manifest = parseSkillMarkdown(manifestPath);
      if (!manifest) {
        return reject(new Error('Cloned repository does not contain a valid SKILL.md'));
      }

      const skill: SkillInfo = {
        name: manifest.name,
        displayName: manifest.name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        description: manifest.description || '',
        allowedTools: manifest.allowedTools || '',
        enabled: true,
        dirName: repoName,
        repoUrl: url.replace(/\.git$/, '').replace(/\/$/, ''),
        isSymlink: false,
        sourcePath: null,
      };

      resolve(skill);
    };

    const gitProcess = spawn('git', ['clone', '--depth', '1', '--', url, tempDir], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    gitProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    gitProcess.on('close', (code) => {
      if (code !== 0) {
        cleanupTemp();
        return reject(new Error(`git clone failed (exit code ${code}): ${stderr.trim()}`));
      }

      const manifestPath = path.join(tempDir, 'SKILL.md');
      if (!fs.existsSync(manifestPath)) {
        cleanupTemp();
        return reject(new Error('Cloned repository does not contain a SKILL.md'));
      }

      const manifest = parseSkillMarkdown(manifestPath);
      if (!manifest) {
        cleanupTemp();
        return reject(new Error('SKILL.md is invalid or missing required fields'));
      }

      const existing = scanSkills().find((s) => s.name === manifest.name);
      if (existing) {
        cleanupTemp();
        return reject(new Error(`A skill named "${manifest.name}" is already installed`));
      }

      finalize();
    });

    gitProcess.on('error', (err) => {
      cleanupTemp();
      reject(new Error(`Failed to spawn git: ${err.message}`));
    });
  });
}

export async function updateSkillFromGit(name: string): Promise<SkillInfo> {
  return new Promise((resolve, reject) => {
    const skillDir = getSkillDir(name);
    if (!skillDir) {
      return reject(new Error(`Skill "${name}" not found`));
    }

    const gitProcess = spawn('git', ['pull', '--ff-only', '--'], {
      cwd: skillDir,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    gitProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    gitProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`git pull failed (exit code ${code}): ${stderr.trim()}`));
      }

      const manifestPath = path.join(skillDir, 'SKILL.md');
      const manifest = parseSkillMarkdown(manifestPath);
      if (!manifest) {
        return reject(new Error('SKILL.md is invalid after update'));
      }

      const skills = scanSkills();
      const skill = skills.find((s) => s.name === name);
      if (!skill) {
        return reject(new Error(`Skill "${name}" not found after update`));
      }

      resolve(skill);
    });

    gitProcess.on('error', (err) => {
      reject(new Error(`Failed to spawn git: ${err.message}`));
    });
  });
}

export async function uninstallSkill(name: string): Promise<void> {
  const skillDir = getSkillDir(name);
  if (!skillDir) {
    throw new Error(`Skill "${name}" not found`);
  }

  const MAX_RETRIES = 5;
  const RETRY_DELAY_MS = 500;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      fs.rmSync(skillDir, { recursive: true, force: true });
      break;
    } catch (err) {
      const error = err as { code?: string };
      if (error.code === 'EBUSY' && attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        throw err;
      }
    }
  }

  const config = getSkillsConfig();
  delete config[name];
  saveSkillsConfig(config);
}
