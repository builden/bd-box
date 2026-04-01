import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { homedir } from 'os';

export interface Repo {
  id: string;
  name: string;
  owner: string;
  fullName: string;
  path: string;
  url: string;
  tags: string[];
  addedAt: string;
  updatedAt: string;
  linkedPaths: string[];
}

export interface GitSrcConfig {
  version: string;
  repos: Repo[];
}

export interface UpdateRepoOptions {
  tags?: string[];
}

const DEFAULT_CONFIG: GitSrcConfig = {
  version: '1.0.0',
  repos: [],
};

export class Config {
  private configPath: string;
  private config: GitSrcConfig;

  constructor(configPath: string = `${homedir()}/.git-src/config.json`) {
    this.configPath = configPath;
    this.config = this.load();
  }

  private load(): GitSrcConfig {
    try {
      if (existsSync(this.configPath)) {
        const content = readFileSync(this.configPath, 'utf-8');
        const config = JSON.parse(content);
        // Ensure old data has linkedPaths field
        config.repos = config.repos.map((r: Repo) => ({
          ...r,
          linkedPaths: r.linkedPaths || [],
        }));
        return config;
      }
    } catch {
      // ignore error, return default
    }
    // Create a deep copy to avoid sharing the repos array with DEFAULT_CONFIG
    return {
      ...DEFAULT_CONFIG,
      repos: [...DEFAULT_CONFIG.repos],
    };
  }

  private save(): void {
    const dir = dirname(this.configPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
  }

  getRepos(): Repo[] {
    return this.config.repos;
  }

  addRepo(repo: Repo): void {
    // Ensure repo has linkedPaths field with default empty array
    const repoWithLinkedPaths = {
      ...repo,
      linkedPaths: repo.linkedPaths || [],
    };
    this.config.repos.push(repoWithLinkedPaths);
    this.save();
  }

  removeRepo(fullName: string): void {
    this.config.repos = this.config.repos.filter((r) => r.fullName !== fullName);
    this.save();
  }

  findRepo(query: string): Repo | undefined {
    return this.config.repos.find((r) => r.fullName === query || r.name === query || r.fullName.includes(query));
  }

  updateRepo(fullName: string, options: UpdateRepoOptions): void {
    const repo = this.config.repos.find((r) => r.fullName === fullName);
    if (repo) {
      if (options.tags !== undefined) {
        repo.tags = options.tags;
      }
      repo.updatedAt = new Date().toISOString();
      this.save();
    }
  }

  addLinkedPath(fullName: string, linkPath: string): void {
    const repo = this.config.repos.find((r) => r.fullName === fullName);
    if (repo) {
      if (!repo.linkedPaths.includes(linkPath)) {
        repo.linkedPaths.push(linkPath);
        repo.updatedAt = new Date().toISOString();
        this.save();
      }
    }
  }

  removeLinkedPath(fullName: string, linkPath: string): void {
    const repo = this.config.repos.find((r) => r.fullName === fullName);
    if (repo) {
      repo.linkedPaths = repo.linkedPaths.filter((p) => p !== linkPath);
      repo.updatedAt = new Date().toISOString();
      this.save();
    }
  }

  getConfigPath(): string {
    return this.configPath;
  }
}
