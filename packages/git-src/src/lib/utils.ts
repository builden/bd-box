import { execa } from "execa";
import { dirname, join } from "path";
import { existsSync, readFileSync } from "fs";

// Package.json utilities
export function findPackageJson(): string {
  let dir = dirname(process.argv[1] || __filename);
  for (let i = 0; i < 10; i++) {
    const pkgPath = join(dir, "package.json");
    if (existsSync(pkgPath)) {
      return pkgPath;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("package.json not found");
}

export function getPackageJsonVersion(): string {
  const pkgPath = findPackageJson();
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  return pkg.version;
}

// Time utilities
export function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

// Git utilities
export async function getRepoSize(path: string): Promise<string> {
  try {
    const { stdout } = await execa("du", ["-sh", path]);
    return stdout.split("\t")[0];
  } catch {
    return "N/A";
  }
}

export async function getRepoVersion(path: string): Promise<string> {
  try {
    const { stdout } = await execa("git", ["describe", "--tags", "--always"], { cwd: path });
    return stdout.trim() || "N/A";
  } catch {
    return "N/A";
  }
}
