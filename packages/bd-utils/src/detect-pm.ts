import { execa } from "execa";
import { existsSync } from "fs";
import { join } from "path";
import type { PackageManager } from "./types.js";

export async function detectPackageManager(): Promise<PackageManager | null> {
  const currentBin = process.execPath;

  const [bunGlobalDir, npmGlobalPrefix, yarnGlobalDir, pnpmGlobalDir] = await Promise.all([
    execa("bun", ["global", "dir"])
      .then((r) => r.stdout.trim())
      .catch(() => ""),
    execa("npm", ["root", "-g"])
      .then((r) => r.stdout.trim())
      .catch(() => ""),
    execa("yarn", ["global", "dir"])
      .then((r) => r.stdout.trim())
      .catch(() => ""),
    execa("pnpm", ["root", "-g"])
      .then((r) => r.stdout.trim())
      .catch(() => ""),
  ]);

  // Check bun
  if (bunGlobalDir && (currentBin.startsWith(bunGlobalDir) || existsSync(join(bunGlobalDir, ".bin")))) {
    return { name: "bun", command: "bun", args: ["add", "-g", "__PACKAGE__"] };
  }

  // Check yarn
  if (yarnGlobalDir && currentBin.startsWith(yarnGlobalDir)) {
    return { name: "yarn", command: "yarn", args: ["global", "add", "__PACKAGE__"] };
  }

  // Check pnpm
  if (pnpmGlobalDir && currentBin.startsWith(pnpmGlobalDir)) {
    return { name: "pnpm", command: "pnpm", args: ["add", "-g", "__PACKAGE__"] };
  }

  // Check npm
  if (npmGlobalPrefix && currentBin.startsWith(npmGlobalPrefix)) {
    return { name: "npm", command: "npm", args: ["install", "-g", "__PACKAGE__"] };
  }

  return null;
}
